export type SystemAccountRole =
    | 'director'
    | 'finance'
    | 'it_asset_manager'
    | 'lead_it_gov'
    | 'head_it';

export type UserRole =
    | SystemAccountRole
    | 'super_admin'
    | 'it_technician'
    | 'employee';

export const SYSTEM_ACCOUNT_ROLES: { value: SystemAccountRole; label: string; description: string }[] = [
    { value: 'director', label: 'Direktur', description: 'Eksekutif / Approval tertinggi & Laporan' },
    { value: 'it_asset_manager', label: 'IT Asset Manager', description: 'Pengelola seluruh aset, mutasi, & disposal' },
    { value: 'head_it', label: 'Head of IT', description: 'Kepala IT, persetujuan teknis, & pengawasan' },
    { value: 'finance', label: 'Finance', description: 'Divisi Keuangan, anggaran, & rekapitulasi biaya' },
    { value: 'lead_it_gov', label: 'Lead IT Governance', description: 'Audit kepatuhan, lisensi, & regulasi TI' },
];

export interface User {
    id: number;
    employee_id: string;
    name: string;
    email: string;
    department: string | null;
    role: UserRole;
    is_active: boolean;
    created_at?: string;
    has_password?: boolean;
}

export interface UserSession {
    id: number;
    employee_id: string;
    name: string;
    email: string;
    department: string | null;
    role: UserRole;
}

