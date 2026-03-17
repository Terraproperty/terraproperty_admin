import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Ensure the uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'jobs');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const jobs = await db.query('SELECT * FROM jobs ORDER BY createdAt DESC');
    return NextResponse.json(jobs, { headers: corsHeaders });
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const file = formData.get('jdPdf') as File | null;

    if (!title || !description || !file) {
      return NextResponse.json(
        { error: 'Title, description, and JD PDF file are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF is allowed.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const extension = file.name.substring(file.name.lastIndexOf('.') + 1);
    const filename = `${originalName}-${uniqueSuffix}.${extension}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    const fileUrlPath = `/uploads/jobs/${filename}`;

    // Save the file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, fileBuffer);

    // Insert job record into DB
    const job = {
      id: uuidv4(),
      title,
      description,
      jdPdfUrl: fileUrlPath,
      createdAt: new Date(),
    };

    await db.query(
      `INSERT INTO jobs (id, title, description, jd_pdf_url, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [job.id, job.title, job.description, job.jdPdfUrl, job.createdAt]
    );

    return NextResponse.json(job, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Failed to create job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'Job ID is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const formData = await request.formData();
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const file = formData.get('jdPdf') as File | null;

    // Build update fields
    const updates: string[] = [];
    const params: any[] = [];

    if (title) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description) {
      updates.push('description = ?');
      params.push(description);
    }

    let fileUrlPath: string | undefined;
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only PDF is allowed.' },
          { status: 400, headers: corsHeaders }
        );
      }
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const extension = file.name.substring(file.name.lastIndexOf('.') + 1);
      const filename = `${originalName}-${uniqueSuffix}.${extension}`;
      const filePath = path.join(UPLOADS_DIR, filename);
      fileUrlPath = `/uploads/jobs/${filename}`;
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filePath, fileBuffer);

      updates.push('jd_pdf_url = ?');
      params.push(fileUrlPath);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update.' },
        { status: 400, headers: corsHeaders }
      );
    }

    params.push(id);

    await db.query(
      `UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Return the updated job (fetch from DB if needed)
    return NextResponse.json(
      { message: 'Job updated successfully.' },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Failed to update job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500, headers: corsHeaders }
    );
  }
}
