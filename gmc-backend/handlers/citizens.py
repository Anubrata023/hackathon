"""handlers/citizens.py — Citizen registration, login, profile."""
import secrets
import auth
from db import q, run


def register(ctx):
    """POST /api/auth/register"""
    data = ctx.body
    mobile   = data.get("mobile", "").strip()
    name     = data.get("name", "").strip()
    password = data.get("password", "")
    email    = data.get("email", "").strip()
    ward     = data.get("ward")
    address  = data.get("address", "").strip()

    if not mobile or not name or not password:
        raise ValueError("mobile, name and password are required")
    if len(mobile) != 10 or not mobile.isdigit():
        raise ValueError("mobile must be a 10-digit number")
    if len(password) < 6:
        raise ValueError("password must be at least 6 characters")

    existing = q("SELECT id FROM citizens WHERE mobile=?", (mobile,), one=True)
    if existing:
        raise ValueError("Mobile number already registered")

    pw_hash = auth.hash_password(password)
    cid = run(
        "INSERT INTO citizens(mobile,name,email,ward,address,password_hash) VALUES(?,?,?,?,?,?)",
        (mobile, name, email or None, ward, address or None, pw_hash)
    )
    token = auth.create_token(cid, mobile)
    return {"message": "Registration successful", "token": token,
            "citizen": {"id": cid, "mobile": mobile, "name": name}}


def login(ctx):
    """POST /api/auth/login"""
    data = ctx.body
    mobile   = data.get("mobile", "").strip()
    password = data.get("password", "")

    if not mobile or not password:
        raise ValueError("mobile and password are required")

    citizen = q("SELECT * FROM citizens WHERE mobile=?", (mobile,), one=True)
    if not citizen or not auth.check_password(password, citizen["password_hash"]):
        raise ValueError("Invalid credentials")

    token = auth.create_token(citizen["id"], mobile)
    return {
        "message": "Login successful",
        "token": token,
        "citizen": {
            "id":      citizen["id"],
            "mobile":  citizen["mobile"],
            "name":    citizen["name"],
            "email":   citizen["email"],
            "ward":    citizen["ward"],
            "address": citizen["address"],
        }
    }


def profile(ctx):
    """GET /api/auth/profile  [auth required]"""
    user = ctx.require_auth()
    citizen = q("SELECT * FROM citizens WHERE id=?", (user["sub"],), one=True)
    if not citizen:
        raise auth.AuthError("Citizen not found")
    return {k: v for k, v in citizen.items() if k != "password_hash"}


def update_profile(ctx):
    """PUT /api/auth/profile  [auth required]"""
    user = ctx.require_auth()
    data = ctx.body
    allowed = ("name", "email", "address", "ward")
    updates = {k: data[k] for k in allowed if k in data}
    if not updates:
        raise ValueError("No updatable fields provided")

    set_clause = ", ".join(f"{k}=?" for k in updates)
    values     = list(updates.values()) + [user["sub"]]
    run(f"UPDATE citizens SET {set_clause}, updated_at=datetime('now') WHERE id=?", values)

    return {"message": "Profile updated"}
