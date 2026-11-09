"""Local preview with the same clean page URLs as the Vercel deployment."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent

class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        path = urlsplit(self.path).path
        if path in ('/marijuana-odor-removal-houston', '/marijuana-odor-removal-houston.html'):
            self.send_response(308)
            self.send_header('Location', '/smoke-odor-removal-houston')
            self.end_headers()
            return
        if path in ('/mold-odor-removal-houston', '/mold-odor-removal-houston.html'):
            self.send_response(308)
            self.send_header('Location', '/services')
            self.end_headers()
            return
        if not Path(path).suffix and path != '/':
            candidate = Path(self.translate_path(path + '.html'))
            if candidate.is_file():
                self.path = path + '.html'
            elif Path(self.translate_path(path + '/index.html')).is_file():
                self.path = path + '/index.html'
        super().do_GET()

    def do_POST(self):
        self.send_response(503)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"error":"Email delivery is only available on the configured live deployment."}')

if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 8096), PreviewHandler).serve_forever()
