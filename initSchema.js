const pool = require('./db');

const schema = `
-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id                  CHAR(36)        PRIMARY KEY,
  full_name           VARCHAR(150)    NOT NULL,
  date_of_birth       DATE            NOT NULL,
  gender              ENUM('Male','Female','Other','Prefer not to say'),
  email               VARCHAR(255)    UNIQUE NOT NULL,
  phone_number        VARCHAR(15)     UNIQUE,
  address_line1       VARCHAR(255),
  address_line2       VARCHAR(255),
  city                VARCHAR(100),
  state               VARCHAR(100),
  pincode             CHAR(6),
  aadhaar_last4       CHAR(4)         NOT NULL COMMENT 'Last 4 digits only – Aadhaar Act 2016',
  password_hash       TEXT            NOT NULL,
  is_verified         TINYINT(1)      DEFAULT 0,
  verification_token  VARCHAR(255),
  created_at          DATETIME        DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Service Applications
CREATE TABLE IF NOT EXISTS service_applications (
  id                       CHAR(36)     PRIMARY KEY,
  user_id                  CHAR(36)     NOT NULL,
  service_type             VARCHAR(100) NOT NULL,
  service_code             VARCHAR(30)  UNIQUE NOT NULL,
  description              TEXT,
  applicant_name           VARCHAR(150) NOT NULL,
  applicant_aadhaar_last4  CHAR(4)      NOT NULL,
  status                   ENUM('Draft','Submitted','Under Review','Additional Info Required','Approved','Rejected','Cancelled') DEFAULT 'Draft',
  status_remarks           TEXT,
  reviewed_by              VARCHAR(150),
  reviewed_at              DATETIME,
  documents                JSON,
  priority                 ENUM('Low','Normal','High','Urgent') DEFAULT 'Normal',
  due_date                 DATE,
  submitted_at             DATETIME,
  created_at               DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status  (status)
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
  table_name  VARCHAR(60)  NOT NULL,
  record_id   CHAR(36)     NOT NULL,
  action      ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  changed_by  CHAR(36),
  changed_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  old_data    JSON,
  new_data    JSON,
  INDEX idx_record (table_name, record_id)
);
`;

async function initSchema() {
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const conn = await pool.getConnection();
  try {
    for (const stmt of statements) {
      await conn.query(stmt);
    }
    console.log('✅  Database schema initialised');
  } finally {
    conn.release();
  }
}

module.exports = initSchema;
