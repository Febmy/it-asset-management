import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { meRateLimit } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
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

        return NextResponse.json({
            success: true,
            data: session,
        });
    } catch (error) {
        console.error('Fetch me error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mengambil data sesi' },
            { status: 500 }
        );
    }
}
