"""handlers/notices.py — Notices & Circulars."""
import config
from db import q


def list_notices(ctx):
    """GET /api/notices?tag=&page=&limit="""
    tag   = ctx.q("tag")
    page  = max(1, int(ctx.q("page", 1)))
    limit = min(int(ctx.q("limit", config.DEFAULT_PAGE_SIZE)), config.MAX_PAGE_SIZE)
    offset = (page - 1) * limit

    sql    = "SELECT * FROM notices WHERE active=1"
    params = []
    if tag:
        sql += " AND tag=?"
        params.append(tag)

    total = q(f"SELECT COUNT(*) AS c FROM ({sql})", params, one=True)["c"]
    sql  += " ORDER BY published_at DESC LIMIT ? OFFSET ?"
    rows  = q(sql, params + [limit, offset])

    tags = [r["tag"] for r in q("SELECT DISTINCT tag FROM notices")]
    return {"notices": rows, "total": total, "page": page, "limit": limit, "tags": tags}


def get_notice(ctx):
    """GET /api/notices/{id}"""
    nid = ctx.path_params["id"]
    row = q("SELECT * FROM notices WHERE id=?", (nid,), one=True)
    if not row:
        return {"error": "Notice not found", "_status": 404}
    return row
