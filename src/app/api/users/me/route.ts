import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import { meRateLimit } from '@/lib/rate-limiter';

// Define permissions by role
const ROLE_PERMISSIONS: Record<string, string[]> = {
    director: [
        'assets:read', 'assets:write', 'assets:delete',
        'users:read', 'users:write', 'users:delete',
        'licenses:read', 'licenses:write', 'licenses:delete',
        'categories:read', 'categories:write', 'categories:delete',
        'locations:read', 'locations:write', 'locations:delete',
        'departments:read', 'departments:write', 'departments:delete',
        'reports:read', 'reports:write',
        'dashboard:read',
        'settings:read', 'settings:write',
        'audit:read',
    ],
    head_it: [
        'assets:read', 'assets:write', 'assets:delete',
        'users:read', 'users:write',
        'licenses:read', 'licenses:write', 'licenses:delete',
        'categories:read', 'categories:write', 'categories:delete',
        'locations:read', 'locations:write', 'locations:delete',
        'departments:read', 'departments:write', 'departments:delete',
        'reports:read', 'reports:write',
        'dashboard:read',
        'settings:read',
        'audit:read',
    ],
    it_asset_manager: [
        'assets:read', 'assets:write',
        'users:read',
        'licenses:read', 'licenses:write',
        'categories:read', 'categories:write',
        'locations:read', 'locations:write',
        'departments:read', 'departments:write',
        'reports:read',
        'dashboard:read',
    ],
    finance: [
        'assets:read',
        'licenses:read',
        'reports:read',
        'dashboard:read',
    ],
    lead_it_gov: [
        'assets:read', 'assets:write',
        'users:read',
        'licenses:read', 'licenses:write',
        'categories:read', 'categories:write',
        'locations:read', 'locations:write',
        'departments:read', 'departments:write',
        'reports:read', 'reports:write',
        'dashboard:read',
        'audit:read',
    ],
    employee: [
        'assets:read',
        'dashboard:read',
    ],
    super_admin: [
        'assets:read', 'assets:write', 'assets:delete',
        'users:read', 'users:write', 'users:delete',
        'licenses:read', 'licenses:write', 'licenses:delete',
        'categories:read', 'categories:write', 'categories:delete',
        'locations:read', 'locations:write', 'locations:delete',
        'departments:read', 'departments:write', 'departments:delete',
        'reports:read', 'reports:write',
        'dashboard:read',
        'settings:read', 'settings:write',
        'audit:read',
    ],
};

export async function GET(request: NextRequest) {
    // Apply rate limiting
    const rateLimitResponse = await meRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { success: false, message: 'Unauthenticated' },
                { status: 401 }
            );
        }

        // Get fresh user data from database to include is_active and created_at
        const userQuery = `
            SELECT id, employee_id, name, email, department, role, is_active, created_at
            FROM users
            WHERE id = $1
        `;
        const userResult = await pool.query(userQuery, [session.id]);

        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        const user = userResult.rows[0];

        if (!user.is_active) {
            return NextResponse.json(
                { success: false, message: 'Account is deactivated' },
                { status: 403 }
            );
        }

        // Get permissions for the user's role
        const permissions = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.employee || [];

        return NextResponse.json({
            success: true,
            data: {
                id: user.id,
                employee_id: user.employee_id,
                name: user.name,
                email: user.email,
                department: user.department,
                role: user.role,
                is_active: user.is_active,
                created_at: user.created_at,
                permissions,
            },
        });
    } catch (error) {
        console.error('Fetch current user profile error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mengambil profil pengguna' },
            { status: 500 }
        );
    }
}