export type AssetStatus = 'in_stock' | 'deployed' | 'repair' | 'disposed';

export interface AssetSpecs {
    cpu?: string;
    ram?: string;
    storage?: string;
    [key: string]: string | undefined;
}

export interface AssetCategory {
    id: number;
    name: string;
    code: string;
}

export interface Asset {
    id: number;
    asset_tag: string;
    category_id: number;
    category_name?: string;
    serial_number: string;
    brand: string;
    model: string;
    specs: AssetSpecs | null;
    mac_address_lan?: string | null;
    mac_address_wifi?: string | null;
    purchase_date?: string | null;
    warranty_expiry?: string | null;
    status: AssetStatus;
    image_url?: string | null;
    proof_doc_url?: string | null;
    proof_notes?: string | null;
    created_at?: string;
    assigned_to?: string | null;
    user_department?: string | null;
}

export interface AssetAssignment {
    id: number;
    asset_id: number;
    user_id: number;
    user_name?: string;
    employee_id?: string;
    department?: string | null;
    assigned_date: string;
    returned_date?: string | null;
    condition_notes?: string | null;
    bast_file_url?: string | null;
    return_proof_url?: string | null;
    status: 'active' | 'returned';
}

export interface AssetDisposal {
    id: number;
    asset_id: number;
    disposal_type: string;
    disposal_date: string;
    residual_value: number;
    data_wiped: boolean;
    wipe_method?: string | null;
    approved_by?: number | null;
    reason: string;
    disposal_doc_url?: string | null;
    created_at?: string;
}

export interface MaintenanceLog {
    id: number;
    asset_id: number;
    issue_description: string;
    vendor_name?: string | null;
    cost: number;
    start_date: string;
    completion_date?: string | null;
    action_taken?: string | null;
    invoice_proof_url?: string | null;
    status: 'in_progress' | 'completed';
    created_at?: string;
}

export interface AuditSession {
    id: number;
    name: string;
    start_date: string;
    end_date?: string | null;
    status: 'ongoing' | 'completed';
    created_at?: string;
}

export interface AuditLog {
    id: number;
    session_id: number;
    asset_id: number;
    asset_tag?: string;
    brand?: string;
    model?: string;
    scanned_by?: number | null;
    scanned_by_name?: string | null;
    scanned_at: string;
    physical_location: string;
    condition: string;
    notes?: string | null;
}