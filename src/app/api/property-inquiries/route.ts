import { NextRequest,NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
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

// In each handler, wrap your response:
export async function GET() {
  try {
    const inquiries = await db.query(
      'SELECT * FROM property_inquiries ORDER BY createdAt DESC'
    );
    return addCorsHeaders(NextResponse.json(inquiries));
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json({ error: 'Failed to fetch property inquiries' }, { status: 500 })
    );
  }
}

// Do the same for POST and PATCH:
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
        name, 
        email, 
        phone, 
        inquiryType,
        propertyType,
        budgetRange,
        preferredLocation,
        additionalDetails 
    } = data;

    // Validation
    if (!name || !email || !inquiryType) {
        return NextResponse.json(
            { error: 'Name, email, and inquiry type are required' },
            { status: 400 }
        );
    }

    const inquiry = {
        id: uuidv4(),
        name,
        email,
        phone: phone || null,
        inquiryType,
        propertyType: propertyType || null,
        budgetRange: budgetRange || null,
        preferredLocation: preferredLocation || null,
        additionalDetails: additionalDetails || null,
        status: 'new',
    };

    await db.query(
        `INSERT INTO property_inquiries (
            id, name, email, phone, inquiry_type, property_type, 
            budget_range, preferred_location, additional_details, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            inquiry.id, inquiry.name, inquiry.email, inquiry.phone,
            inquiry.inquiryType, inquiry.propertyType, inquiry.budgetRange,
            inquiry.preferredLocation, inquiry.additionalDetails, inquiry.status
        ]
    );

    return addCorsHeaders(NextResponse.json(inquiry, { status: 201 }));
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json({ error: 'Failed to create property inquiry' }, { status: 500 })
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { status } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID and status are required' },
        { status: 400 }
      );
    }

    // Update inquiry status
    await db.query(
      'UPDATE property_inquiries SET status = ? WHERE id = ?',
      [status, id]
    );

    // If status is resolved, create a lead with pending status and projectOfInterest = inquiryType
    if (status === 'resolved') {
      // Get inquiryType for this property inquiry
      const result = await db.query(
        'SELECT inquiry_type, name, email, phone FROM property_inquiries WHERE id = ?',
        [id]
      ) as Array<{ inquiry_type: string; name: string; email: string; phone: string }>;

      const inquiry = Array.isArray(result) && result.length > 0 ? result[0] : null;

      if (inquiry) {
        const { inquiry_type, name, email, phone } = inquiry;

        await db.query(
          `INSERT INTO leads (id, name, email, phone, projectOfInterest, status)
           VALUES (UUID(), ?, ?, ?, ?, 'pending')`,
          [name, email, phone, inquiry_type]
        );
      }
    }

    return addCorsHeaders(NextResponse.json({ message: 'Status updated successfully' }));
  } catch (error) {
    return addCorsHeaders(
      NextResponse.json({ error: 'Failed to update property inquiry' }, { status: 500 })
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

    // Example delete query, adjust table name and library
    const result: any = await db.query('DELETE FROM property_inquiries WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return addCorsHeaders(NextResponse.json({ error: 'Inquiry not found' }, { status: 404 }));
    }

    return addCorsHeaders(NextResponse.json({ message: 'Inquiry deleted successfully' }, { status: 200 }));
  } catch (error) {
    console.error('Failed to delete property inquiry:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to delete inquiry' }, { status: 500 }));
  }
}