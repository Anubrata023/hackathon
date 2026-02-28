"""
auth.py — HMAC-SHA256 token authentication (JWT-compatible structure).

Token format:  base64(header).base64(payload).HMAC-SHA256(header.payload, secret)
"""
import base64
import hashlib
import hmac
import json
import time

import config


class AuthError(Exception):
    pass


# ── Token generation ──────────────────────────────────────────────────────

def _b64enc(data: dict) -> str:
    return base64.urlsafe_b64encode(
        json.dumps(data, separators=(",", ":")).encode()
    ).rstrip(b"=").decode()


def _b64dec(s: str) -> dict:
    padding = 4 - len(s) % 4
    s = s + "=" * (padding % 4)
    return json.loads(base64.urlsafe_b64decode(s))


def create_token(citizen_id: int, mobile: str) -> str:
    header  = _b64enc({"alg": "HS256", "typ": "JWT"})
    payload = _b64enc({
        "sub": citizen_id,
        "mob": mobile,
        "iat": int(time.time()),
        "exp": int(time.time()) + config.JWT_EXPIRY_DAYS * 86400,
    })
    sig_input = f"{header}.{payload}".encode()
    signature = hmac.new(
        config.JWT_SECRET.encode(), sig_input, hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).rstrip(b"=").decode()
    return f"{header}.{payload}.{sig_b64}"


def verify_token(token: str) -> dict:
    """Return payload dict or raise AuthError."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise AuthError("Malformed token")
        header, payload_b64, sig = parts
        sig_input = f"{header}.{payload_b64}".encode()
        expected_sig = hmac.new(
            config.JWT_SECRET.encode(), sig_input, hashlib.sha256
        ).digest()
        expected_b64 = base64.urlsafe_b64encode(expected_sig).rstrip(b"=").decode()
        if not hmac.compare_digest(sig, expected_b64):
            raise AuthError("Invalid token signature")
        payload = _b64dec(payload_b64)
        if payload.get("exp", 0) < time.time():
            raise AuthError("Token expired")
        return payload
    except AuthError:
        raise
    except Exception:
        raise AuthError("Invalid token")


# ── Request-level helpers ────────────────────────────────────────────────

def get_current_user(headers) -> dict | None:
    """Extract and verify Bearer token from Authorization header.
    Returns payload dict (with sub=citizen_id) or None if not authenticated."""
    auth_hdr = headers.get("Authorization", "")
    if not auth_hdr.startswith("Bearer "):
        return None
    token = auth_hdr[7:].strip()
    try:
        return verify_token(token)
    except AuthError:
        return None


# ── Password helpers ─────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def check_password(password: str, hashed: str) -> bool:
    return hmac.compare_digest(hash_password(password), hashed)
