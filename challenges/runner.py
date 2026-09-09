"""Authenticated control service for a dedicated disposable Docker lab host."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock, Thread
import hashlib
import hmac
import json
import os
import re
import signal
import subprocess
import sys
import time

TOKEN = os.environ.get('RUNNER_TOKEN', '')
HOST = os.environ.get('LAB_PUBLIC_HOST', '127.0.0.1')
BIND = os.environ.get('LAB_BIND_IP', '127.0.0.1')
PORT = int(os.environ.get('RUNNER_PORT', '9090'))
IMAGE = os.environ.get('LAB_IMAGE', 'cipherground-lab:local')
TTL = int(os.environ.get('LAB_TTL_SECONDS', '1800'))
MAX_LABS = int(os.environ.get('MAX_LABS', '20'))
RUNNER_ID = os.environ.get('RUNNER_ID', 'default')
MODES = {'ghost-in-the-cache': 'cache', 'signed-sealed': 'receipts'}
instances = {}
lock = Lock()


def docker(*args):
    return subprocess.check_output(['docker', *args], text=True, timeout=25).strip()


def remove(name):
    for args in [('rm', '-f', name + '-proxy'), ('rm', '-f', name), ('network', 'rm', name + '-edge'), ('network', 'rm', name + '-net')]:
        try:
            docker(*args)
        except (subprocess.SubprocessError, OSError):
            pass


def reap_once(now=None):
    now = time.time() * 1000 if now is None else now
    with lock:
        for key, lab in list(instances.items()):
            if lab['expires'] <= now:
                remove(lab['name'])
                del instances[key]


def reap():
    while True:
        time.sleep(min(10, TTL))
        reap_once()


def validate(data):
    if not isinstance(data, dict):
        raise ValueError('Expected an object')
    mode, principal, challenge, flag = (data.get(k) for k in ('mode', 'principal', 'challenge', 'flag'))
    if not all(isinstance(v, str) for v in (mode, principal, challenge, flag)):
        raise ValueError('Expected strings')
    if MODES.get(challenge) != mode or not re.fullmatch('[a-f0-9]{64}', principal) or not re.fullmatch(r'CTF\{[^\r\n]{1,95}\}', flag):
        raise ValueError('Invalid lab request')
    return mode, principal, challenge, flag


def launch(data):
    mode, principal, challenge, flag = validate(data)
    key = hashlib.sha256((principal + challenge).encode()).hexdigest()[:24]
    with lock:
        if key in instances and instances[key]['expires'] > time.time() * 1000:
            return 200, {k: v for k, v in instances[key].items() if k != 'name'}
        if key in instances:
            remove(instances[key]['name'])
            del instances[key]
        if len(instances) >= MAX_LABS:
            return 503, {'error': 'capacity reached'}
        name = f'cg-lab-{RUNNER_ID}-{key}'
        remove(name)
        try:
            docker('network', 'create', '--internal', '--label', 'cipherground.lab=true', '--label', f'cipherground.runner={RUNNER_ID}', name + '-net')
            docker('run', '-d', '--name', name, '--label', 'cipherground.lab=true', '--label', f'cipherground.runner={RUNNER_ID}',
                   '--network', name + '-net', '--read-only', '--cap-drop', 'ALL',
                   '--security-opt', 'no-new-privileges:true', '--memory', '64m', '--cpus', '0.5',
                   '--pids-limit', '32', '--ulimit', 'nofile=128:128', '--tmpfs', '/tmp:rw,noexec,nosuid,size=8m',
                   '-e', 'LAB_MODE=' + mode, '-e', 'CHALLENGE_FLAG=' + flag, IMAGE)
            # Internal-only containers cannot publish host ports on current Docker.
            # A fixed-upstream gateway bridges ingress without giving the vulnerable
            # application a default route or access to other instance networks.
            docker('network', 'create', '--label', 'cipherground.lab=true', '--label', f'cipherground.runner={RUNNER_ID}', name + '-edge')
            docker('run', '-d', '--name', name + '-proxy', '--label', 'cipherground.lab=true', '--label', f'cipherground.runner={RUNNER_ID}',
                   '--network', name + '-edge', '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges:true',
                   '--memory', '32m', '--cpus', '0.25', '--pids-limit', '32', '--ulimit', 'nofile=128:128',
                   '-p', BIND + '::8080', '-e', 'LAB_UPSTREAM=' + name, IMAGE, 'python', '-B', 'gateway.py')
            docker('network', 'connect', name + '-net', name + '-proxy')
            port = docker('port', name + '-proxy', '8080/tcp').splitlines()[0].rsplit(':', 1)[1]
            if not port.isdigit():
                raise ValueError('Invalid Docker port')
            lab = {'name': name, 'url': f'http://{HOST}:{port}', 'expires': int(time.time() * 1000) + TTL * 1000}
            instances[key] = lab
            return 201, {k: v for k, v in lab.items() if k != 'name'}
        except Exception:
            # Failed startup must not leave an untracked container or network.
            remove(name)
            raise


class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(10)

    def log_message(self, *_args):
        pass

    def reply(self, status, data):
        raw = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(raw)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(raw)

    def do_POST(self):
        if not TOKEN or not hmac.compare_digest(self.headers.get('Authorization', ''), 'Bearer ' + TOKEN):
            return self.reply(401, {'error': 'unauthorized'})
        if self.path != '/instances':
            return self.reply(404, {'error': 'not found'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 4096:
                return self.reply(413, {'error': 'invalid body size'})
            raw = self.rfile.read(length)
            if len(raw) != length:
                raise ValueError('Incomplete body')
            data = json.loads(raw)
            status, result = launch(data)
            self.reply(status, result)
        except (ValueError, TypeError, UnicodeError):
            self.reply(400, {'error': 'invalid request'})
        except (subprocess.SubprocessError, OSError, IndexError):
            self.reply(503, {'error': 'lab unavailable'})


def recover():
    # Scope cleanup to this runner; independent runners and CI retain their resources.
    label = f'label=cipherground.runner={RUNNER_ID}'
    for old in docker('ps', '-a', '--format', '{{.Names}}', '--filter', label).splitlines():
        remove(old)
    for old in docker('network', 'ls', '-q', '--filter', label).splitlines():
        try:
            docker('network', 'rm', old)
        except subprocess.CalledProcessError:
            pass


def cleanup(*_args):
    for lab in list(instances.values()):
        remove(lab['name'])
    sys.exit(0)


if __name__ == '__main__':
    if len(TOKEN) < 32:
        raise SystemExit('RUNNER_TOKEN must contain at least 32 characters')
    if not re.fullmatch('[a-z0-9-]{1,24}', RUNNER_ID) or not 1 <= TTL <= 3600 or not 1 <= MAX_LABS <= 100:
        raise SystemExit('Invalid RUNNER_ID, LAB_TTL_SECONDS or MAX_LABS')
    recover()
    signal.signal(signal.SIGTERM, cleanup)
    signal.signal(signal.SIGINT, cleanup)
    Thread(target=reap, daemon=True).start()
    ThreadingHTTPServer((os.environ.get('RUNNER_BIND_IP', '127.0.0.1'), PORT), Handler).serve_forever()
