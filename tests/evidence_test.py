import unittest,re,hashlib,base64,json,math,zipfile,struct,zlib
from pathlib import Path
from functools import lru_cache
secrets=json.loads(Path('server/evidence-secrets.json').read_text())
def artifact(id):return Path('public/artifacts/'+id+'.txt').read_text()
def lsb_text(png):
 pos=8;compressed=b''
 while pos<len(png):
  length=struct.unpack('>I',png[pos:pos+4])[0];kind=png[pos+4:pos+8];data=png[pos+8:pos+8+length];pos+=12+length
  if kind==b'IHDR':width,height,_,color,_,_,_=struct.unpack('>IIBBBBB',data);assert color==2
  if kind==b'IDAT':compressed+=data
 raw=zlib.decompress(compressed);stride=width*3;channels=[]
 for row in range(height):channels.extend(raw[row*(stride+1)+1:row*(stride+1)+1+stride])
 bits=[value&1 for value in channels];out=[]
 for i in range(0,len(bits),8):
  byte=sum(bits[i+j]<<(7-j) for j in range(8))
  if byte==0:break
  out.append(byte)
 return bytes(out).decode()
class Evidence(unittest.TestCase):
 def verify(self,id,value):self.assertEqual(hashlib.sha256(value.encode()).hexdigest(),secrets['flags'][id])
 def test_dns(self):
  a=artifact('packet-whisperer');chunks={int(n):v for n,v in re.findall(r'session=cedar seq=(\d+) data=(\S+)',a)};p=base64.b64decode(''.join(v for _,v in sorted(chunks.items())));self.assertIn(f'length={len(p)} bytes',a);self.verify('packet-whisperer',f'CTF{{cedar:{hashlib.sha256(p).hexdigest()[:16]}}}')
 def test_nonce(self):
  a=artifact('nonce-sense');q=int(re.search(r'q=(\d+)',a)[1]);sigs=[tuple(map(int,x)) for x in re.findall(r'h=(\d+) r=(\d+) s=(\d+)',a)];h1,r,s1=sigs[0];h2,_,s2=sigs[2];k=(h1-h2)*pow(s1-s2,-1,q)%q;x=(s1*k-h1)*pow(r,-1,q)%q;h,r,s=sigs[3];k3=(h+x*r)*pow(s,-1,q)%q;self.verify('nonce-sense',f'CTF{{{x}:{k3}}}')
 def test_vm(self):
  a=artifact('dead-drop');enc=bytes.fromhex(re.search(r'against: ([a-f0-9]+)',a)[1]);state=0x37;out=[]
  for y in enc:out.append(((y>>3)|(y<<5))&255 ^ state);state=(state+y+17)&255
  self.verify('dead-drop','CTF{'+bytes(out).decode()+'}')
 def test_rsa(self):
  a=artifact('common-ground');ns=list(map(int,re.findall(r'n=(\d+)',a)));e=int(re.search(r'e=(\d+)',a)[1]);c=int(re.search(r'ciphertext=(\d+)',a)[1]);p=math.gcd(*ns[:2]);d=pow(e,-1,(p-1)*(ns[0]//p-1));m=pow(c,d,ns[0]);self.verify('common-ground','CTF{'+m.to_bytes((m.bit_length()+7)//8,'big').decode()+'}')
 def test_firmware(self):
  enc=bytes.fromhex(re.search(r'Message hex: ([a-f0-9]+)',artifact('signal-lost'))[1]);state=0x41^0x1c;out=[]
  for y in enc:b=y^state;out.append(b);state=(state+b+7)&255
  self.verify('signal-lost','CTF{'+bytes(out).decode()+'}')
 def test_scheduler(self):
  tasks={m[0]:(int(m[1]),set() if m[2]=='-' else set(m[2].split(','))) for m in re.findall(r'^(A|B|C|D|E|vault|F)\s+(\d+)\s+([A-Za-z,-]+)$',artifact('dependency-hell'),re.M)}
  best=(999,999)
  def search(done,running,time,vault):
   nonlocal best
   if time>best[0]:return
   if len(done)==len(tasks):best=min(best,(time,vault));return
   ready=[k for k,(d,deps) in tasks.items() if k not in done and k not in dict(running) and deps<=done]
   if len(running)<2 and ready:
    for k in ready:search(done,running+[(k,time+tasks[k][0])],time,vault)
   if running:
    end=min(t for _,t in running);finished={k for k,t in running if t==end};search(done|finished,[(k,t) for k,t in running if t>end],end,end if 'vault' in finished else vault)
  search(set(),[],0,0);self.verify('dependency-hell',f'CTF{{{best[0]}:{best[1]}}}')
 def test_contextual_answers(self):
  for id,flag in [('paper-trail','CTF{FDR:0725}'),('the-last-commit','CTF{b22:observe}'),('afterimage','CTF{req-72:927:140506}'),('off-the-grid','CTF{CRN:1456}')]:self.verify(id,flag)
 def test_hawkins_multifile_steganography(self):
  with zipfile.ZipFile('public/artifacts/hawkins-fourth-signal.zip') as z:
   self.assertGreaterEqual(len(z.namelist()),20)
   fragments=[]
   for number in [2,5,7,10]:fragments.append(re.search(r'FRAGMENT=(\S+)',lsb_text(z.read(f'CASE-784/cameras/frames/frame_{number:02}.png')))[1])
   core=''.join(fragments);self.assertEqual(core,'THE_GATE_CLOSES_AT_0315');self.verify('hawkins-fourth-signal',core)
   self.assertIn('CTF{RUNNING_UP_THE_WRONG_HILL}',z.read('CASE-784/archive/boxes/1986/box-11/not-a-flag.txt').decode())
 def test_nevermore_constraints_and_rickroll_decoy(self):
  with zipfile.ZipFile('public/artifacts/nevermore-murder-board.zip') as z:
   self.assertGreaterEqual(len(z.namelist()),12)
   self.assertIn('dQw4w9WgXcQ',z.read('NEVERMORE_CASE/decoys/anonymous_tip.url').decode())
  self.verify('nevermore-murder-board','CTF{RAVENS_REMEMBER_UNEDITED_INK}')
 def test_raven_chain_and_transposition(self):
  with zipfile.ZipFile('public/artifacts/ravens-of-the-seven-realms.zip') as z:
   scrolls=[]
   for name in z.namelist():
    if '/dispatches/' in name and 'forged' not in name:
     text=z.read(name).decode();canonical=text.rsplit('SEAL=',1)[0];seal=text.rsplit('SEAL=',1)[1].strip();self.assertEqual(hashlib.sha256(canonical.encode()).hexdigest(),seal);scrolls.append((int(re.search(r'SEQUENCE=(\d+)',text)[1]),re.search(r'LOCATION=(\w+)',text)[1],seal,re.search(r'PREVIOUS=(\w+)',text)[1]))
   scrolls.sort();previous='GENESIS'
   for _,_,seal,linked in scrolls:self.assertEqual(linked,previous);previous=seal
   key=''.join(place[0] for _,place,_,_ in scrolls);cipher=re.search(r'ciphertext=(\w+)',z.read('RAVEN_COURT/cipher/intercept.txt').decode())[1];size=len(cipher)//len(key);cols={col:cipher[i*size:(i+1)*size] for i,col in enumerate(sorted(range(len(key)),key=lambda n:key[n]))};core=''.join(cols[col][row] for row in range(size) for col in range(len(key))).rstrip('X');self.assertEqual(core,'THE_TRUE_HEIR_BURNS_THE_LEDGER');self.verify('ravens-of-the-seven-realms',core)
 def test_pensieve_nested_steganography(self):
  paths={'021':'astronomy','034':'runes','055':'charms','089':'history'}
  with zipfile.ZipFile('public/artifacts/pensieve-missing-hour.zip') as z:
   self.assertGreaterEqual(len(z.namelist()),24)
   fragments=[re.search(r'\] (\S+)',lsb_text(z.read(f'PENSIEVE_VAULT/faculty/{folder}/{memory}/portrait.png')))[1] for memory,folder in paths.items()]
   self.verify('pensieve-missing-hour','CTF{'+''.join(fragments)+'}')
if __name__=='__main__':unittest.main()
