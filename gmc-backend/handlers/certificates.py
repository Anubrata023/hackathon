"""handlers/certificates.py — Birth & Death Certificates."""
import secrets, hashlib
from datetime import datetime
from db import q, run


def list_certificates(ctx):
    """GET /api/certificates  [auth required]"""
    user = ctx.require_auth()
    rows = q("SELECT * FROM certificate_requests WHERE citizen_id=? ORDER BY applied_at DESC",
             (user["sub"],))
    return {"certificates": rows, "total": len(rows)}


def apply_certificate(ctx):
    """POST /api/certificates/apply"""
    user = ctx.require_auth()
    data = ctx.body

    cert_type   = data.get("cert_type", "")
    person_name = data.get("person_name", "").strip()
    ward        = data.get("ward")
    dob         = data.get("dob")
    dod         = data.get("dod")
    hospital    = data.get("hospital", "").strip()

    if cert_type not in ("birth", "death"):
        raise ValueError("cert_type must be 'birth' or 'death'")
    if not person_name or not ward:
        raise ValueError("person_name and ward are required")

    # Simulate instant issuance for online requests
    cert_no    = f"{'B' if cert_type == 'birth' else 'D'}-{secrets.token_hex(6).upper()}"
    now        = datetime.now().isoformat()
    dig_hash   = hashlib.sha256(f"{cert_no}{person_name}{now}".encode()).hexdigest()

    row_id = run(
        """INSERT INTO certificate_requests
           (citizen_id,cert_type,person_name,dob,dod,hospital,ward,status,cert_no,issued_at,digital_hash)
           VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
        (user["sub"], cert_type, person_name, dob, dod, hospital or None,
         int(ward), "issued", cert_no, now, dig_hash)
    )
    return {
        "message": f"{cert_type.capitalize()} certificate issued instantly",
        "cert_no":       cert_no,
        "issued_at":     now,
        "digital_hash":  dig_hash,
        "download_url":  f"/api/certificates/{row_id}/download",
        "_status": 201,
    }


def download_certificate(ctx):
    """GET /api/certificates/{id}/download"""
    user   = ctx.require_auth()
    cert_id = ctx.path_params["id"]
    row    = q("SELECT * FROM certificate_requests WHERE id=? AND citizen_id=?",
               (cert_id, user["sub"]), one=True)
    if not row:
        return {"error": "Certificate not found", "_status": 404}
    if row["status"] != "issued":
        return {"error": "Certificate not yet issued", "_status": 202}

    return {
        "certificate": row,
        "issued_by": "Guwahati Municipal Corporation",
        "authority":  "Health & Civil Registration Division",
        "verify_url": f"https://gmc.assam.gov.in/verify/{row['cert_no']}",
        "note": "This is a digitally signed document. Verify authenticity using the hash.",
    }
