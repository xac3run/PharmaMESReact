-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add new columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- User certificates for digital signatures
CREATE TABLE IF NOT EXISTS user_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    certificate_data TEXT NOT NULL,
    private_key_encrypted TEXT NOT NULL,
    key_algorithm VARCHAR(50) DEFAULT 'HMAC-SHA256',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

-- Audit Trail
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_number BIGSERIAL UNIQUE,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(100),
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(100),
    record_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    reason TEXT,
    parent_audit_id UUID REFERENCES audit_trail(id),
    data_hash VARCHAR(64) NOT NULL DEFAULT 'temp',
    previous_hash VARCHAR(64)
);

-- Electronic Signatures
CREATE TABLE IF NOT EXISTS electronic_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_trail_id UUID NOT NULL REFERENCES audit_trail(id),
    signer_user_id UUID NOT NULL REFERENCES users(id),
    signature_data TEXT NOT NULL,
    signature_method VARCHAR(50) DEFAULT 'HMAC-SHA256',
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL,
    meaning VARCHAR(100) NOT NULL,
    ip_address INET,
    certificate_id UUID REFERENCES user_certificates(id)
);

-- Audit configuration
CREATE TABLE IF NOT EXISTS audit_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    retention_days INTEGER DEFAULT 7,
    archive_after_days INTEGER DEFAULT 90,
    hash_algorithm VARCHAR(50) DEFAULT 'SHA256',
    signature_required_actions TEXT[] DEFAULT ARRAY['APPROVE', 'RELEASE', 'DELETE'],
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default config if not exists
INSERT INTO audit_config (retention_days, signature_required_actions) 
SELECT 7, ARRAY['APPROVE', 'RELEASE', 'DELETE', 'CREATE_FORMULA', 'UPDATE_FORMULA']
WHERE NOT EXISTS (SELECT 1 FROM audit_config);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp);
CREATE INDEX IF NOT EXISTS idx_electronic_signatures_audit_id ON electronic_signatures(audit_trail_id);