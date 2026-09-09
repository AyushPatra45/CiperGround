"""Fixed-upstream HTTP gateway; only this trusted sidecar publishes a host port."""
from http.client import HTTPConnection, HTTPException
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import os

UPSTREAM = os.environ['LAB_UPSTREAM']
HOP_HEADERS = {'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'host', 'content-length'}


class Gateway(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(10)

    def log_message(self, *_args):
        pass

    def forward(self):
        upstream = None
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not self.path.startswith('/') or self.headers.get('Transfer-Encoding') or not 0 <= length <= 16000:
                return self.send_error(400)
            body = self.rfile.read(length) if length else None
            if body is not None and len(body) != length:
                return self.send_error(400)
            connection_headers = {h.strip().lower() for h in self.headers.get('Connection', '').split(',')}
            headers = {k: v for k, v in self.headers.items() if k.lower() not in HOP_HEADERS | connection_headers}
            # Request input never selects a destination; absolute-form proxying is rejected.
            upstream = HTTPConnection(UPSTREAM, 8080, timeout=10)
            upstream.request(self.command, self.path, body=body, headers=headers)
            response = upstream.getresponse()
            payload = response.read(1_000_001)
            if len(payload) > 1_000_000:
                return self.send_error(502)
            self.send_response(response.status)
            response_connection = {h.strip().lower() for h in (response.getheader('Connection') or '').split(',')}
            for key, value in response.getheaders():
                if key.lower() not in HOP_HEADERS | response_connection:
                    self.send_header(key, value)
            self.send_header('Content-Length', str(len(payload)))
            self.send_header('Connection', 'close')
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(payload)
        except (ValueError, OSError, HTTPException):
            self.send_error(502)
        finally:
            if upstream:
                upstream.close()
            self.close_connection = True

    do_GET = forward
    do_POST = forward
    do_HEAD = forward


if __name__ == '__main__':
    ThreadingHTTPServer(('0.0.0.0', 8080), Gateway).serve_forever()
