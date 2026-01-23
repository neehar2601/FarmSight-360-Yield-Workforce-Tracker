-- ============================================
-- FarmSight 360 Database Schema
-- PostgreSQL 14+
-- Version: 1.0
-- Date: 2026-01-23
-- ============================================

-- This schema is designed with microservice architecture in mind
-- Each domain (Auth, Farm, Crop, Worker, Financial) can be separated later

-- ============================================
-- EXTENSIONS
-- ============================================

-- No UUID extension needed - using human-readable string IDs

-- ============================================
-- ENUMS (Type Safety)
-- ============================================

-- Attendance status
CREATE TYPE attendance_status AS ENUM ('P', 'H', 'A');
-- P = Present, H = Half Day, A = Absent

-- Crop quality grades
CREATE TYPE crop_grade AS ENUM ('A', 'B', 'C');
-- A = Premium, B = Standard, C = Basic

-- Transaction types
CREATE TYPE transaction_type AS ENUM ('Revenue', 'Expense');

-- Tool/Equipment status
CREATE TYPE tool_status AS ENUM ('Working', 'Maintenance', 'Broken');

-- Worker transaction types
CREATE TYPE worker_transaction_type AS ENUM ('advance', 'repayment');

-- ============================================
-- DOMAIN: AUTHENTICATION & USERS
-- ============================================

-- Users table (Auth Service)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,  -- Format: firstname_lastname_xxxx
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast email lookups
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- DOMAIN: FARM MANAGEMENT
-- ============================================

