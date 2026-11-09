ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('director', 'it_asset_manager', 'head_it', 'finance', 'lead_it_gov', 'super_admin', 'it_technician', 'employee'));
