-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if exist (for clean start)
DROP TABLE IF EXISTS electronic_signatures CASCADE;
DROP TABLE IF EXISTS audit_trail CASCADE;
DROP TABLE IF EXISTS audit_config CASCADE;
DROP TABLE IF EXISTS user_certificates CASCADE;
DROP TABLE IF EXISTS formula_bom CASCADE;
DROP TABLE IF EXISTS formulas CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS certifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    last_training_date DATE,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    password_changed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certifications table
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    certification_name VARCHAR(200) NOT NULL,
    issued_date DATE NOT NULL,
    expiry_date DATE,
    issuer VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materials table
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'quarantine',
    quantity DECIMAL(10,3) DEFAULT 0,
    unit VARCHAR(10) DEFAULT 'g',
    location VARCHAR(100),
    expiry_date DATE,
    received_date DATE,
    supplier VARCHAR(200),
    lot_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Formulas table
CREATE TABLE formulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_number VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    weight_per_unit DECIMAL(10,3) DEFAULT 0,
    product_type VARCHAR(50) DEFAULT 'dosing',
    status VARCHAR(20) DEFAULT 'draft',
    version VARCHAR(20) DEFAULT '1.0',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Formula BOM (Bill of Materials)
CREATE TABLE formula_bom (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formula_id UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
    material_article VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(10) DEFAULT 'mg',
    min_quantity DECIMAL(10,3) DEFAULT 0,
    max_quantity DECIMAL(10,3) DEFAULT 0,
    material_type VARCHAR(50) DEFAULT 'raw_material',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Configuration table
CREATE TABLE audit_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    retention_days INTEGER DEFAULT 2555,
    archive_after_days INTEGER DEFAULT 365,
    hash_algorithm VARCHAR(50) DEFAULT 'sha256',
    signature_required_actions TEXT[],
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Trail table
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_number BIGSERIAL UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    action_type VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    reason TEXT,
    data_hash VARCHAR(64),
    previous_hash VARCHAR(64),
    parent_audit_id UUID REFERENCES audit_trail(id)
);

-- Electronic Signatures table
CREATE TABLE electronic_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_trail_id UUID NOT NULL REFERENCES audit_trail(id) ON DELETE CASCADE,
    signer_user_id UUID NOT NULL REFERENCES users(id),
    signature_data TEXT NOT NULL,
    signature_method VARCHAR(50) DEFAULT 'pkcs7',
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    meaning VARCHAR(100),
    ip_address VARCHAR(45)
);

-- User Certificates table
CREATE TABLE user_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    certificate_data TEXT NOT NULL,
    private_key_encrypted TEXT,
    key_algorithm VARCHAR(50) DEFAULT 'RSA-2048',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

-- Create indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_certifications_user_id ON certifications(user_id);
CREATE INDEX idx_certifications_expiry ON certifications(expiry_date);
CREATE INDEX idx_materials_article ON materials(article_number);
CREATE INDEX idx_materials_status ON materials(status);
CREATE INDEX idx_formulas_article ON formulas(article_number);
CREATE INDEX idx_formulas_status ON formulas(status);
CREATE INDEX idx_formula_bom_formula_id ON formula_bom(formula_id);
CREATE INDEX idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX idx_audit_trail_timestamp ON audit_trail(timestamp);
CREATE INDEX idx_audit_trail_action_type ON audit_trail(action_type);
CREATE INDEX idx_audit_trail_table_name ON audit_trail(table_name);
CREATE INDEX idx_audit_trail_sequence ON audit_trail(sequence_number);
CREATE INDEX idx_electronic_signatures_audit_id ON electronic_signatures(audit_trail_id);
CREATE INDEX idx_electronic_signatures_user_id ON electronic_signatures(signer_user_id);
CREATE INDEX idx_user_certificates_user_id ON user_certificates(user_id);
CREATE INDEX idx_user_certificates_status ON user_certificates(status);

-- ============================================
-- INSERT TEST DATA
-- ============================================

-- Insert test users (password: 1234)
-- ВАЖНО: В production используйте bcrypt/argon2 хеши!
INSERT INTO users (username, email, password_hash, full_name, role, department, password_changed_at) VALUES
('admin', 'admin@nobilis.com', '1234', 'System Administrator', 'admin', 'IT', CURRENT_TIMESTAMP),
('supervisor', 'supervisor@nobilis.com', '1234', 'Production Supervisor', 'supervisor', 'Production', CURRENT_TIMESTAMP),
('operator1', 'operator1@nobilis.com', '1234', 'Machine Operator', 'operator', 'Production', CURRENT_TIMESTAMP);

-- Insert test certifications
INSERT INTO certifications (user_id, certification_name, issued_date, expiry_date, issuer) VALUES
((SELECT id FROM users WHERE username = 'operator1'), 'GMP Basic Training', '2024-01-15', '2025-01-15', 'Nobilis Training Center');

