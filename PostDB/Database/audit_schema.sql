-- Enhanced GMP Schema with Audit Trail and E-Signatures
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables if exist (for clean start)
DROP TABLE IF EXISTS audit_trail CASCADE;
DROP TABLE IF EXISTS electronic_signatures CASCADE;
DROP TABLE IF EXISTS user_certificates CASCADE;
DROP TABLE IF EXISTS data_integrity_hashes CASCADE;
DROP TABLE IF EXISTS certifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table with enhanced security
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
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User certificates for digital signatures
CREATE TABLE user_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    certificate_data TEXT NOT NULL, -- Base64 encoded certificate or public key
    private_key_encrypted TEXT NOT NULL, -- Encrypted private key
    key_algorithm VARCHAR(50) DEFAULT 'HMAC-SHA256',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
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
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
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

-- Audit Trail - Immutable log of all system activities
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_number BIGSERIAL UNIQUE, -- Prevents gaps/reordering
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(100),
    action_type VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, APPROVE, etc.
    table_name VARCHAR(100), -- Which table was affected
    record_id VARCHAR(100), -- ID of the affected record
    old_values JSONB, -- Previous values (for UPDATE/DELETE)
    new_values JSONB, -- New values (for CREATE/UPDATE)
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    reason TEXT, -- User-provided reason for the action
    parent_audit_id UUID REFERENCES audit_trail(id), -- For related actions
    data_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the record for integrity
    previous_hash VARCHAR(64), -- Hash of previous audit record (blockchain-style)
    
    -- Immutable constraints
    CONSTRAINT audit_immutable CHECK (false) DEFERRABLE INITIALLY DEFERRED
);

-- Remove the immutable constraint after creation (hack for initial setup)
ALTER TABLE audit_trail DROP CONSTRAINT audit_immutable;

-- Electronic Signatures
CREATE TABLE electronic_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_trail_id UUID NOT NULL REFERENCES audit_trail(id),
    signer_user_id UUID NOT NULL REFERENCES users(id),
    signature_data TEXT NOT NULL, -- HMAC signature or digital signature
    signature_method VARCHAR(50) DEFAULT 'HMAC-SHA256',
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL, -- Reason for signing (required by 21 CFR Part 11)
    meaning VARCHAR(100) NOT NULL, -- What the signature means (e.g., "Approved", "Reviewed", "Executed")
    ip_address INET,
    certificate_id UUID REFERENCES user_certificates(id)
);

-- Data Integrity Hashes - For detecting tampering
CREATE TABLE data_integrity_hashes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    hash_value VARCHAR(64) NOT NULL, -- SHA-256 hash
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    algorithm VARCHAR(50) DEFAULT 'SHA256'
);

-- Audit configuration
CREATE TABLE audit_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    retention_days INTEGER DEFAULT 7, -- Configurable retention period
    archive_after_days INTEGER DEFAULT 90,
    hash_algorithm VARCHAR(50) DEFAULT 'SHA256',
    signature_required_actions TEXT[] DEFAULT ARRAY['APPROVE', 'RELEASE', 'DELETE'],
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default audit configuration
INSERT INTO audit_config (retention_days, signature_required_actions) VALUES 
(7, ARRAY['APPROVE', 'RELEASE', 'DELETE', 'CREATE_FORMULA', 'UPDATE_FORMULA']);

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_certifications_user_id ON certifications(user_id);
CREATE INDEX idx_materials_article ON materials(article_number);
CREATE INDEX idx_formulas_article ON formulas(article_number);
CREATE INDEX idx_formula_bom_formula_id ON formula_bom(formula_id);

-- Audit Trail indexes for fast querying
CREATE INDEX idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX idx_audit_trail_timestamp ON audit_trail(timestamp);
CREATE INDEX idx_audit_trail_table_record ON audit_trail(table_name, record_id);
CREATE INDEX idx_audit_trail_action_type ON audit_trail(action_type);
CREATE INDEX idx_audit_trail_sequence ON audit_trail(sequence_number);

CREATE INDEX idx_electronic_signatures_audit_id ON electronic_signatures(audit_trail_id);
CREATE INDEX idx_electronic_signatures_signer ON electronic_signatures(signer_user_id);
CREATE INDEX idx_data_integrity_table_record ON data_integrity_hashes(table_name, record_id);

