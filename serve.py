"""
Medroute Local Development & Preview Server
Starts a robust local HTTP server with healthcheck and clean error handling.
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import json

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MedrouteHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Health check endpoint for monitoring/probes
        if self.path == "/api/health" or self.path.startswith("/api/health"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            response = json.dumps({"status": "ok", "app": "Medroute", "uptime": "active"}).encode("utf-8")
            self.wfile.write(response)
            return

        # Quiet favicon requests if missing
        if self.path == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return

        # Default static file handling
        try:
            super().do_GET()
        except (ConnectionResetError, BrokenPipeError):
            pass

    def log_message(self, format, *args):
        # Clean logging
        sys.stderr.write(f"[{self.log_date_time_string()}] {format % args}\n")

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def run():
    os.chdir(DIRECTORY)
    port = PORT
    for attempt in range(5):
        try:
            with ReusableTCPServer(("", port), MedrouteHandler) as httpd:
                url = f"http://localhost:{port}"
                print("=" * 60)
                print("  MEDROUTE HEALTHCARE PLATFORM RUNNING")
                print("=" * 60)
                print(f"  Serving directory: {DIRECTORY}")
                print(f"  Preview URL:       {url}")
                print("=" * 60)
                print("  Press Ctrl+C to stop the server.")
                print("=" * 60)
                sys.stdout.flush()
                
                if "--no-open" not in sys.argv:
                    webbrowser.open(url)
                    
                httpd.serve_forever()
                break
        except OSError as e:
            if attempt == 4:
                print(f"Could not bind to port {port}: {e}")
                sys.exit(1)
            port += 1

if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        print("\nMedroute server stopped cleanly.")
