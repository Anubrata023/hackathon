"""handlers/tax.py — Property Tax: calculation, payment, receipts."""
import secrets
from datetime import datetime, date
import config
from db import q, run


def _calculate_amount(annual_value: float, usage_type: str) -> float:
    """Simple tax calculation: 15% of annual value with usage multiplier."""
    base_rate = 0.15
    multiplier = {"residential": 1.0, "commercial": 1.5, "industrial": 2.0}.get(usage_type, 1.0)
    return round(annual_value * base_rate * multiplier, 2)


def calculate_tax(ctx):
    """GET /api/tax/calculate?property_uid=&annual_value=&usage_type="""
    uid        = ctx.q("property_uid")
    ann_val    = ctx.q("annual_value")
    usage      = ctx.q("usage_type", "residential")

    if uid:
        prop = q("SELECT * FROM properties WHERE property_uid=?", (uid,), one=True)
        if not prop:
            return {"error": "Property not found", "_status": 404}
        annual_value = prop["annual_value"]
        usage        = prop["usage_type"]
    elif ann_val:
        annual_value = float(ann_val)
    else:
        raise ValueError("Provide property_uid or annual_value")

    tax_due = _calculate_amount(annual_value, usage)

    # Check rebate
    today    = date.today()
    deadline = date.fromisoformat(config.TAX_REBATE_DEADLINE)
    rebate   = config.TAX_REBATE_PCT if today <= deadline else 0
    after_rebate = round(tax_due * (1 - rebate / 100), 2)

    return {
        "annual_value":  annual_value,
        "usage_type":    usage,
        "base_tax":      tax_due,
        "rebate_pct":    rebate,
        "rebate_amount": round(tax_due - after_rebate, 2),
        "amount_payable": after_rebate,
        "financial_year": "2025-26",
        "rebate_deadline": str(deadline),
        "rebate_eligible": today <= deadline,
    }


def get_dues(ctx):
    """GET /api/tax/dues  [auth required]"""
    user = ctx.require_auth()
    props = q("SELECT * FROM properties WHERE citizen_id=?", (user["sub"],))
    dues  = []
    for prop in props:
        tax_due = _calculate_amount(prop["annual_value"], prop["usage_type"])
        paid = q(
            "SELECT SUM(amount_paid) AS s FROM tax_payments WHERE property_id=? AND status='paid' AND financial_year='2025-26'",
            (prop["id"],), one=True
        )
        paid_amt = paid["s"] or 0
        dues.append({
            "property":     prop,
            "financial_year": "2025-26",
            "amount_due":   round(tax_due - paid_amt, 2),
            "amount_paid":  round(paid_amt, 2),
            "total_tax":    tax_due,
        })
    return {"properties": dues}


def pay_tax(ctx):
    """POST /api/tax/pay"""
    user = ctx.require_auth()
    data = ctx.body

    prop_uid = data.get("property_uid")
    mode     = data.get("payment_mode", "upi")
    fy       = data.get("financial_year", "2025-26")

    if not prop_uid:
        raise ValueError("property_uid is required")
    if mode not in ("upi", "netbanking", "card", "cash"):
        raise ValueError("payment_mode must be: upi, netbanking, card or cash")

    prop = q("SELECT * FROM properties WHERE property_uid=? AND citizen_id=?",
             (prop_uid, user["sub"]), one=True)
    if not prop:
        return {"error": "Property not found or not owned by you", "_status": 404}

    today    = date.today()
    deadline = date.fromisoformat(config.TAX_REBATE_DEADLINE)
    rebate   = config.TAX_REBATE_PCT if today <= deadline else 0
    tax_base = _calculate_amount(prop["annual_value"], prop["usage_type"])
    amount   = round(tax_base * (1 - rebate / 100), 2)

    pay_ref  = f"PAY-{secrets.token_hex(6).upper()}"
    rcpt_no  = f"RCPT-{secrets.token_hex(5).upper()}"
    now      = datetime.now().isoformat()

    pid = run(
        """INSERT INTO tax_payments(property_id,citizen_id,financial_year,amount_due,rebate_pct,
           amount_paid,payment_ref,payment_mode,status,paid_at,receipt_no)
           VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
        (prop["id"], user["sub"], fy, tax_base, rebate, amount,
         pay_ref, mode, "paid", now, rcpt_no)
    )
    return {
        "message": "Tax payment successful",
        "receipt_no": rcpt_no,
        "payment_ref": pay_ref,
        "amount_paid": amount,
        "rebate_applied": rebate,
        "paid_at": now,
        "download_url": f"/api/tax/receipts/{pid}",
    }


def list_receipts(ctx):
    """GET /api/tax/receipts  [auth required]"""
    user  = ctx.require_auth()
    rows  = q(
        "SELECT tp.*, p.property_uid, p.address FROM tax_payments tp "
        "JOIN properties p ON tp.property_id=p.id "
        "WHERE tp.citizen_id=? ORDER BY tp.created_at DESC",
        (user["sub"],)
    )
    return {"receipts": rows, "total": len(rows)}


def get_receipt(ctx):
    """GET /api/tax/receipts/{id}"""
    user   = ctx.require_auth()
    rec_id = ctx.path_params["id"]
    row    = q(
        "SELECT tp.*, p.property_uid, p.address, p.ward FROM tax_payments tp "
        "JOIN properties p ON tp.property_id=p.id "
        "WHERE tp.id=? AND tp.citizen_id=?",
        (rec_id, user["sub"]), one=True
    )
    if not row:
        return {"error": "Receipt not found", "_status": 404}
    row["portal"] = "Guwahati Municipal Corporation"
    row["verified"] = True
    return row
