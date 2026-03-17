import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define a directory for test uploads (can be different from your main uploads)
const TEST_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'test-uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(TEST_UPLOADS_DIR)) {
  fs.mkdirSync(TEST_UPLOADS_DIR, { recursive: true });
}

const MAX_FILE_SIZE_MB = 10; // Example: 10MB limit
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Helper function to add CORS headers (optional, but good for testing from different origins)
const addCorsHeaders = (response: NextResponse) => {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
};

export async function OPTIONS() {
    return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File | null; // Expecting file under key 'image'

        if (!file) {
            return addCorsHeaders(
                NextResponse.json({ error: 'No file uploaded. Please send a file with the key "image".' }, { status: 400 })
            );
        }

        // Basic validation (you can add more, like file type)
        if (file.size === 0) {
            return addCorsHeaders(
                NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 })
            );
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            return addCorsHeaders(
                NextResponse.json({ error: `File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.` }, { status: 400 })
            );
        }

        // Generate a unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const extension = file.name.split('.').pop()?.toLowerCase() || 'tmp';
        const filename = `test-upload-${uniqueSuffix}.${extension}`;
        const filePath = path.join(TEST_UPLOADS_DIR, filename);

        // Save the file
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, fileBuffer);

        const publicUrl = `/uploads/test-uploads/${filename}`;

        return addCorsHeaders(
            NextResponse.json(
                {
                    message: 'File uploaded successfully for testing!',
                    filename: filename,
                    url: publicUrl,
                    size: file.size,
                    type: file.type,
                },
                { status: 201 }
            )
        );

    } catch (error) {
        console.error('Test upload error:', error);
        let errorMessage = 'Failed to upload file for testing.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return addCorsHeaders(
            NextResponse.json({ error: errorMessage }, { status: 500 })
        );
    }
}