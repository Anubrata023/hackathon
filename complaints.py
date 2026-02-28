"""handlers/search.py — Global search across services, complaints, notices."""
from db import q


def global_search(ctx):
    """GET /api/search?q=&limit=10"""
    term  = ctx.q("q", "").strip().lower()
    limit = min(int(ctx.q("limit", 10)), 50)

    if not term or len(term) < 2:
        raise ValueError("Search query must be at least 2 characters")

    like = f"%{term}%"
    results = []

    # Services
    svcs = q("SELECT id, slug, title, description, category FROM services WHERE active=1 AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ?)",
             (like, like, like))
    for s in svcs[:5]:
        results.append({
            "type":        "service",
            "id":          s["id"],
            "title":       s["title"],
            "description": s["description"],
            "category":    s["category"],
            "url":         f"/api/services/{s['slug']}",
        })

    # Notices
    ntcs = q("SELECT id, tag, title, department, published_at FROM notices WHERE active=1 AND (LOWER(title) LIKE ? OR LOWER(body) LIKE ?)",
             (like, like))
    for n in ntcs[:5]:
        results.append({
            "type":       "notice",
            "id":         n["id"],
            "title":      n["title"],
            "tag":        n["tag"],
            "department": n["department"],
            "url":        f"/api/notices/{n['id']}",
        })

    # Trim total
    results = results[:limit]
    return {
        "query":   term,
        "results": results,
        "total":   len(results),
    }
