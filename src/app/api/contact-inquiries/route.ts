import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH,DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function addCorsHeaders(response: NextResponse) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
}

// Add this OPTIONS handler for preflight requests
export async function OPTIONS() {
    return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function GET() {
    try {
        const inquiries = await db.query(
            'SELECT * FROM contact_inquiries ORDER BY createdAt DESC'
        );
        return addCorsHeaders(NextResponse.json(inquiries));
    } catch (error) {
        console.error('Failed to fetch contact inquiries:', error);
        return addCorsHeaders(
            NextResponse.json(
                { error: 'Failed to fetch contact inquiries' },
                { status: 500 }
            )
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const { status, projectOfInterest } = await request.json();

        if (!id || !status) {
            return addCorsHeaders(
                NextResponse.json(
                    { error: 'ID and status are required' },
                    { status: 400 }
                )
            );
        }
console.log('Updating contact inquiry with ID:', id, 'to status:', status);
        // Update inquiry status
        await db.query(
            'UPDATE contact_inquiries SET status = ? WHERE id = ?',
            [status, id]
        );

        // If status is resolved, create a lead with pending status
       

            // Insert lead with pending status
            await db.query(
                `INSERT INTO leads (id, name, email, phone, projectOfInterest, status)
                 SELECT id, name, email, phone, message, 'pending' FROM contact_inquiries WHERE id = ?`,
                [id]
            );
        

        return addCorsHeaders(
            NextResponse.json({ message: 'Status updated successfully' })
        );
    } catch (error) {
        console.error('Failed to update contact inquiry:', error);
        return addCorsHeaders(
            NextResponse.json(
                { error: 'Failed to update contact inquiry' },
                { status: 500 }
            )
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { name, email, phone, message } = data;

        // Validation
        if (!name || !email || !message) {
            return addCorsHeaders(
                NextResponse.json(
                    { error: 'Name, email, and message are required' },
                    { status: 400 }
                )
            );
        }

        const inquiry = {
            id: uuidv4(),
            name,
            email,
            phone: phone || null,
            message,
            status: 'new',
        };

        await db.query(
            `INSERT INTO contact_inquiries (id, name, email, phone, message, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                inquiry.id,
                inquiry.name,
                inquiry.email,
                inquiry.phone,
                inquiry.message,
                inquiry.status,
            ]
        );

        return addCorsHeaders(
            NextResponse.json(inquiry, { status: 201 })
        );
    } catch (error) {
        console.error('Failed to create contact inquiry:', error);
        return addCorsHeaders(
            NextResponse.json(
                { error: 'Failed to create contact inquiry' },
                { status: 500 }
            )
        );
    }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return addCorsHeaders(NextResponse.json({ error: 'Inquiry ID is required' }, { status: 400 }));
    }

    // Example delete query, adjust to your DB schema and library
    const result: any = await db.query('DELETE FROM contact_inquiries WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return addCorsHeaders(NextResponse.json({ error: 'Inquiry not found' }, { status: 404 }));
    }

    return addCorsHeaders(NextResponse.json({ message: 'Inquiry deleted successfully' }, { status: 200 }));
  } catch (error) {
    console.error('Failed to delete contact inquiry:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to delete inquiry' }, { status: 500 }));
  }
}
