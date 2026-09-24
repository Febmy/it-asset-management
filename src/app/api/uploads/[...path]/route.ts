import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(
    request: Request,
    context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
    const resolvedParams = await Promise.resolve(context.params);
    const pathSegments = resolvedParams.path;

    if (!pathSegments || pathSegments.length === 0) {
        return new NextResponse('File not found', { status: 404 });
    }

    // Hindari path traversal
    const safePath = path.join(process.cwd(), 'public', 'uploads', ...pathSegments);
    const normalizedUploads = path.join(process.cwd(), 'public', 'uploads');

    if (!safePath.startsWith(normalizedUploads)) {
        return new NextResponse('Access denied', { status: 403 });
    }

    try {
        const fileBuffer = await fs.readFile(safePath);
        const ext = path.extname(safePath).toLowerCase();

        const mimeTypes: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.gif': 'image/gif',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch {
        return new NextResponse('File not found', { status: 404 });
    }
}
