"""handlers/trade_licence.py — Trade Licence apply, renew, get."""
import secrets
from datetime import datetime, timedelta
from db import q, run


def list_licences(ctx):
    """GET /api/trade-licence  [auth required]"""
    user = ctx.require_auth()
    rows = q("SELECT * FROM trade_licences WHERE citizen_id=? ORDER BY applied_at DESC",
             (user["sub"],))
    return {"licences": rows, "total": len(rows)}


def apply_licence(ctx):
    """POST /api/trade-licence"""
    user = ctx.require_auth()
    data = ctx.body

    biz_name = data.get("business_name", "").strip()
    biz_type = data.get("business_type", "").strip()
    address  = data.get("address", "").strip()
    ward     = data.get("ward")

    if not biz_name or not biz_type or not address or not ward:
        raise ValueError("business_name, business_type, address and ward are required")

    row_id = run(
        "INSERT INTO trade_licences(citizen_id,business_name,business_type,address,ward) VALUES(?,?,?,?,?)",
        (user["sub"], biz_name, biz_type, address, int(ward))
    )
    return {
        "message": "Trade licence application submitted",
        "application_id": row_id,
        "estimated_approval_days": 21,
        "note": "You will receive SMS notification upon approval",
        "_status": 201,
    }


def renew_licence(ctx):
    """PUT /api/trade-licence/{id}/renew"""
    user = ctx.require_auth()
    lic_id = ctx.path_params["id"]

    lic = q("SELECT * FROM trade_licences WHERE id=? AND citizen_id=?",
            (lic_id, user["sub"]), one=True)
    if not lic:
        return {"error": "Licence not found", "_status": 404}
    if lic["status"] == "applied":
        raise ValueError("Licence is still under review")

    new_expiry = (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")
    new_lic_no = f"TL-{secrets.token_hex(5).upper()}"

    run("""UPDATE trade_licences
          SET status='approved', expiry_date=?, licence_no=?, renewed_at=datetime('now')
          WHERE id=?""",
        (new_expiry, new_lic_no, lic_id))

    return {
        "message": "Trade licence renewed successfully",
        "licence_no": new_lic_no,
        "new_expiry": new_expiry,
    }


def get_licence(ctx):
    """GET /api/trade-licence/{id}"""
    user   = ctx.require_auth()
    lic_id = ctx.path_params["id"]
    row    = q("SELECT * FROM trade_licences WHERE id=? AND citizen_id=?",
               (lic_id, user["sub"]), one=True)
    if not row:
        return {"error": "Licence not found", "_status": 404}
    return row
