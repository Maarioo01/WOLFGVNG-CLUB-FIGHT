# Tiny dev server with caching disabled:  python serve.py  ->  http://localhost:8765
import http.server, os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
class Server(http.server.ThreadingHTTPServer):
    # the browser asks for ~40 files at once (scripts + sprite sheets); the default queue of 5 drops some
    request_queue_size = 128
    daemon_threads = True
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
print(f'WOLFGVNG Club Fight -> http://localhost:{port}')
Server(('', port), H).serve_forever()
