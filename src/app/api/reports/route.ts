import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'assignments';
        const startDate = searchParams.get('startDate') || '2020-01-01';
        const endDate = searchParams.get('endDate') || '2099-12-31';
        const format = searchParams.get('format') || 'json';

        let rows: any[] = [];
        let summary: Record<string, any> = {};

        if (type === 'assignments') {
            const query = `
                SELECT 
                    aa.id,
                    a.asset_tag,
                    ac.name as category_name,
                    a.brand || ' ' || a.model as asset_name,
                    a.serial_number,
                    u.name as employee_name,
                    u.employee_id,
                    u.department,
                    aa.assigned_date,
                    aa.returned_date,
                    aa.status as assignment_status,
                    aa.condition_notes
                FROM asset_assignments aa
                JOIN assets a ON a.id = aa.asset_id
                LEFT JOIN asset_categories ac ON ac.id = a.category_id
                JOIN users u ON u.id = aa.user_id
                WHERE aa.assigned_date BETWEEN $1 AND $2
                ORDER BY aa.assigned_date DESC
            `;
            const result = await pool.query(query, [startDate, endDate]);
            rows = result.rows;

            summary = {
                total_transactions: rows.length,
                active_assignments: rows.filter((r) => r.assignment_status === 'active').length,
                returned_assignments: rows.filter((r) => r.assignment_status === 'returned').length,
            };
        } else if (type === 'maintenance') {
            const query = `
                SELECT 
                    m.id,
                    a.asset_tag,
                    a.brand || ' ' || a.model as asset_name,
                    m.vendor_name,
                    m.cost,
                    m.start_date as maintenance_date,
                    m.issue_description,
                    m.action_taken,
                    m.status
                FROM maintenance_logs m
                JOIN assets a ON a.id = m.asset_id
                WHERE m.start_date BETWEEN $1 AND $2
                ORDER BY m.start_date DESC
            `;
            const result = await pool.query(query, [startDate, endDate]);
            rows = result.rows;

            const totalCost = rows.reduce((acc, curr) => acc + (parseFloat(curr.cost) || 0), 0);
            summary = {
                total_maintenance_events: rows.length,
                total_cost: totalCost,
                completed_events: rows.filter((r) => r.status === 'completed').length,
            };
        } else if (type === 'disposal') {
            const query = `
                SELECT 
                    d.id,
                    a.asset_tag,
                    a.brand || ' ' || a.model as asset_name,
                    d.disposal_date,
                    d.disposal_type as method,
                    u.name as approved_by,
                    d.residual_value as disposal_value,
                    d.reason
                FROM asset_disposals d
                JOIN assets a ON a.id = d.asset_id
                LEFT JOIN users u ON u.id = d.approved_by
                WHERE d.disposal_date BETWEEN $1 AND $2
                ORDER BY d.disposal_date DESC
            `;
            const result = await pool.query(query, [startDate, endDate]);
            rows = result.rows;

            const totalSalvage = rows.reduce(
                (acc, curr) => acc + (parseFloat(curr.disposal_value) || 0),
                0
            );
            summary = {
                total_disposed_units: rows.length,
                total_salvage_value: totalSalvage,
            };
        } else if (type === 'assets') {
            const query = `
                SELECT 
                    a.id,
                    a.asset_tag,
                    ac.name as category_name,
                    a.brand,
                    a.model,
                    a.serial_number,
                    a.status,
                    a.purchase_date,
                    a.warranty_expiry,
                    u.name as current_holder,
                    u.department as current_department
                FROM assets a
                LEFT JOIN asset_categories ac ON ac.id = a.category_id
                LEFT JOIN LATERAL (
                    SELECT u2.name, u2.department 
                    FROM asset_assignments aa2 
                    JOIN users u2 ON u2.id = aa2.user_id 
                    WHERE aa2.asset_id = a.id AND aa2.status = 'active'
                    ORDER BY aa2.assigned_date DESC 
                    LIMIT 1
                ) u ON true
                WHERE (a.purchase_date BETWEEN $1 AND $2) OR (a.purchase_date IS NULL)
                ORDER BY a.asset_tag ASC
            `;
            const result = await pool.query(query, [startDate, endDate]);
            rows = result.rows;

            summary = {
                total_assets: rows.length,
                in_stock: rows.filter((r) => r.status === 'in_stock').length,
                deployed: rows.filter((r) => r.status === 'deployed').length,
                repair: rows.filter((r) => r.status === 'repair').length,
                disposed: rows.filter((r) => r.status === 'disposed').length,
            };
        } else if (type === 'licenses') {
            const query = `
                SELECT 
                    l.id,
                    l.software_name,
                    l.license_key,
                    l.total_seats,
                    l.expiry_date,
                    l.cost_per_year
                FROM licenses l
                ORDER BY l.software_name ASC
            `;
            const result = await pool.query(query);
            rows = result.rows;

            summary = {
                total_licenses: rows.length,
                total_seats: rows.reduce((acc, curr) => acc + (curr.total_seats || 0), 0),
                total_cost_per_year: rows.reduce(
                    (acc, curr) => acc + (parseFloat(curr.cost_per_year) || 0),
                    0
                ),
            };
        } else if (type === 'audit') {
            const query = `
                SELECT 
                    al.id,
                    al.scanned_at as scan_date,
                    a.asset_tag,
                    a.brand || ' ' || a.model as asset_name,
                    al.condition,
                    al.physical_location as scanned_location,
                    al.notes,
                    u.name as auditor_name
                FROM audit_logs al
                JOIN assets a ON a.id = al.asset_id
                LEFT JOIN users u ON u.id = al.scanned_by
                WHERE al.scanned_at::date BETWEEN $1 AND $2
                ORDER BY al.scanned_at DESC
            `;
            const result = await pool.query(query, [startDate, endDate]);
            rows = result.rows;

            summary = {
                total_audits: rows.length,
                good_condition: rows.filter((r) => r.condition === 'good').length,
                damaged_condition: rows.filter((r) => r.condition === 'damaged').length,
            };
        }

        // Jika requested format CSV
        if (format === 'csv') {
            if (rows.length === 0) {
                return new Response('No data available for the selected period', {
                    headers: {
                        'Content-Type': 'text/csv; charset=utf-8',
                        'Content-Disposition': `attachment; filename="report_${type}_${startDate}_to_${endDate}.csv"`,
                    },
                });
            }

            const headers = Object.keys(rows[0]);
            const csvRows = [headers.join(',')];

            for (const row of rows) {
                const values = headers.map((header) => {
                    const val = row[header];
                    if (val === null || val === undefined) return '""';
                    if (val instanceof Date) return `"${val.toISOString().split('T')[0]}"`;
                    const escaped = String(val).replace(/"/g, '""');
                    return `"${escaped}"`;
                });
                csvRows.push(values.join(','));
            }

            return new Response(csvRows.join('\n'), {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="report_${type}_${startDate}_sd_${endDate}.csv"`,
                },
            });
        }

        return NextResponse.json({
            success: true,
            type,
            startDate,
            endDate,
            summary,
            data: rows,
        });
    } catch (error) {
        console.error('Report API error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal memproses data laporan' },
            { status: 500 }
        );
    }
}
