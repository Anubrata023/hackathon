"""
config.py — Application configuration for GMC Portal backend.
All values can be overridden by environment variables.
"""
import os

# ── Server ─────────────────────────────────────────────────────────────────
HOST = os.getenv("GMC_HOST", "0.0.0.0")
PORT = int(os.getenv("GMC_PORT", "8000"))

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DB_PATH     = os.getenv("GMC_DB", os.path.join(BASE_DIR, "db", "gmc.sqlite3"))
STATIC_DIR  = os.getenv("GMC_STATIC", os.path.join(BASE_DIR, "static"))
UPLOAD_DIR  = os.getenv("GMC_UPLOADS", os.path.join(BASE_DIR, "uploads"))

os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── Auth ───────────────────────────────────────────────────────────────────
JWT_SECRET      = os.getenv("GMC_SECRET", "gmc-super-secret-change-in-prod-2026")
JWT_EXPIRY_DAYS = int(os.getenv("GMC_TOKEN_DAYS", "7"))

# ── Business rules ─────────────────────────────────────────────────────────
TAX_REBATE_PCT          = 10          # early-bird rebate percentage
TAX_REBATE_DEADLINE     = "2026-03-31"
RTI_RESOLUTION_DAYS     = 30
COMPLAINT_ESCALATE_DAYS = 7
WARDS                   = list(range(1, 58))   # 57 wards

# ── Pagination ──────────────────────────────────────────────────────────────
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE     = 100
