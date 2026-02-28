"""handlers/water.py — Water connections, leakages, quality certificates."""
import secrets
from db import q, run


def list_connections(ctx):
    """GET /api/water/connections  [auth required]"""
    user = ctx.require_auth()
    rows = q("SELECT * FROM water_connections WHERE citizen_id=? ORDER BY applied_at DESC", (user["sub"],))
    return {"connections": rows, "total": len(rows)}


def apply_connection(ctx):
    """POST /api/water/connections"""
    user = ctx.require_auth()
    data = ctx.body

    conn_type = data.get("connection_type", "new")
    address   = data.get("address", "").strip()
    ward      = data.get("ward")
    pipe_size = data.get("pipe_size", "15mm")

    if not address or not ward:
        raise ValueError("address and ward are required")
    if conn_type not in ("new", "transfer", "disconnection"):
        raise ValueError("connection_type must be: new, transfer or disconnection")

    ref_no = f"WC-{secrets.token_hex(4).upper()}"
    row_id = run(
        """INSERT INTO water_connections(citizen_id,connection_type,address,ward,pipe_size,ref_no)
           VALUES(?,?,?,?,?,?)""",
        (user["sub"], conn_type, address, int(ward), pipe_size, ref_no)
    )
    return {
        "message": "Water connection application submitted",
        "ref_no": ref_no,
        "application_id": row_id,
        "estimated_days": 14,
        "_status": 201,
    }


def report_leakage(ctx):
    """POST /api/water/leakages"""
    user = ctx.require_auth()
    data = ctx.body

    ward     = data.get("ward")
    location = data.get("location", "").strip()
    severity = data.get("severity", "medium")

    if not ward or not location:
        raise ValueError("ward and location are required")
    if severity not in ("low", "medium", "high", "critical"):
        raise ValueError("severity must be: low, medium, high or critical")

    row_id = run(
        "INSERT INTO water_leakages(citizen_id,ward,location,severity) VALUES(?,?,?,?)",
        (user["sub"], int(ward), location, severity)
    )
    return {
        "message": "Leakage reported. Field team notified.",
        "report_id": row_id,
        "expected_resolution_hours": {"low": 48, "medium": 24, "high": 12, "critical": 4}[severity],
        "_status": 201,
    }


def ward_quality(ctx):
    """GET /api/water/quality/{ward}"""
    ward = ctx.path_params["ward"]
    row  = q("SELECT * FROM water_quality WHERE ward=? ORDER BY tested_at DESC LIMIT 1",
             (int(ward),), one=True)
    if not row:
        return {"error": f"No water quality data for ward {ward}", "_status": 404}
    return {
        "ward": ward,
        "tested_at":  row["tested_at"],
        "ph":         row["ph"],
        "turbidity":  row["turbidity"],
        "coliform":   row["coliform"],
        "result":     row["result"],
        "cert_no":    row["cert_no"],
        "certificate_url": f"/api/water/quality/{ward}/certificate/{row['cert_no']}",
    }
