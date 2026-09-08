"""Dedicated lab host only; never run this next to the platform database."""
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from threading import Lock,Thread
from urllib.parse import urlsplit
import os,json,subprocess,time,hmac,hashlib,signal,sys
TOKEN=os.environ.get('RUNNER_TOKEN','');HOST=os.environ.get('LAB_PUBLIC_HOST','127.0.0.1')
BIND=os.environ.get('LAB_BIND_IP','127.0.0.1');PORT=int(os.environ.get('RUNNER_PORT','9090'))
IMAGE=os.environ.get('LAB_IMAGE','cipherground-lab:local');TTL=1800;MAX_LABS=int(os.environ.get('MAX_LABS','20'))
instances={};lock=Lock()
def docker(*args):return subprocess.check_output(['docker',*args],text=True,timeout=25).strip()
def remove(name):
 try:docker('rm','-f',name)
 except (subprocess.SubprocessError,OSError):pass
 try:docker('network','rm',name+'-net')
 except (subprocess.SubprocessError,OSError):pass
def reap():
 while True:
  time.sleep(10)
  with lock:
   for key,lab in list(instances.items()):
    if lab['expires']<time.time()*1000:remove(lab['name']);del instances[key]
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def reply(self,status,data):
  raw=json.dumps(data).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
 def do_POST(self):
  if not hmac.compare_digest(self.headers.get('Authorization',''),'Bearer '+TOKEN):return self.reply(401,{'error':'unauthorized'})
  if self.path!='/instances':return self.reply(404,{'error':'not found'})
  try:
   length=int(self.headers.get('Content-Length','0'))
   if not 0<length<=4096:return self.reply(413,{'error':'invalid body size'})
   data=json.loads(self.rfile.read(length));mode=data.get('mode');p=data.get('principal','');c=data.get('challenge','');flag=data.get('flag','')
   if {'ghost-in-the-cache':'cache','signed-sealed':'receipts'}.get(c)!=mode or len(p)!=64 or any(x not in '0123456789abcdef' for x in p) or not flag.startswith('CTF{') or len(flag)>100:return self.reply(400,{'error':'invalid request'})
   key=hashlib.sha256((p+c).encode()).hexdigest()[:24]
   with lock:
    if key in instances and instances[key]['expires']>time.time()*1000:return self.reply(200,{k:v for k,v in instances[key].items() if k!='name'})
    if key in instances:remove(instances[key]['name']);del instances[key]
    if len(instances)>=MAX_LABS:return self.reply(503,{'error':'capacity reached'})
    name='cg-lab-'+key;remove(name)
    docker('network','create','--internal','--label','cipherground.lab=true',name+'-net')
    docker('run','-d','--name',name,'--label','cipherground.lab=true','--network',name+'-net','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges:true','--memory','64m','--cpus','0.5','--pids-limit','32','--ulimit','nofile=128:128','--tmpfs','/tmp:rw,noexec,nosuid,size=8m','-p',BIND+'::8080','-e','LAB_MODE='+mode,'-e','CHALLENGE_FLAG='+flag,IMAGE)
    port=docker('port',name,'8080/tcp').splitlines()[0].rsplit(':',1)[1]
    lab={'name':name,'url':'http://'+HOST+':'+port,'expires':int(time.time()*1000)+TTL*1000};instances[key]=lab
    self.reply(201,{k:v for k,v in lab.items() if k!='name'})
  except (ValueError,KeyError,subprocess.SubprocessError,OSError):self.reply(503,{'error':'lab unavailable'})
def cleanup(*_):
 for lab in list(instances.values()):remove(lab['name'])
 sys.exit(0)
if __name__=='__main__':
 if len(TOKEN)<32:raise SystemExit('RUNNER_TOKEN must contain at least 32 characters')
 # Recover safely from a runner restart; old instances must not remain indefinitely.
 for old in docker('ps','-a','--format','{{.Names}}','--filter','label=cipherground.lab=true').splitlines():remove(old)
 for old in docker('network','ls','-q','--filter','label=cipherground.lab=true').splitlines():
  try:docker('network','rm',old)
  except subprocess.CalledProcessError:pass
 signal.signal(signal.SIGTERM,cleanup);signal.signal(signal.SIGINT,cleanup)
 Thread(target=reap,daemon=True).start()
 ThreadingHTTPServer((os.environ.get('RUNNER_BIND_IP','127.0.0.1'),PORT),Handler).serve_forever()
