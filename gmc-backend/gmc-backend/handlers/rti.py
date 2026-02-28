"""handlers/rti.py — Right to Information Portal."""
import secrets
from datetime import datetime, timedelta
import config
from db import q, run

DEPARTMENTS = [
    "Revenue Department",
    "Water Supply Dept.",
    "Engineering Cell",
    "Health Department",
    "Public Grievance Cell",
    "IT Department",
    "Town Planning",
    "General Administration",
]


def list_requests(ctx):
    """GET /api/rti  [auth required]"""
    user = ctx.require_auth()
    rows = q("SELECT * FROM rti_requests WHERE citizen_id=? ORDER BY filed_at DESC",
             (user["sub"],))
    return {"requests": rows, "total": len(rows), "available_departments": DEPARTMENTS}


def file_request(ctx):
    """POST /api/rti"""
    user = ctx.require_auth()
    data = ctx.body

    dept    = data.get("department", "").strip()
    subject = data.get("subject", "").strip()
    desc    = data.get("description", "").strip()
    pay_ref = data.get("payment_ref", f"PAY-RTI-{secrets.token_hex(4).upper()}")

    if not dept or not subject or not desc:
        raise ValueError("department, subject and description are required")
    if dept not in DEPARTMENTS:
        raise ValueError(f"department must be one of the listed departments")

    due_date = (datetime.now() + timedelta(days=config.RTI_RESOLUTION_DAYS)).strftime("%Y-%m-%d")

    row_id = run(
        """INSERT INTO rti_requests(citizen_id,department,subject,description,payment_ref,due_date)
           VALUES(?,?,?,?,?,?)""",
        (user["sub"], dept, subject, desc, pay_ref, due_date)
    )
    return {
        "message": "RTI request filed successfully",
        "request_id": row_id,
        "due_date": due_date,
        "fee": 10.0,
        "payment_ref": pay_ref,
        "note": f"Response expected within {config.RTI_RESOLUTION_DAYS} days as per RTI Act 2005",
        "_status": 201,
    }


def get_request(ctx):
    """GET /api/rti/{id}"""
    user   = ctx.require_auth()
    req_id = ctx.path_params["id"]
    row    = q("SELECT * FROM rti_requests WHERE id=? AND citizen_id=?",
               (req_id, user["sub"]), one=True)
    if not row:
        return {"error": "RTI request not found", "_status": 404}
    return row
