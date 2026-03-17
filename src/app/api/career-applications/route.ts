import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS', // Added PATCH
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) { // Use NextRequest
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
    try {
        const applications = await db.query(
            'SELECT * FROM career_applications ORDER BY createdAt DESC'
        );
        return NextResponse.json(applications, { headers: corsHeaders });
    } catch (error) {
        console.error('Failed to fetch career applications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch career applications' },
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function PATCH(request: NextRequest) { // Use NextRequest
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const { status } = await request.json();

        if (!id || !status) {
            return NextResponse.json(
                { error: 'ID and status are required' },
                { status: 400, headers: corsHeaders }
            );
        }

        await db.query(
            'UPDATE career_applications SET status = ? WHERE id = ?',
            [status, id]
        );

        return NextResponse.json({ message: 'Status updated successfully' }, { headers: corsHeaders });
    } catch (error) {
        console.error('Failed to update career application:', error);
        return NextResponse.json(
            { error: 'Failed to update career application' },
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function POST(request: NextRequest) { // Use NextRequest
    try {
        const data = await request.json();
        const {
            name,
            email,
            phone,
            positionApplied,
            experienceYears,
            currentCompany,
            resumeUrl,
            coverLetter
        } = data;

        // Validation
        if (!name || !email || !positionApplied) {
            return NextResponse.json(
                { error: 'Name, email, and position applied for are required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const application = {
            id: uuidv4(),
            name,
            email,
            phone: phone || null,
            positionApplied,
            experienceYears: experienceYears || null,
            currentCompany: currentCompany || null,
            resumeUrl: resumeUrl || null,
            coverLetter: coverLetter || null,
            status: 'new', // Default status
        };

        await db.query(
            `INSERT INTO career_applications (
                id, name, email, phone, position_applied, experience_years,
                current_company, resume_url, cover_letter, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                application.id, application.name, application.email, application.phone,
                application.positionApplied, application.experienceYears,
                application.currentCompany, application.resumeUrl,
                application.coverLetter, application.status
            ]
        );

        return NextResponse.json(application, { status: 201, headers: corsHeaders });
    } catch (error) {
        console.error('Failed to create career application:', error);
        return NextResponse.json(
            { error: 'Failed to create career application' },
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        const result = await db.query(
            'DELETE FROM career_applications WHERE id = ?',
            [id]
        );

        // Optional: check if a row was actually deleted
        // For many DB clients, result[0].affectedRows contains the count
        // Use type assertion to access affectedRows safely
        const affectedRows =
            (result as { affectedRows?: number }).affectedRows ??
            (Array.isArray(result) && result[0] && typeof (result[0] as any).affectedRows === 'number'
                ? (result[0] as any).affectedRows
                : undefined);

        if (!affectedRows) {
            return NextResponse.json(
                { error: 'Application not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        return NextResponse.json(
            { message: 'Application deleted successfully' },
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error('Failed to delete career application:', error);
        return NextResponse.json(
            { error: 'Failed to delete career application' },
            { status: 500, headers: corsHeaders }
        );
    }
}
