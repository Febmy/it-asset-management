import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '@/lib/auth';

const ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.webp', '.gif',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv',
];

export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { success: false, message: 'Unauthenticated' },
                { status: 401 }
            );
        }

        // Check if user has permission to upload
        const uploadRoles = ['director', 'head_it', 'it_asset_manager', 'lead_it_gov', 'finance', 'super_admin'];
        if (!uploadRoles.includes(session.role)) {
            return NextResponse.json(
                { success: false, message: 'Insufficient permissions to upload files' },
                { status: 403 }
            );
        }

        const contentType = request.headers.get('content-type');
        if (!contentType || !contentType.includes('multipart/form-data')) {
            return NextResponse.json(
                { success: false, message: 'Content-Type must be multipart/form-data' },
                { status: 400 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, message: `File type ${file.type} is not allowed` },
                { status: 400 }
            );
        }

        // Validate file extension
        const fileExt = path.extname(file.name).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
            return NextResponse.json(
                { success: false, message: `File extension ${fileExt} is not allowed` },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)} MB` },
                { status: 400 }
            );
        }

        // Generate unique filename
        const uniqueName = `${uuidv4()}${fileExt}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        const filePath = path.join(uploadDir, uniqueName);

        // Ensure upload directory exists
        await fs.mkdir(uploadDir, { recursive: true });

        // Convert file to buffer and save
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(filePath, buffer);

        // Return file info
        const fileUrl = `/uploads/${uniqueName}`;

        return NextResponse.json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                filename: uniqueName,
                original_name: file.name,
                mime_type: file.type,
                size: file.size,
                url: fileUrl,
            },
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mengunggah file' },
            { status: 500 }
        );
    }
}