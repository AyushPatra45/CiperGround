"""Opt-in real Docker checks. Uses a unique runner namespace; never removes other labs."""
import hashlib
import json
import os
import secrets
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request

runner_id = 'test-' + secrets.token_hex(5)
token = secrets.token_hex(32)
proc = None

def docker(*args):
    return subprocess.check_output(['docker', *args], text=True, timeout=40).strip()

def wait_until(fn, seconds=45):
    end = time.monotonic() + seconds
    while time.monotonic() < end:
        try:
            value = fn()
            if value:
                return value
        except (OSError, subprocess.SubprocessError):
            pass
        time.sleep(.25)
    raise AssertionError('Timed out waiting for Docker lab state')

def resources(kind):
    args = ['ps', '-aq'] if kind == 'container' else ['network', 'ls', '-q']
    return docker(*args, '--filter', f'label=cipherground.runner={runner_id}')

def post(data, auth=token):
    request = urllib.request.Request(base + '/instances', data=json.dumps(data).encode(), headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + auth})
    try:
        response = urllib.request.urlopen(request, timeout=40)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, json.load(response)

def start():
    return subprocess.Popen([sys.executable, 'challenges/runner.py'], env=env, stdout=subprocess.DEVNULL)

def lab_request(url):
    with urllib.request.urlopen(url, timeout=3) as response:
        return json.load(response)

try:
    docker('info')
    docker('image', 'inspect', os.environ.get('LAB_IMAGE', 'cipherground-lab:local'))
    with socket.socket() as port_socket:
        port_socket.bind(('127.0.0.1', 0))
        port = port_socket.getsockname()[1]
    base = f'http://127.0.0.1:{port}'
    env = {**os.environ, 'RUNNER_TOKEN': token, 'RUNNER_PORT': str(port), 'RUNNER_ID': runner_id, 'MAX_LABS': '2', 'LAB_TTL_SECONDS': '30'}
    proc = start()
    wait_until(lambda: post({}, auth='invalid')[0] == 401)
    assert post([])[0] == 400
    data = {'principal': 'a' * 64, 'challenge': 'ghost-in-the-cache', 'mode': 'cache', 'flag': 'CTF{docker_test}'}
    code, first = post(data)
    assert code == 201, first
    assert post(data) == (200, first)
    code, second = post({**data, 'principal': 'b' * 64})
    assert code == 201 and first['url'] != second['url']
    assert post({**data, 'principal': 'c' * 64})[0] == 503
    names = [f'cg-lab-{runner_id}-' + hashlib.sha256((p * 64 + data['challenge']).encode()).hexdigest()[:24] for p in ['a', 'b']]
    config = json.loads(docker('inspect', *names))
    nets = []
    for container in config:
        host = container['HostConfig']
        assert container['Config']['User'] == '65534:65534'
        assert host['ReadonlyRootfs'] and host['Memory'] == 64 * 1024 * 1024
        assert host['PidsLimit'] == 32 and host['NanoCpus'] == 500000000
        assert 'ALL' in host['CapDrop'] and 'no-new-privileges:true' in host['SecurityOpt']
        network = next(iter(container['NetworkSettings']['Networks']))
        assert json.loads(docker('network', 'inspect', network))[0]['Internal']
        nets.append(network)
    assert nets[0] != nets[1]
    peer_ip = config[1]['NetworkSettings']['Networks'][nets[1]]['IPAddress']
    probe = "import socket,sys; s=socket.socket(); s.settimeout(2); sys.exit(1 if s.connect_ex((sys.argv[1],8080)) == 0 else 0)"
    docker('exec', names[0], 'python', '-c', probe, peer_ip)
    wait_until(lambda: lab_request(first['url'] + '/'))
    assert lab_request(first['url'] + '/support/preview?path=/invoice/private%3Bpreview=1')['status'] == 'preview cached'
    assert lab_request(first['url'] + '/gateway?path=/invoice/private')['flag'] == data['flag']
    # A hard crash leaves resources; the next instance of this runner reclaims them.
    proc.kill(); proc.wait(timeout=5)
    assert resources('container')
    proc = start()
    wait_until(lambda: post({}, auth='invalid')[0] == 401)
    assert not resources('container') and not resources('network')
    assert post(data)[0] == 201
    wait_until(lambda: not resources('container') and not resources('network'), seconds=45)
    print('Docker integration passed: auth, validation, reuse, capacity, flags, resource limits, cross-instance isolation, crash recovery and TTL cleanup.')
finally:
    if proc and proc.poll() is None:
        proc.terminate()
        proc.wait(timeout=40)
    # Failure cleanup is strictly scoped to this test's random runner ID.
    for kind in ['container', 'network']:
        try:
            for resource in resources(kind).splitlines():
                docker('rm', '-f', resource) if kind == 'container' else docker('network', 'rm', resource)
        except (OSError, subprocess.SubprocessError):
            pass
