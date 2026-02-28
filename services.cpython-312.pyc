"""handlers/complaints.py — Grievances / Digital Jan Sunwai."""
import secrets
from datetime import datetime, timedelta
import config
from db import q, run


def _paginate(ctx):
    page  = max(1, int(ctx.q("page", 1)))
    limit = min(int(ctx.q("limit", config.DEFAULT_PAGE_SIZE)), config.MAX_PAGE_SIZE)
    offset = (page - 1) * limit
    return page, limit, offset


def list_complaints(ctx):
    """GET /api/complaints?status=&ward=&page=&limit=
    Auth optional — without auth returns public complaints, with auth returns own.
    """
    user   = ctx.current_user
    status = ctx.q("status")
    ward   = ctx.q("ward")
    page, limit, offset = _paginate(ctx)

    sql    = "SELECT * FROM complaints WHERE 1=1"
    params = []

    if user:
        sql += " AND citizen_id=?"
        params.append(user["sub"])

    if status:
        sql += " AND status=?"
        params.append(status)
    if ward:
        sql += " AND ward=?"
        params.append(int(ward))

    total = q(f"SELECT COUNT(*) AS c FROM ({sql})", params, one=True)["c"]
    sql  += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    rows  = q(sql, params + [limit, offset])

    return {"complaints": rows, "total": total, "page": page, "limit": limit}


def create_complaint(ctx):
    """POST /api/complaints"""
    user = ctx.require_auth()
    data = ctx.body
    cat  = data.get("category", "General")
    subj = data.get("subject", "").strip()
    desc = data.get("description", "").strip()
    ward = data.get("ward")

    if not subj or not desc or not ward:
        raise ValueError("subject, description and ward are required")

    # Auto-set hearing date 3 days out
    hearing = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")

    cid = run(
        """INSERT INTO complaints(citizen_id,category,subject,description,ward,hearing_date)
           VALUES(?,?,?,?,?,?)""",
        (user["sub"], cat, subj, desc, int(ward), hearing)
    )
    return {
        "message": "Complaint registered successfully",
        "complaint_id": cid,
        "hearing_date": hearing,
        "escalation_note": f"Auto-escalated if unresolved within {config.COMPLAINT_ESCALATE_DAYS} days",
        "_status": 201,
    }


def get_complaint(ctx):
    """GET /api/complaints/{id}"""
    cid   = ctx.path_params["id"]
    row   = q("SELECT * FROM complaints WHERE id=?", (cid,), one=True)
    if not row:
        return {"error": "Complaint not found", "_status": 404}

    # Check escalation status
    created = datetime.fromisoformat(row["created_at"])
    days_open = (datetime.now() - created).days
    if days_open >= config.COMPLAINT_ESCALATE_DAYS and row["status"] == "pending":
        run("UPDATE complaints SET status='escalated' WHERE id=?", (cid,))
        row["status"] = "escalated"

    return row


def update_status(ctx):
    """PUT /api/complaints/{id}/status  [auth required — officer or admin]"""
    user = ctx.require_auth()
    cid  = ctx.path_params["id"]
    data = ctx.body

    new_status = data.get("status")
    note       = data.get("resolution_note", "")

    valid = {"open", "resolved", "closed", "escalated", "pending"}
    if new_status not in valid:
        raise ValueError(f"status must be one of: {', '.join(valid)}")

    extras = {}
    if new_status == "resolved":
        extras["resolved_at"] = datetime.now().isoformat()

    run(
        """UPDATE complaints
           SET status=?, resolution_note=?, updated_at=datetime('now')
           WHERE id=?""",
        (new_status, note, cid)
    )
    if "resolved_at" in extras:
        run("UPDATE complaints SET resolved_at=? WHERE id=?", (extras["resolved_at"], cid))

    return {"message": "Status updated", "complaint_id": cid, "new_status": new_status}