-- Farms table (Farm Service)
CREATE TABLE farms (
    id VARCHAR(100) PRIMARY KEY,  -- Format: farmname_owner_xxxx
    owner_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    area DECIMAL(10, 2),  -- in acres/hectares
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for owner lookups
CREATE INDEX idx_farms_owner_id ON farms(owner_id);

-- Fertilizers inventory (Farm Service)
CREATE TABLE fertilizers (
    id VARCHAR(100) PRIMARY KEY,
    farm_id VARCHAR(100) NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,  -- bags, kg, L, etc.
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fertilizers_farm_id ON fertilizers(farm_id);

-- Tools/Equipment (Farm Service)
CREATE TABLE tools (
    id VARCHAR(100) PRIMARY KEY,
    farm_id VARCHAR(100) NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,  -- Tractor, Sprayer, etc.
    status tool_status NOT NULL DEFAULT 'Working',
    purchase_date DATE,
    last_maintenance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tools_farm_id ON tools(farm_id);

-- ============================================
-- DOMAIN: CROP MANAGEMENT
-- ============================================

-- Crop types lookup (Crop Service)
CREATE TABLE crops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Yields/Harvests (Crop Service)
CREATE TABLE yields (
    id VARCHAR(100) PRIMARY KEY,
    farm_id VARCHAR(100) NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    crop_id INTEGER NOT NULL REFERENCES crops(id),
    date DATE NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    grade crop_grade NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_yields_farm_id ON yields(farm_id);
CREATE INDEX idx_yields_crop_id ON yields(crop_id);
CREATE INDEX idx_yields_date ON yields(date);

-- Sales (Crop Service)
CREATE TABLE sales (
    id VARCHAR(100) PRIMARY KEY,
    farm_id VARCHAR(100) NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    crop_id INTEGER NOT NULL REFERENCES crops(id),
    date DATE NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    grade crop_grade NOT NULL,
    revenue DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_farm_id ON sales(farm_id);
CREATE INDEX idx_sales_crop_id ON sales(crop_id);
CREATE INDEX idx_sales_date ON sales(date);

-- Crop inventory (Crop Service)
CREATE TABLE crop_inventory (
    id VARCHAR(100) PRIMARY KEY,
    farm_id VARCHAR(100) NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    crop_id INTEGER NOT NULL REFERENCES crops(id),
    grade crop_grade NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(farm_id, crop_id, grade)
);

CREATE INDEX idx_crop_inventory_farm_id ON crop_inventory(farm_id);

-- ============================================
-- DOMAIN: WORKER MANAGEMENT
-- ============================================

-- Workers (Worker Service)
CREATE TABLE workers (
    id VARCHAR(100) PRIMARY KEY,
    farm_id VARCHAR(100) NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    contact VARCHAR(20),
    per_day_salary DECIMAL(10, 2) NOT NULL,
    loan_balance DECIMAL(10, 2) DEFAULT 0,
    last_settlement_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workers_farm_id ON workers(farm_id);

-- Attendance (Worker Service)
CREATE TABLE attendance (
    id VARCHAR(100) PRIMARY KEY,
    worker_id VARCHAR(100) NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_id, date)
);

CREATE INDEX idx_attendance_worker_id ON attendance(worker_id);
CREATE INDEX idx_attendance_date ON attendance(date);

-- Worker transactions (advances/repayments) (Worker Service)
CREATE TABLE worker_transactions (
    id VARCHAR(100) PRIMARY KEY,
    worker_id VARCHAR(100) NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    farm_id VARCHAR(100) NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type worker_transaction_type NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    settled BOOLEAN DEFAULT FALSE,
    settled_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_worker_transactions_worker_id ON worker_transactions(worker_id);
CREATE INDEX idx_worker_transactions_settled ON worker_transactions(settled);

-- Worker payments (weekly settlements) (Worker Service)
CREATE TABLE worker_payments (
    id VARCHAR(100) PRIMARY KEY,
    worker_id VARCHAR(100) NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    farm_id VARCHAR(100) NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    settlement_date DATE NOT NULL,
    base_salary DECIMAL(10, 2) NOT NULL,
    advance_amount DECIMAL(10, 2) DEFAULT 0,
    repayment_amount DECIMAL(10, 2) DEFAULT 0,
    bonus_amount DECIMAL(10, 2) DEFAULT 0,
    total_payout DECIMAL(10, 2) NOT NULL,
    days_worked DECIMAL(4, 1) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_worker_payments_worker_id ON worker_payments(worker_id);
CREATE INDEX idx_worker_payments_settlement_date ON worker_payments(settlement_date);

-- ============================================
-- DOMAIN: FINANCIAL TRACKING
-- ============================================

-- Transactions (Financial Service)
CREATE TABLE transactions (
    id VARCHAR(100) PRIMARY KEY,
    farm_id VARCHAR(100) NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type transaction_type NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),  -- Worker Payment, Crop Sale, Resource Purchase, etc.
    related_entity_type VARCHAR(50),  -- worker, crop, fertilizer, etc.
    related_entity_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_farm_id ON transactions(farm_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for farms table
CREATE TRIGGER update_farms_updated_at
    BEFORE UPDATE ON farms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for workers table
CREATE TRIGGER update_workers_updated_at
    BEFORE UPDATE ON workers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_updated for inventory
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for crop_inventory
CREATE TRIGGER update_crop_inventory_last_updated
    BEFORE UPDATE ON crop_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();

-- Trigger for fertilizers
CREATE TRIGGER update_fertilizers_last_updated
    BEFORE UPDATE ON fertilizers
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE users IS 'User accounts for authentication';
COMMENT ON TABLE farms IS 'Farm entities owned by users';
COMMENT ON TABLE crops IS 'Crop types lookup table';
COMMENT ON TABLE yields IS 'Harvest records for crops';
COMMENT ON TABLE sales IS 'Sales transactions for harvested crops';
COMMENT ON TABLE crop_inventory IS 'Current inventory levels by crop and grade';
COMMENT ON TABLE workers IS 'Farm workers/employees';
COMMENT ON TABLE attendance IS 'Daily attendance records for workers';
COMMENT ON TABLE worker_transactions IS 'Mid-week advances and repayments';
COMMENT ON TABLE worker_payments IS 'Weekly payment settlements';
COMMENT ON TABLE transactions IS 'All financial transactions';
COMMENT ON TABLE fertilizers IS 'Fertilizer inventory';
COMMENT ON TABLE tools IS 'Farm tools and equipment';

COMMIT;
