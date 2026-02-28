"""handlers/garbage.py — Garbage & Sanitation."""
from datetime import datetime, timedelta
from db import q, run


def report_missed(ctx):
    """POST /api/garbage/report"""
    user = ctx.require_auth()
    data = ctx.body

    ward    = data.get("ward")
    address = data.get("address", "").strip()
    type_   = data.get("type", "missed_pickup")

    if not ward or not address:
        raise ValueError("ward and address are required")
    if type_ not in ("missed_pickup", "illegal_dumping", "overflow"):
        raise ValueError("type must be: missed_pickup, illegal_dumping or overflow")

    row_id = run(
        "INSERT INTO garbage_reports(citizen_id,ward,address,type) VALUES(?,?,?,?)",
        (user["sub"], int(ward), address, type_)
    )
    return {
        "message": "Garbage issue reported. Sanitation team alerted.",
        "report_id": row_id,
        "expected_resolution_hours": 24,
        "_status": 201,
    }


def schedule_bulk(ctx):
    """POST /api/garbage/bulk-pickup"""
    user = ctx.require_auth()
    data = ctx.body

    ward          = data.get("ward")
    address       = data.get("address", "").strip()
    scheduled_date = data.get("scheduled_date", "")
    waste_type    = data.get("waste_type", "Mixed")
    weight_est    = data.get("weight_estimate", "")

    if not ward or not address or not scheduled_date:
        raise ValueError("ward, address and scheduled_date are required")

    # Validate date is in future
    try:
        sched = datetime.strptime(scheduled_date, "%Y-%m-%d")
    except ValueError:
        raise ValueError("scheduled_date must be YYYY-MM-DD")
    if sched.date() < datetime.now().date():
        raise ValueError("scheduled_date must be in the future")

    row_id = run(
        """INSERT INTO bulk_pickup_requests(citizen_id,ward,address,scheduled_date,waste_type,weight_estimate)
           VALUES(?,?,?,?,?,?)""",
        (user["sub"], int(ward), address, scheduled_date, waste_type, weight_est)
    )
    return {
        "message": "Bulk waste pickup scheduled",
        "request_id": row_id,
        "scheduled_date": scheduled_date,
        "note": "Please keep waste ready by 7:00 AM on the scheduled date",
        "_status": 201,
    }


def get_schedule(ctx):
    """GET /api/garbage/schedule/{ward}"""
    ward = int(ctx.path_params["ward"])

    # Simulated weekly schedule based on ward number
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    day  = days[(ward - 1) % len(days)]
    timing = "06:00–10:00" if ward % 2 == 0 else "07:00–11:00"

    recent_reports = q(
        "SELECT * FROM garbage_reports WHERE ward=? ORDER BY reported_at DESC LIMIT 5",
        (ward,)
    )
    return {
        "ward": ward,
        "collection_day": day,
        "timing": timing,
        "bulk_pickup_days": "First Saturday of every month",
        "recent_reports": recent_reports,
        "vehicle_contact": f"98{ward:02d}000000",
    }
