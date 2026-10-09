-- 1. Tambah Akun Sistem Berwenang & Master Karyawan
INSERT INTO users (employee_id, name, email, department, role, is_active) VALUES 
('DIR-0001', 'Budi Hartono', 'director@yodu.id', 'Executive Board', 'director', TRUE),
('ITM-0001', 'Dimas Pratama', 'asset.mgmt@yodu.id', 'IT', 'it_asset_manager', TRUE),
('HIT-0001', 'Hendra Wijaya', 'head.it@yodu.id', 'IT', 'head_it', TRUE),
('FIN-0001', 'Ratna Sari', 'finance@yodu.id', 'Finance', 'finance', TRUE),
('GOV-0001', 'Aris Munandar', 'it.gov@yodu.id', 'IT Governance', 'lead_it_gov', TRUE),
('EMP-0001', 'Admin IT', 'admin.it@yodu.id', 'IT', 'super_admin', TRUE),
('EMP-0002', 'Teknisi Lapangan', 'tech@yodu.id', 'IT', 'it_technician', TRUE),
('EMP-0142', 'Febmy', 'febmy@yodu.id', 'Finance', 'employee', TRUE);


-- 2. Tambah Sample Aset Hardware
INSERT INTO assets 
  (asset_tag, category_id, serial_number, brand, model, specs, status, warranty_expiry, purchase_date)
VALUES 
  (
    'IT-NB-2026-0001', 
    (SELECT id FROM asset_categories WHERE code = 'NB'), 
    'PF4XYZ01', 
    'Lenovo', 
    'ThinkPad T14 Gen 4', 
    '{"cpu": "i7-1365U", "ram": "16GB", "storage": "512GB SSD"}', 
    'deployed', 
    '2027-01-10', 
    '2024-01-10'
  ),
  (
    'IT-NB-2026-0002', 
    (SELECT id FROM asset_categories WHERE code = 'NB'), 
    '8CG1234ABC', 
    'HP', 
    'EliteBook 840', 
    '{"cpu": "i5-1235U", "ram": "16GB", "storage": "512GB SSD"}', 
    'in_stock', 
    '2027-06-20', 
    '2024-06-20'
  );

-- 3. Hubungkan unit 0001 ke Febmy (Assignment aktif)
INSERT INTO asset_assignments (asset_id, user_id, assigned_date, condition_notes, status)
VALUES (
  (SELECT id FROM assets WHERE asset_tag = 'IT-NB-2026-0001'),
  (SELECT id FROM users WHERE employee_id = 'EMP-0142'),
  '2024-01-10',
  'Lengkap charger bawaan & tas laptop',
  'active'
);