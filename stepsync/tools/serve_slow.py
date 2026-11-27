"""Static server for headless-Chrome dev runs (from the repo root): python3 stepsync/tools/serve_slow.py -> http://127.0.0.1:8002/
GET /__sleep?s=N answers after N seconds; a page that includes <img src="/__sleep?s=N"> delays its load event,
so `chrome --headless=new --dump-dom` waits for async work (video seeking, MediaPipe, camera, audio decoding)."""
import http.server, time
class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/__sleep'):
            time.sleep(float(self.path.split('=')[1])); self.send_response(204); self.end_headers(); return
        super().do_GET()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', 8002), H).serve_forever()
