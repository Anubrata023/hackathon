#!/usr/bin/env python3
"""
Guwahati Municipal Corporation — Citizen Service Portal Backend
================================================================
Pure-stdlib Python 3.x backend (no external dependencies).
Serves REST API on http://localhost:8000

Architecture:
  server.py       — HTTP server + router
  db.py           — SQLite data layer (models + queries)
  auth.py         — JWT-like auth (HMAC-SHA256 tokens)
  handlers/       — one module per feature domain
  config.py       — environment / constants

Run:
  python server.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import traceback
import importlib

import config
from db import init_db
import auth

# ── Lazy-import handlers ────────────────────────────────────────────────────
from handlers import (
    citizens, services, complaints, water, garbage,
    tax, trade_licence, certificates, building_plan, rti,
    notices, documents, payments, search
)

ROUTES = [
    # Auth
    ("POST", "/api/auth/register",          citizens.register),
    ("POST", "/api/auth/login",             citizens.login),
    ("GET",  "/api/auth/profile",           citizens.profile),
    ("PUT",  "/api/auth/profile",           citizens.update_profile),

    # Services catalogue
    ("GET",  "/api/services",               services.list_services),
    ("GET",  "/api/services/{id}",          services.get_service),

    # Complaints / Jan Sunwai
    ("GET",  "/api/complaints",             complaints.list_complaints),
    ("POST", "/api/complaints",             complaints.create_complaint),
    ("GET",  "/api/complaints/{id}",        complaints.get_complaint),
    ("PUT",  "/api/complaints/{id}/status", complaints.update_status),

    # Water Supply
    ("GET",  "/api/water/connections",      water.list_connections),
    ("POST", "/api/water/connections",      water.apply_connection),
    ("POST", "/api/water/leakages",         water.report_leakage),
    ("GET",  "/api/water/quality/{ward}",   water.ward_quality),

    # Garbage & Sanitation
    ("POST", "/api/garbage/report",         garbage.report_missed),
    ("POST", "/api/garbage/bulk-pickup",    garbage.schedule_bulk),
    ("GET",  "/api/garbage/schedule/{ward}",garbage.get_schedule),

    # Property Tax
    ("GET",  "/api/tax/calculate",          tax.calculate_tax),
    ("GET",  "/api/tax/dues",               tax.get_dues),
    ("POST", "/api/tax/pay",                tax.pay_tax),
    ("GET",  "/api/tax/receipts",           tax.list_receipts),
    ("GET",  "/api/tax/receipts/{id}",      tax.get_receipt),

    # Trade Licence
    ("GET",  "/api/trade-licence",          trade_licence.list_licences),
    ("POST", "/api/trade-licence",          trade_licence.apply_licence),
    ("PUT",  "/api/trade-licence/{id}/renew", trade_licence.renew_licence),
    ("GET",  "/api/trade-licence/{id}",     trade_licence.get_licence),

    # Birth & Death Certificates
    ("GET",  "/api/certificates",           certificates.list_certificates),
    ("POST", "/api/certificates/apply",     certificates.apply_certificate),
    ("GET",  "/api/certificates/{id}/download", certificates.download_certificate),

    # Building Plan Approval
    ("GET",  "/api/building-plans",         building_plan.list_plans),
    ("POST", "/api/building-plans",         building_plan.submit_plan),
    ("GET",  "/api/building-plans/{id}",    building_plan.get_plan),

    # RTI
    ("GET",  "/api/rti",                    rti.list_requests),
    ("POST", "/api/rti",                    rti.file_request),
    ("GET",  "/api/rti/{id}",              rti.get_request),

    # AI Document Verification
    ("POST", "/api/documents/verify",       documents.verify_document),
    ("GET",  "/api/documents/{id}",         documents.get_verification),

    # Notices & Circulars
    ("GET",  "/api/notices",                notices.list_notices),
    ("GET",  "/api/notices/{id}",           notices.get_notice),

    # Payments (generic gateway)
    ("POST", "/api/payments/initiate",      payments.initiate),
    ("GET",  "/api/payments/{ref}/status",  payments.get_status),

    # Global search
    ("GET",  "/api/search",                 search.global_search),

    # Stats (hero band numbers)
    ("GET",  "/api/stats",                  services.get_stats),
]


def match_route(method, path):
    """Return (handler_fn, path_params_dict) or (None, {})."""
    for route_method, pattern, handler in ROUTES:
        if route_method != method:
            continue
        params = _match_pattern(pattern, path)
        if params is not None:
            return handler, params
    return None, {}


def _match_pattern(pattern, path):
    """Simple {param} pattern matching. Returns dict or None."""
    p_parts = pattern.rstrip("/").split("/")
    r_parts = path.rstrip("/").split("/")
    if len(p_parts) != len(r_parts):
        return None
    params = {}
    for pp, rp in zip(p_parts, r_parts):
        if pp.startswith("{") and pp.endswith("}"):
            params[pp[1:-1]] = rp
        elif pp != rp:
            return None
    return params


class GMCHandler(BaseHTTPRequestHandler):
    server_version = "GMCPortal/1.0"
    error_content_type = "application/json"

    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    # ── Entry points ───────────────────────────────────────────────────────

    def do_OPTIONS(self):
        self._send_cors_headers(204)
        self.end_headers()

    def do_GET(self):    self._dispatch("GET")
    def do_POST(self):   self._dispatch("POST")
    def do_PUT(self):    self._dispatch("PUT")
    def do_DELETE(self): self._dispatch("DELETE")
    def do_PATCH(self):  self._dispatch("PATCH")

    # ── Dispatch ───────────────────────────────────────────────────────────

    def _dispatch(self, method):
        parsed = urlparse(self.path)
        path   = parsed.path
        query  = parse_qs(parsed.query, keep_blank_values=True)

        # Serve static frontend
        if not path.startswith("/api/"):
            self._serve_static(path)
            return

        handler_fn, path_params = match_route(method, path)
        if handler_fn is None:
            self._json({"error": "Not Found", "path": path}, 404)
            return

        # Build context passed to every handler
        ctx = RequestContext(self, method, path, query, path_params)

        try:
            result = handler_fn(ctx)
            if result is None:
                result = {}
            status = result.pop("_status", 200) if isinstance(result, dict) else 200
            self._json(result, status)
        except auth.AuthError as e:
            self._json({"error": str(e)}, 401)
        except ValueError as e:
            self._json({"error": str(e)}, 400)
        except Exception:
            traceback.print_exc()
            self._json({"error": "Internal Server Error"}, 500)

    # ── Helpers ────────────────────────────────────────────────────────────

    def _json(self, data, status=200):
        body = json.dumps(data, default=str, ensure_ascii=False).encode()
        self._send_cors_headers(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_cors_headers(self, status=200):
        self.send_response(status)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _serve_static(self, path):
        if path == "/" or path == "":
            path = "/index.html"
        static_path = os.path.join(config.STATIC_DIR, path.lstrip("/"))
        if os.path.isfile(static_path):
            with open(static_path, "rb") as f:
                data = f.read()
            ext = os.path.splitext(static_path)[1]
            mime = {"html": "text/html", "js": "application/javascript",
                    "css": "text/css", "json": "application/json",
                    "png": "image/png", "svg": "image/svg+xml"}.get(ext.lstrip("."), "application/octet-stream")
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        else:
            # SPA fallback — serve index.html
            index = os.path.join(config.STATIC_DIR, "index.html")
            if os.path.isfile(index):
                self._serve_static("/index.html")
            else:
                self._json({"error": "Not Found"}, 404)


class RequestContext:
    """Thin wrapper giving handlers clean access to request data."""

    def __init__(self, handler: GMCHandler, method, path, query, path_params):
        self._handler   = handler
        self.method     = method
        self.path       = path
        self.query      = query          # dict[str, list[str]]
        self.path_params = path_params   # dict[str, str]
        self._body      = None
        self._user      = None

    # ── Body ──────────────────────────────────────────────────────────────

    @property
    def body(self):
        if self._body is None:
            length = int(self._handler.headers.get("Content-Length", 0))
            raw = self._handler.rfile.read(length) if length else b""
            ct = self._handler.headers.get("Content-Type", "")
            if "application/json" in ct and raw:
                self._body = json.loads(raw)
            else:
                self._body = {}
        return self._body

    def require(self, *fields):
        """Raise ValueError if any field missing from body."""
        missing = [f for f in fields if not self.body.get(f)]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")
        return {f: self.body[f] for f in fields}

    def q(self, key, default=None):
        vals = self.query.get(key, [])
        return vals[0] if vals else default

    # ── Auth ──────────────────────────────────────────────────────────────

    @property
    def current_user(self):
        if self._user is None:
            self._user = auth.get_current_user(self._handler.headers)
        return self._user

    def require_auth(self):
        user = self.current_user
        if not user:
            raise auth.AuthError("Authentication required")
        return user


# ── Main ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    host, port = config.HOST, config.PORT
    server = HTTPServer((host, port), GMCHandler)
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║   Guwahati Municipal Corporation — Backend Server            ║
║   http://{host}:{port}                                        ║
╚══════════════════════════════════════════════════════════════╝
  API Base : http://{host}:{port}/api
  Docs     : See README.md for all endpoints
  DB       : {config.DB_PATH}
""")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down…")
        server.server_close()
