"""Real HTTP regressions for the gateway and both intended lab exploit chains."""
import importlib.util
import json
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import unittest
from unittest.mock import patch

ROOT = Path(__file__).parents[1]


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


class Gateway(unittest.TestCase):
    def start(self, mode='cache'):
        lab = module('lab_fixture', 'challenges/web/lab.py')
        lab.MODE = mode
        lab.FLAG = 'CTF{gateway_integration}'
        upstream = ThreadingHTTPServer(('127.0.0.1', 0), lab.Handler)
        with patch.dict('os.environ', {'LAB_UPSTREAM': '127.0.0.1'}):
            gateway = module('gateway_fixture', 'challenges/web/gateway.py')
        # Only redirect the fixed fixture port; all requests use real HTTP sockets.
        connection = patch.object(gateway, 'HTTPConnection', side_effect=lambda host, _port, timeout: HTTPConnection(host, upstream.server_port, timeout=timeout))
        connection.start()
        self.addCleanup(connection.stop)
        self.gateway = ThreadingHTTPServer(('127.0.0.1', 0), gateway.Gateway)
        for server in [upstream, self.gateway]:
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            self.addCleanup(lambda server=server, thread=thread: (server.shutdown(), server.server_close(), thread.join(timeout=3)))

    def request(self, path, method='GET', body=None, headers=None):
        connection = HTTPConnection('127.0.0.1', self.gateway.server_port, timeout=5)
        try:
            connection.request(method, path, body=body, headers=headers or {})
            response = connection.getresponse()
            raw = response.read()
            return response.status, json.loads(raw) if response.getheader('Content-Type', '').startswith('application/json') else raw
        finally:
            connection.close()

    def test_cache_chain_through_gateway(self):
        self.start()
        self.assertEqual(self.request('/gateway?path=/invoice/private')[0], 403)
        self.assertEqual(self.request('/support/preview?path=/invoice/private%3Bpreview=1')[0], 202)
        self.assertEqual(self.request('/gateway?path=/invoice/private')[1]['flag'], 'CTF{gateway_integration}')

    def test_receipt_chain_preserves_signed_body_and_duplicate_field(self):
        self.start('receipts')
        order = self.request('/checkout')[1]['order']
        receipt = self.request('/receipt?order=' + order)[1]
        headers = {'X-Signature': receipt['signature']}
        self.assertEqual(self.request('/dispatch', 'POST', receipt['receipt'], headers)[0], 403)
        self.assertEqual(self.request('/dispatch', 'POST', receipt['receipt'] + '&role=dispatcher', headers)[1]['flag'], 'CTF{gateway_integration}')

    def test_gateway_rejects_proxying_and_unbounded_request_framing(self):
        self.start()
        self.assertEqual(self.request('http://example.test/')[0], 400)
        self.assertEqual(self.request('/', 'POST', headers={'Content-Length': '16001'})[0], 400)
        self.assertEqual(self.request('/', 'POST', headers={'Transfer-Encoding': 'chunked'})[0], 400)
