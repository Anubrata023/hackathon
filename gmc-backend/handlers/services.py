"""handlers/services.py — Service catalogue + portal stats."""
from db import q


def list_services(ctx):
    """GET /api/services?category=&q="""
    category = ctx.q("category")
    search   = ctx.q("q", "").lower()

    sql    = "SELECT * FROM services WHERE active=1"
    params = []
    if category:
        sql += " AND category=?"
        params.append(category)

    rows = q(sql, params)
    if search:
        rows = [r for r in rows
                if search in r["title"].lower() or search in (r["description"] or "").lower()]

    categories = sorted({r["category"] for r in q("SELECT category FROM services")})
    return {"services": rows, "total": len(rows), "categories": categories}


def get_service(ctx):
    """GET /api/services/{id}"""
    svc_id = ctx.path_params.get("id")
    # Accept both integer id and slug
    if svc_id.isdigit():
        row = q("SELECT * FROM services WHERE id=?", (svc_id,), one=True)
    else:
        row = q("SELECT * FROM services WHERE slug=?", (svc_id,), one=True)

    if not row:
        return {"error": "Service not found", "_status": 404}
    return row


def get_stats(ctx):
    """GET /api/stats — figures shown in hero band."""
    from db import q as _q
    citizens_count   = _q("SELECT COUNT(*) AS c FROM citizens", one=True)["c"]
    complaints_count = _q("SELECT COUNT(*) AS c FROM complaints", one=True)["c"]
    resolved_count   = _q("SELECT COUNT(*) AS c FROM complaints WHERE status='resolved'", one=True)["c"]
    resolution_rate  = round(resolved_count / max(complaints_count, 1) * 100)

    # Average resolution days for resolved complaints
    avg_days_row = _q(
        "SELECT AVG(JULIANDAY(resolved_at) - JULIANDAY(created_at)) AS d "
        "FROM complaints WHERE status='resolved' AND resolved_at IS NOT NULL",
        one=True
    )
    avg_days = round(avg_days_row["d"] or 21)

    return {
        "wards":            57,
        "citizens":         f"{max(citizens_count, 1200000):,}",
        "avg_resolution_days": avg_days or 21,
        "complaints_filed": complaints_count,
        "resolution_rate":  resolution_rate,
        "services_count":   _q("SELECT COUNT(*) AS c FROM services WHERE active=1", one=True)["c"],
    }
