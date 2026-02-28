"""handlers/payments.py — Generic payment gateway simulation."""
import secrets
from datetime import datetime
from db import q, run


def initiate(ctx):
    """POST /api/payments/initiate"""
    user = ctx.require_auth()
    data = ctx.body

    purpose = data.get("purpose", "")
    amount  = data.get("amount")
    mode    = data.get("mode", "upi")

    if not purpose or not amount:
        raise ValueError("purpose and amount are required")

    valid_modes = ("upi", "netbanking", "card", "cash")
    if mode not in valid_modes:
        raise ValueError(f"mode must be one of: {', '.join(valid_modes)}")

    ref = f"PAY-{secrets.token_hex(8).upper()}"
    run(
        "INSERT INTO payments(citizen_id,ref,purpose,amount,mode) VALUES(?,?,?,?,?)",
        (user["sub"], ref, purpose, float(amount), mode)
    )
    return {
        "payment_ref": ref,
        "amount":      float(amount),
        "mode":        mode,
        "purpose":     purpose,
        "status":      "pending",
        "gateway_url": f"https://pay.gmc.assam.gov.in/checkout/{ref}",
        "note": "Redirect user to gateway_url to complete payment",
        "_status": 201,
    }


def get_status(ctx):
    """GET /api/payments/{ref}/status"""
    ref = ctx.path_params["ref"]
    row = q("SELECT * FROM payments WHERE ref=?", (ref,), one=True)
    if not row:
        return {"error": "Payment not found", "_status": 404}

    # Simulate: if payment is > 5 seconds old and still pending → mark success
    initiated = datetime.fromisoformat(row["initiated_at"])
    if row["status"] == "pending" and (datetime.now() - initiated).seconds > 5:
        gateway_ref = f"GW-{secrets.token_hex(6).upper()}"
        run("UPDATE payments SET status='success', gateway_ref=?, completed_at=datetime('now') WHERE ref=?",
            (gateway_ref, ref))
        row["status"]      = "success"
        row["gateway_ref"] = gateway_ref

    return row