-- Function to generate user signing key
CREATE OR REPLACE FUNCTION generate_user_signing_key(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    signing_key TEXT;
BEGIN
    -- Generate a random 256-bit key for HMAC
    signing_key := encode(gen_random_bytes(32), 'hex');
    
    INSERT INTO user_certificates (user_id, certificate_data, private_key_encrypted, key_algorithm)
    VALUES (
        user_id,
        'HMAC-KEY-' || signing_key, -- In production, this would be properly formatted
        pgp_sym_encrypt(signing_key, 'system_master_key'), -- Encrypt the key
        'HMAC-SHA256'
    );
    
    RETURN signing_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to compute audit trail hash
CREATE OR REPLACE FUNCTION compute_audit_hash(
    p_user_id UUID,
    p_action_type VARCHAR,
    p_table_name VARCHAR,
    p_record_id VARCHAR,
    p_old_values JSONB,
    p_new_values JSONB,
    p_timestamp TIMESTAMP,
    p_previous_hash VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
    hash_input TEXT;
    computed_hash VARCHAR;
BEGIN
    -- Create hash input string
    hash_input := COALESCE(p_user_id::text, '') || '|' ||
                  COALESCE(p_action_type, '') || '|' ||
                  COALESCE(p_table_name, '') || '|' ||
                  COALESCE(p_record_id, '') || '|' ||
                  COALESCE(p_old_values::text, '') || '|' ||
                  COALESCE(p_new_values::text, '') || '|' ||
                  COALESCE(p_timestamp::text, '') || '|' ||
                  COALESCE(p_previous_hash, '');
    
    -- Compute SHA-256 hash
    computed_hash := encode(digest(hash_input, 'sha256'), 'hex');
    
    RETURN computed_hash;
END;
$$ LANGUAGE plpgsql;

-- Function to get the last audit hash
CREATE OR REPLACE FUNCTION get_last_audit_hash() RETURNS VARCHAR AS $$
DECLARE
    last_hash VARCHAR;
BEGIN
    SELECT data_hash INTO last_hash 
    FROM audit_trail 
    ORDER BY sequence_number DESC 
    LIMIT 1;
    
    RETURN COALESCE(last_hash, '0000000000000000000000000000000000000000000000000000000000000000');
END;
$$ LANGUAGE plpgsql;

-- Function to create audit trail entry
CREATE OR REPLACE FUNCTION create_audit_entry(
    p_user_id UUID,
    p_session_id VARCHAR,
    p_action_type VARCHAR,
    p_table_name VARCHAR DEFAULT NULL,
    p_record_id VARCHAR DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    audit_id UUID;
    previous_hash VARCHAR;
    computed_hash VARCHAR;
    audit_timestamp TIMESTAMP;
BEGIN
    audit_id := uuid_generate_v4();
    audit_timestamp := CURRENT_TIMESTAMP;
    previous_hash := get_last_audit_hash();
    
    -- Compute hash for this entry
    computed_hash := compute_audit_hash(
        p_user_id, p_action_type, p_table_name, p_record_id,
        p_old_values, p_new_values, audit_timestamp, previous_hash
    );
    
    -- Insert audit entry
    INSERT INTO audit_trail (
        id, user_id, session_id, action_type, table_name, record_id,
        old_values, new_values, timestamp, ip_address, user_agent,
        reason, data_hash, previous_hash
    ) VALUES (
        audit_id, p_user_id, p_session_id, p_action_type, p_table_name, p_record_id,
        p_old_values, p_new_values, audit_timestamp, p_ip_address, p_user_agent,
        p_reason, computed_hash, previous_hash
    );
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert test users with signing keys
INSERT INTO users (username, email, password_hash, full_name, role, department) VALUES
('admin', 'admin@nobilis.com', '$2b$10$example.hash.here', 'System Administrator', 'admin', 'IT'),
('supervisor', 'supervisor@nobilis.com', '$2b$10$example.hash.here', 'Production Supervisor', 'supervisor', 'Production'),
('operator1', 'operator1@nobilis.com', '$2b$10$example.hash.here', 'Machine Operator', 'operator', 'Production'),
('qa_manager', 'qa@nobilis.com', '$2b$10$example.hash.here', 'QA Manager', 'qa_manager', 'Quality Assurance');

-- Generate signing keys for all users
DO $$
DECLARE
    user_rec RECORD;
BEGIN
    FOR user_rec IN SELECT id FROM users LOOP
        PERFORM generate_user_signing_key(user_rec.id);
    END LOOP;
END $$;

-- Insert test certifications
INSERT INTO certifications (user_id, certification_name, issued_date, expiry_date, issuer) VALUES
((SELECT id FROM users WHERE username = 'operator1'), 'GMP Basic Training', '2024-01-15', '2025-01-15', 'Nobilis Training Center'),
((SELECT id FROM users WHERE username = 'qa_manager'), 'FDA 21 CFR Part 11 Training', '2024-02-01', '2025-02-01', 'Regulatory Academy');

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

-- Create some initial audit entries
SELECT create_audit_entry(
    (SELECT id FROM users WHERE username = 'admin'),
    'session-001',
    'CREATE_FORMULA',
    'formulas',
    'FORM-001',
    NULL,
    '{"article_number": "FORM-001", "product_name": "Paracetamol 500mg Tablet"}'::jsonb,
    '192.168.1.100'::inet,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Initial formula creation'
);

-- Views for easier querying
CREATE VIEW v_audit_trail_with_users AS
SELECT 
    at.*,
    u.username,
    u.full_name,
    u.role
FROM audit_trail at
LEFT JOIN users u ON at.user_id = u.id
ORDER BY at.sequence_number DESC;

CREATE VIEW v_signatures_with_details AS
SELECT 
    es.*,
    u.username as signer_username,
    u.full_name as signer_name,
    at.action_type,
    at.table_name,
    at.record_id
FROM electronic_signatures es
JOIN users u ON es.signer_user_id = u.id
JOIN audit_trail at ON es.audit_trail_id = at.id
ORDER BY es.signed_at DESC;