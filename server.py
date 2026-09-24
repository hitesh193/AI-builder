#!/usr/bin/env python3
"""
Medroute Healthcare Super-App - Local Development & API Server
Serves static frontend pages and provides live JSON REST endpoints for:
- /api/health
- /api/search
- /api/claim-status
- /api/book-consultation
- /api/order-medicines
"""

import http.server
import socketserver
import json
import urllib.parse
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MedrouteRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and disable aggressive caching for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        
        # Route: /api/health
        if parsed.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {
                "status": "healthy",
                "app": "Medroute Healthcare Super-App",
                "version": "1.0.0",
                "tpa_gateway": "Connected (Medi Assist TPA)",
                "pincode_engine": "Active"
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return

        # Route: /api/claim-status?id=MED-78291
        elif parsed.path == '/api/claim-status':
            query = urllib.parse.parse_qs(parsed.query)
            claim_id = query.get('id', ['MED-78291'])[0].upper()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            claims = {
                "MED-78291": {
                    "claimId": "MED-78291",
                    "patient": "Sunita Sharma",
                    "hospital": "Fortis Memorial Research Institute (FMRI), Gurugram",
                    "procedure": "Laparoscopic Cholecystectomy",
                    "status": "Cashless Pre-Authorization Approved",
                    "approvedAmount": 80000,
                    "tpa": "Medi Assist Insurance TPA"
                },
                "MED-44120": {
                    "claimId": "MED-44120",
                    "patient": "Rahul Verma",
                    "hospital": "Fortis Hospital, Sector 62, Mohali, Punjab",
                    "procedure": "Arthroscopic ACL Reconstruction",
                    "status": "Settled 100% Cashless",
                    "approvedAmount": 115000,
                    "tpa": "Medi Assist Insurance TPA"
                }
            }
            
            data = claims.get(claim_id, {
                "claimId": claim_id,
                "status": "In Review",
                "message": "Claim is currently under medical adjudicator evaluation."
            })
            self.wfile.write(json.dumps(data).encode('utf-8'))
            return

        # Default: Serve static files
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        if parsed.path == '/api/book-consultation':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            booking_id = "APT-" + str(os.urandom(2).hex()).upper()
            res = {
                "success": True,
                "bookingId": booking_id,
                "status": "Confirmed",
                "message": "Appointment confirmed. Video session link generated."
            }
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return

        elif parsed.path == '/api/order-medicines':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            order_id = "ORD-" + str(os.urandom(2).hex()).upper()
            res = {
                "success": True,
                "orderId": order_id,
                "status": "Processing",
                "estimatedDelivery": "Within 24 Hours"
            }
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

def run_server():
    server_address = ('', PORT)
    try:
        httpd = socketserver.TCPServer(server_address, MedrouteRequestHandler)
    except OSError:
        print(f"Port {PORT} in use, attempting on port 8080...")
        httpd = socketserver.TCPServer(('', 8080), MedrouteRequestHandler)
        print("Server running at http://localhost:8080")
        httpd.serve_forever()
        return

    print("=" * 60)
    print(f"  [+] Medroute Healthcare Super-App is running!")
    print(f"  Local Web Address : http://localhost:{PORT}")
    print(f"  Root Directory    : {DIRECTORY}")
    print("=" * 60)
    print("Press Ctrl+C to stop the server.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer shutting down gracefully.")
        httpd.shutdown()

if __name__ == '__main__':
    run_server()
