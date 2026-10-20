"""Local-only failure injection for gallery startup; never included in releases."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os,sys,time
os.chdir(Path(__file__).resolve().parents[2])
mode=sys.argv[1] if len(sys.argv)>1 else 'failed'
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path.split('?')[0].endswith('lodge-canvas-v17-9.js'):
   if mode=='failed':self.send_error(503,'Test: scene unavailable');return
   if mode=='slow':time.sleep(15)
  super().do_GET()
ThreadingHTTPServer(('127.0.0.1',8111),Handler).serve_forever()
