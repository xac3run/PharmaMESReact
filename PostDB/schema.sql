-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if exist (for clean start)
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

-- Create indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_certifications_user_id ON certifications(user_id);
CREATE INDEX idx_materials_article ON materials(article_number);
CREATE INDEX idx_formulas_article ON formulas(article_number);
CREATE INDEX idx_formula_bom_formula_id ON formula_bom(formula_id);


-- Insert test users (password: 1234)
INSERT INTO users (username, email, password_hash, full_name, role, department) VALUES
('admin', 'admin@nobilis.com', '1234', 'System Administrator', 'admin', 'IT'),
('supervisor', 'supervisor@nobilis.com', '1234', 'Production Supervisor', 'supervisor', 'Production'),
('operator1', 'operator1@nobilis.com', '1234', 'Machine Operator', 'operator', 'Production');

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
