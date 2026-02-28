"""handlers/documents.py — AI Document Verification (simulated)."""
import hashlib
import secrets
from datetime import datetime
from db import q, run

DOC_TYPES = {
    "property":       "Property Document",
    "trade_licence":  "Trade Licence",
    "building_plan":  "Building Plan Sanction",
    "birth":          "Birth Certificate",
    "death":          "Death Certificate",
}

# Simulated AI confidence rules
def _ai_analyse(file_hash: str, doc_type: str):
    """Simulate AI verification — in production replace with real ML model call."""
    seed = int(file_hash[:8], 16)
    confidence = 85 + (seed % 15)   # 85–99%
    status = "verified" if confidence >= 88 else "pending"
    notes = (
        f"Document structure matches {DOC_TYPES.get(doc_type, doc_type)} template. "
        f"Metadata intact. No tampering detected." if status == "verified"
        else "Low confidence — document requires manual review."
    )
    return status, confidence, notes


def verify_document(ctx):
    """POST /api/documents/verify
    Body: { doc_type, filename, file_base64 (optional), citizen_id (optional) }
    """
    data     = ctx.body
    doc_type = data.get("doc_type", "property")
    filename = data.get("filename", "document.pdf")
    # In production: decode base64 and hash the actual bytes
    # Here we simulate with random content hash
    content  = data.get("file_base64", secrets.token_hex(32))
    file_hash = hashlib.sha256(content.encode()).hexdigest()

    citizen_id = None
    user = ctx.current_user
    if user:
        citizen_id = user["sub"]

    if doc_type not in DOC_TYPES:
        raise ValueError(f"doc_type must be one of: {', '.join(DOC_TYPES.keys())}")

    status, confidence, notes = _ai_analyse(file_hash, doc_type)

    # Generate tamper-proof digital stamp
    stamp_raw    = f"{file_hash}|{doc_type}|{datetime.now().isoformat()}|GMC2026"
    digital_stamp = hashlib.sha256(stamp_raw.encode()).hexdigest()

    row_id = run(
        """INSERT INTO document_verifications
           (citizen_id,filename,doc_type,file_hash,verification_status,confidence_pct,ai_notes,digital_stamp)
           VALUES(?,?,?,?,?,?,?,?)""",
        (citizen_id, filename, doc_type, file_hash, status, confidence, notes, digital_stamp)
    )
    return {
        "verification_id":  row_id,
        "filename":         filename,
        "doc_type":         DOC_TYPES[doc_type],
        "status":           status,
        "confidence_pct":   confidence,
        "ai_notes":         notes,
        "digital_stamp":    digital_stamp,
        "file_hash":        file_hash,
        "verified_at":      datetime.now().isoformat(),
        "verified_by":      "GMC AI Document Verification System v2.1",
        "verify_url":       f"/api/documents/{row_id}",
    }


def get_verification(ctx):
    """GET /api/documents/{id}"""
    doc_id = ctx.path_params["id"]
    row    = q("SELECT * FROM document_verifications WHERE id=?", (doc_id,), one=True)
    if not row:
        return {"error": "Verification record not found", "_status": 404}
    return row
