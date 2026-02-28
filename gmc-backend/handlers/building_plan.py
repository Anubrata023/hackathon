"""handlers/building_plan.py — Building Plan Approval."""
import secrets
from db import q, run


def list_plans(ctx):
    """GET /api/building-plans  [auth required]"""
    user = ctx.require_auth()
    rows = q("SELECT * FROM building_plans WHERE citizen_id=? ORDER BY submitted_at DESC",
             (user["sub"],))
    return {"plans": rows, "total": len(rows)}


def submit_plan(ctx):
    """POST /api/building-plans"""
    user = ctx.require_auth()
    data = ctx.body

    plot_no  = data.get("plot_no", "").strip()
    ward     = data.get("ward")
    address  = data.get("address", "").strip()
    floors   = int(data.get("floors", 1))
    area     = data.get("total_area_sqft")
    usage    = data.get("usage", "residential")
    arch     = data.get("architect_name", "").strip()

    if not plot_no or not ward or not address:
        raise ValueError("plot_no, ward and address are required")
    if usage not in ("residential", "commercial", "industrial", "mixed"):
        raise ValueError("usage must be: residential, commercial, industrial or mixed")
    if floors < 1 or floors > 20:
        raise ValueError("floors must be between 1 and 20")

    row_id = run(
        """INSERT INTO building_plans(citizen_id,plot_no,ward,address,floors,total_area_sqft,usage,architect_name)
           VALUES(?,?,?,?,?,?,?,?)""",
        (user["sub"], plot_no, int(ward), address, floors, area, usage, arch or None)
    )
    return {
        "message": "Building plan submitted for review",
        "plan_id": row_id,
        "estimated_review_days": 30,
        "checklist": [
            "Site plan uploaded",
            "NOC from local authority required",
            "Structural engineer certificate required for 3+ floors",
            "Fire safety clearance required for commercial use",
        ],
        "_status": 201,
    }


def get_plan(ctx):
    """GET /api/building-plans/{id}"""
    user    = ctx.require_auth()
    plan_id = ctx.path_params["id"]
    row     = q("SELECT * FROM building_plans WHERE id=? AND citizen_id=?",
                (plan_id, user["sub"]), one=True)
    if not row:
        return {"error": "Plan not found", "_status": 404}
    return row