-- Insert test materials
INSERT INTO materials (article_number, name, status, quantity, unit, location, supplier, lot_number) VALUES
('API-001', 'Active Pharmaceutical Ingredient', 'validated', 1000.0, 'g', 'Warehouse A', 'PharmSupply Ltd', 'LOT-001-2024'),
('EXC-001', 'Microcrystalline Cellulose', 'validated', 5000.0, 'g', 'Warehouse A', 'ExcipientCorp', 'LOT-002-2024'),
('EXC-002', 'Magnesium Stearate', 'validated', 500.0, 'g', 'Warehouse A', 'ExcipientCorp', 'LOT-003-2024'),
('PKG-001', 'Blister Pack', 'validated', 1000.0, 'pcs', 'Warehouse B', 'PackagingCo', 'LOT-004-2024');

-- Insert test formulas
INSERT INTO formulas (article_number, product_name, weight_per_unit, product_type, status, version, created_by) VALUES
('FORM-001', 'Paracetamol 500mg Tablet', 500.0, 'dosing', 'approved', '1.0', (SELECT id FROM users WHERE username = 'admin')),
('FORM-002', 'Vitamin C 100mg Tablet', 100.0, 'dosing', 'draft', '0.1', (SELECT id FROM users WHERE username = 'admin'));

-- Insert test BOM items
INSERT INTO formula_bom (formula_id, material_article, quantity, unit, min_quantity, max_quantity, material_type) VALUES
((SELECT id FROM formulas WHERE article_number = 'FORM-001'), 'API-001', 500.0, 'mg', 495.0, 505.0, 'raw_material'),
((SELECT id FROM formulas WHERE article_number = 'FORM-001'), 'EXC-001', 200.0, 'mg', 190.0, 210.0, 'raw_material'),
((SELECT id FROM formulas WHERE article_number = 'FORM-001'), 'EXC-002', 5.0, 'mg', 4.5, 5.5, 'raw_material');

-- Insert audit configuration
INSERT INTO audit_config (retention_days, archive_after_days, hash_algorithm, signature_required_actions) VALUES
(2555, 365, 'sha256', ARRAY['formula_approval', 'material_release', 'user_creation', 'critical_change']);

-- Insert sample audit trail entries
INSERT INTO audit_trail (user_id, session_id, action_type, table_name, record_id, new_values, ip_address, user_agent, reason, data_hash, previous_hash) VALUES
(
    (SELECT id FROM users WHERE username = 'admin'),
    'session-' || gen_random_uuid()::text,
    'CREATE',
    'users',
    (SELECT id FROM users WHERE username = 'operator1'),
    jsonb_build_object(
        'username', 'operator1',
        'email', 'operator1@nobilis.com',
        'role', 'operator',
        'department', 'Production'
    ),
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'New operator onboarding',
    encode(digest('audit_data_1', 'sha256'), 'hex'),
    NULL
);

INSERT INTO audit_trail (user_id, session_id, action_type, table_name, record_id, old_values, new_values, ip_address, reason, data_hash, previous_hash) VALUES
(
    (SELECT id FROM users WHERE username = 'admin'),
    'session-' || gen_random_uuid()::text,
    'UPDATE',
    'formulas',
    (SELECT id FROM formulas WHERE article_number = 'FORM-001'),
    jsonb_build_object('status', 'draft', 'version', '0.9'),
    jsonb_build_object('status', 'approved', 'version', '1.0'),
    '192.168.1.100',
    'Formula validation completed',
    encode(digest('audit_data_2', 'sha256'), 'hex'),
    (SELECT data_hash FROM audit_trail ORDER BY sequence_number DESC LIMIT 1)
);

-- Insert sample electronic signature
INSERT INTO electronic_signatures (audit_trail_id, signer_user_id, signature_data, signature_method, reason, meaning, ip_address) VALUES
(
    (SELECT id FROM audit_trail WHERE action_type = 'UPDATE' AND table_name = 'formulas' LIMIT 1),
    (SELECT id FROM users WHERE username = 'admin'),
    encode(gen_random_bytes(256), 'base64'),
    'pkcs7',
    'Approving formula FORM-001 for production',
    'Approval',
    '192.168.1.100'
);

-- Insert sample user certificate
INSERT INTO user_certificates (user_id, certificate_data, private_key_encrypted, key_algorithm, expires_at, status) VALUES
(
    (SELECT id FROM users WHERE username = 'admin'),
    '-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKJ... (sample certificate data)
-----END CERTIFICATE-----',
    'ENCRYPTED_PRIVATE_KEY_DATA_HERE',
    'RSA-2048',
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    'active'
);

-- Add helpful comment
COMMENT ON TABLE audit_trail IS 'FDA 21 CFR Part 11 compliant audit trail with cryptographic chaining';
COMMENT ON TABLE electronic_signatures IS 'Electronic signatures for critical GxP operations';
COMMENT ON TABLE user_certificates IS 'PKI certificates for secure electronic signatures';
COMMENT ON COLUMN audit_trail.data_hash IS 'SHA-256 hash of audit record for integrity verification';
COMMENT ON COLUMN audit_trail.previous_hash IS 'Hash of previous audit record for blockchain-like chaining';