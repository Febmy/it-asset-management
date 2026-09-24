-- IT Asset Management Database Schema (PostgreSQL)

-- 1. Tabel Pengguna / Karyawan
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    department VARCHAR(100),
    password_hash VARCHAR(255),
    role VARCHAR(30) DEFAULT 'employee' CHECK (role IN ('super_admin', 'it_technician', 'employee')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1b. Tabel Master Divisi / Departemen
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(30) UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 2. Tabel Kategori Aset
CREATE TABLE IF NOT EXISTS asset_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL
);

-- 3. Tabel Master Aset Perangkat Keras
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    asset_tag VARCHAR(50) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES asset_categories(id) ON DELETE SET NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    specs JSONB,
    mac_address_lan VARCHAR(50),
    mac_address_wifi VARCHAR(50),
    purchase_date DATE,
    warranty_expiry DATE,
    status VARCHAR(30) DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'deployed', 'repair', 'disposed')),
    image_url VARCHAR(500),
    proof_doc_url VARCHAR(500),
    proof_notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Riwayat Penyerahan Unit (Asset Assignments)
CREATE TABLE IF NOT EXISTS asset_assignments (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    returned_date DATE,
    condition_notes TEXT,
    bast_file_url VARCHAR(255),
    return_proof_url VARCHAR(500),
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'returned'))
);

-- 5. Tabel Pemusnahan / Penghapusan Unit (Asset Disposals)
CREATE TABLE IF NOT EXISTS asset_disposals (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    disposal_type VARCHAR(50) NOT NULL,
    disposal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    residual_value NUMERIC(15, 2) DEFAULT 0,
    data_wiped BOOLEAN DEFAULT FALSE,
    wipe_method VARCHAR(100),
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    disposal_doc_url VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Log Perbaikan & Pemeliharaan (Maintenance Logs)
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    issue_description TEXT NOT NULL,
    vendor_name VARCHAR(150),
    cost NUMERIC(15, 2) DEFAULT 0,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completion_date DATE,
    action_taken TEXT,
    invoice_proof_url VARCHAR(500),
    status VARCHAR(30) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Lisensi Perangkat Lunak (Licenses)
CREATE TABLE IF NOT EXISTS licenses (
    id SERIAL PRIMARY KEY,
    software_name VARCHAR(150) NOT NULL,
    license_key VARCHAR(255),
    total_seats INTEGER DEFAULT 1,
    expiry_date DATE,
    cost_per_year NUMERIC(15, 2) DEFAULT 0
);

-- 8. Tabel Sesi Audit Fisik / Stock Opname (Audit Sessions)
CREATE TABLE IF NOT EXISTS audit_sessions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(30) DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed')),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabel Log Pemindaian Audit (Audit Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES audit_sessions(id) ON DELETE CASCADE,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    scanned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    scanned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    physical_location VARCHAR(150),
    condition VARCHAR(50) DEFAULT 'good',
    notes TEXT,
    CONSTRAINT uq_audit_session_asset UNIQUE (session_id, asset_id)
);

-- Indeks untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_assets_asset_tag ON assets(asset_tag);
CREATE INDEX IF NOT EXISTS idx_assets_serial_number ON assets(serial_number);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_asset_status ON asset_assignments(asset_id, status);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_user_id ON asset_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_asset_id ON maintenance_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);
