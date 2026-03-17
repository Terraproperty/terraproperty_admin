import { NextResponse, NextRequest } from 'next/server'; // Added NextRequest
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// --- CORS Helper ---
function addCorsHeaders(response: NextResponse) {
  // Adjust the origin and methods as per your security requirements
  response.headers.set('Access-Control-Allow-Origin', '*'); // Or specific origins
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS, DELETE'); // Add methods you use
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Add headers your client might send
  return response;
}

// --- OPTIONS Handler for Preflight Requests ---
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 }); // 204 No Content for OPTIONS
  return addCorsHeaders(response);
}


// Helper function to convert AM/PM time to HH:MM:SS
// This function might still be useful if you handle time input for other purposes
// or if the "investor inquiry" system needs to parse time.
// If it's no longer needed anywhere, you can remove it.
function convertTo24HourFormat(timeStr: string): string | null {
    if (!timeStr) return null;

    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) {
        if (/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(timeStr)) {
            return timeStr.includes(':') && timeStr.split(':').length === 2 ? `${timeStr}:00` : timeStr;
        }
        console.warn(`Invalid time format provided: ${timeStr}. Expected format like "10:00 AM" or "HH:MM:SS".`);
        return null;
    }

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours < 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) { // Midnight case
        hours = 0;
    }

    const SShours = hours.toString().padStart(2, '0');
    const SSminutes = minutes.toString().padStart(2, '0');

    return `${SShours}:${SSminutes}:00`;
}

export async function GET(request: NextRequest) { // Added request type
    try {
        const result: any = await db.query(
            'SELECT id, name, email, phone, investment_range, preferred_date, investment_interests, status, createdAt FROM investor_appointments ORDER BY createdAt DESC'
        );
        const appointments = Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) ? result[0] : 
                             Array.isArray(result) ? result : [];
        
        const response = NextResponse.json(appointments);
        return addCorsHeaders(response);
    } catch (error) {
        console.error('Failed to fetch investor appointments:', error);
        const errorResponse = NextResponse.json(
            { error: 'Failed to fetch investor appointments' },
            { status: 500 }
        );
        return addCorsHeaders(errorResponse);
    }
}

export async function PATCH(request: NextRequest) { // Changed request type to NextRequest
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const { status } = await request.json();

        if (!id || !status) {
            const errorResponse = NextResponse.json(
                { error: 'ID and status are required' },
                { status: 400 }
            );
            return addCorsHeaders(errorResponse);
        }

        await db.query(
            'UPDATE investor_appointments SET status = ? WHERE id = ?',
            [status, id]
        );

        const successResponse = NextResponse.json({ message: 'Status updated successfully' });
        return addCorsHeaders(successResponse);
    } catch (error) {
        console.error('Failed to update investor appointment:', error);
        const errorResponse = NextResponse.json(
            { error: 'Failed to update investor appointment' },
            { status: 500 }
        );
        return addCorsHeaders(errorResponse);
    }
}


export async function POST(request: NextRequest) { // Changed request type to NextRequest
    try {
        const data = await request.json();
        const {
            name,
            email,
            phone,
            investmentRange,
            preferredDate,
            investmentInterests,
            company: receivedCompany,
            preferredTime: receivedPreferredTime
        } = data;

        if (receivedCompany) {
            console.log(`Received 'company' field: "${receivedCompany}". This could signify an investor inquiry.`);
        }
        if (receivedPreferredTime) {
            console.log(`Received 'preferredTime' field: "${receivedPreferredTime}". This could signify an investor inquiry.`);
        }

        if (!name || !email || !preferredDate) {
            const errorResponse = NextResponse.json(
                { error: 'Name, email, and preferred date are required for an appointment.' },
                { status: 400 }
            );
            return addCorsHeaders(errorResponse);
        }

        const appointment = {
            id: uuidv4(),
            name,
            email,
            phone: phone || null,
            investmentRange: investmentRange || null,
            preferredDate,
            investmentInterests: investmentInterests || null,
            status: 'pending',
        };

        await db.query(
            `INSERT INTO investor_appointments (
                id, name, email, phone, investment_range,
                preferred_date, investment_interests, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                appointment.id,
                appointment.name,
                appointment.email,
                appointment.phone,
                appointment.investmentRange,
                appointment.preferredDate,
                appointment.investmentInterests,
                appointment.status
            ]
        );

        const successResponse = NextResponse.json(appointment, { status: 201 });
        return addCorsHeaders(successResponse);
    } catch (error) {
        console.error('Failed to create investor appointment:', error);
        if (error instanceof Error && 'code' in error && (error as any).code === 'ER_NO_DEFAULT_FOR_FIELD' && (error as any).sqlMessage?.includes('createdAt')) {
             console.error("Database schema error: 'createdAt' might be missing a default value (e.g., CURRENT_TIMESTAMP).");
        }
        const errorResponse = NextResponse.json(
            { error: 'Failed to create investor appointment', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
        return addCorsHeaders(errorResponse);
    }
}
