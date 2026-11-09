-- 1. Tambah Akun Sistem Berwenang & Master Karyawan
INSERT INTO users (employee_id, name, email, department, role, is_active) VALUES 
('DIR-0001', 'Director', 'director@yodu.id', 'Executive Board', 'director', TRUE),
('ITM-0001', 'IT Asset Manager', 'asset.mgmt@yodu.id', 'IT', 'it_asset_manager', TRUE),
('HIT-0001', 'Head of IT', 'head.it@yodu.id', 'IT', 'head_it', TRUE),
('FIN-0001', 'Finance', 'finance@yodu.id', 'Finance', 'finance', TRUE),
('GOV-0001', 'Lead IT Governance', 'it.gov@yodu.id', 'IT Governance', 'lead_it_gov', TRUE),
('EMP-0142', 'Febmy', 'febmy@yodu.id', 'IT Governance', 'employee', TRUE);
