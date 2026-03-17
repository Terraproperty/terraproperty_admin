// filepath: c:\\Users\\kmlro\\Downloads\\terrra\\src\\app\\api\\upload-cv\\route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Ensure the uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'cvs');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = (formData.get('cv') || formData.get('jdPdf')) as File | null;
    

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400, headers: corsHeaders });
    }

    // Check file type (optional, but recommended)
    // Example: Allow only PDF and DOCX
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF and DOCX are allowed.' }, { status: 400, headers: corsHeaders });
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const extension = file.name.substring(file.name.lastIndexOf('.') + 1);
    const filename = `${originalName}-${uniqueSuffix}.${extension}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    const fileUrlPath = `/uploads/cvs/${filename}`; // Path accessible from the browser

    // Save the file
    // Convert ArrayBuffer to Buffer for Node.js fs
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, fileBuffer);

    // Here, you would typically save the fileUrlPath and any other relevant data
    // (e.g., applicant name, email from formData) to your database.
    // For example:
    // const applicantName = formData.get('applicantName') as string | null;
    // await db.careerApplication.create({ data: { cvPath: fileUrlPath, name: applicantName, ... } });

    return NextResponse.json({ success: true, message: 'CV uploaded successfully.', filePath: fileUrlPath }, { headers: corsHeaders });
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: 'Failed to upload CV.', details: error.message }, { status: 500, headers: corsHeaders });
    }
    return NextResponse.json({ error: 'Failed to upload CV.' }, { status: 500, headers: corsHeaders });
  }
}

// Optional: GET handler to list CVs or specific CV (for admin panel)
// This would typically fetch data from your database
// For now, this is a placeholder
export async function GET(request: NextRequest) {
    // In a real application, you'd fetch CV metadata from the database
    // For demonstration, let's list files in the directory (not recommended for production without proper security)
    try {
        const files = fs.readdirSync(UPLOADS_DIR);
        const cvs = files.map(file => ({
            name: file,
            url: `/uploads/cvs/${file}`
        }));
        return NextResponse.json({ cvs }, { headers: corsHeaders });
    } catch (error) {
        console.error('Error listing CVs:', error);
        return NextResponse.json({ error: 'Failed to list CVs.' }, { status: 500, headers: corsHeaders });
    }
}
