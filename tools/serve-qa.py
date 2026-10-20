from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit,parse_qs
from pathlib import Path
import os
root=Path(__file__).resolve().parents[2]
os.chdir(root)
class QA(SimpleHTTPRequestHandler):
 def do_GET(self):
  parsed=urlsplit(self.path)
  if parse_qs(parsed.query).get('qa_no_webgl')==['1'] and parsed.path.rstrip('/').endswith('ISWAS_v16.3'):
   body=(root/'ISWAS_v16.3/index.html').read_text().replace('<head>','<head><script>const originalCanvasContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...rest){if(/webgl/i.test(type))return null;return originalCanvasContext.call(this,type,...rest)};</script>',1).encode()
   self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body);return
  super().do_GET()
ThreadingHTTPServer(('127.0.0.1',8107),QA).serve_forever()
