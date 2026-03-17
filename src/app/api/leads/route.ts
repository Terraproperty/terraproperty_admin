// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// --- CORS Helper ---
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', '*');
  return response;
}

// --- OPTIONS Handler ---
export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}

// Zod schema for request validation (can be extended)
const LeadStatusUpdateSchema = z.object({
  leadId: z.string(),
  status: z.enum(['approved', 'declined']),
});

// GET handler to fetch leads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const searchQuery = searchParams.get('search'); // New: for name or phone
    const sortByDate = searchParams.get('sortDate'); // New: 'asc' or 'desc'
    const startDate = searchParams.get('startDate'); // New: ISO date string
    const endDate = searchParams.get('endDate');   // New: ISO date string

    let sql = 'SELECT id, name, email, phone, projectOfInterest, status, createdAt FROM leads';
    const conditions = [];
    const params: any[] = [];

    if (statusFilter && statusFilter !== 'all') {
      conditions.push('status = ?');
      params.push(statusFilter);
    }

    if (searchQuery) {
      conditions.push('(name LIKE ? OR phone LIKE ?)');
      params.push(`%${searchQuery}%`);
      params.push(`%${searchQuery}%`);
    }

    if (startDate) {
      conditions.push('createdAt >= ?');
      params.push(startDate); // Ensure your DB can handle ISO string or convert
    }
    if (endDate) {
      // Adjust for end of day if needed, e.g., by adding 23:59:59
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push('createdAt <= ?');
      params.push(endOfDay.toISOString());
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    if (sortByDate === 'asc') {
      sql += ' ORDER BY createdAt ASC';
    } else if (sortByDate === 'desc') {
      sql += ' ORDER BY createdAt DESC';
    } else {
      sql += ' ORDER BY createdAt DESC'; // Default sort
    }

    const leadsResult = await query(sql, params);
    
    // Adjust based on your db.query return type
    const leads = Array.isArray(leadsResult) && Array.isArray(leadsResult[0])
      ? leadsResult[0]
      : Array.isArray(leadsResult)
      ? leadsResult
      : [];

    return addCorsHeaders(NextResponse.json(leads));
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 }));
  }
}

// PATCH handler to update lead status
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const body = await request.json();
    const { status } = body;

    console.log(`PATCH request for leadId: ${leadId}, new status: ${status}`); // Log incoming data

    if (!leadId) {
      console.error('PATCH Error: Lead ID is required');
      return addCorsHeaders(NextResponse.json({ error: 'Lead ID is required' }, { status: 400 }));
    }

    const validStatuses = ['pending', 'approved', 'declined', 'closed', 'deal_won', 'deal_loss'];
    if (!status || !validStatuses.includes(status)) {
      console.error(`PATCH Error: Invalid status value - ${status}`);
      return addCorsHeaders(NextResponse.json({ error: 'Invalid status value' }, { status: 400 }));
    }

    if (status === 'deal_won' || status === 'deal_loss') {
      console.log(`Checking current status for leadId: ${leadId} before setting to ${status}`);
      const dbResult: any = await query('SELECT status FROM leads WHERE id = ?', [leadId]);
      
      // Determine what currentLeadRows actually is based on your db library
      // If query returns [rows, fields]:
      const currentLeadRows = Array.isArray(dbResult) && dbResult.length > 0 && Array.isArray(dbResult[0]) ? dbResult[0] : 
                              Array.isArray(dbResult) ? dbResult : []; // Adjust this line based on actual structure of dbResult

      console.log('Database query result (dbResult):', JSON.stringify(dbResult, null, 2));
      console.log('Parsed currentLeadRows:', JSON.stringify(currentLeadRows, null, 2));
      console.log('currentLeadRows length:', currentLeadRows ? currentLeadRows.length : 'undefined/null');
      if (currentLeadRows && currentLeadRows.length > 0) {
        console.log('currentLeadRows[0]:', JSON.stringify(currentLeadRows[0], null, 2));
        if (currentLeadRows[0]) {
            console.log('currentLeadRows[0].status:', currentLeadRows[0].status);
        }
      }


      if (!currentLeadRows || currentLeadRows.length === 0 || !currentLeadRows[0]) {
        console.error(`PATCH Error: Lead not found or data invalid for leadId ${leadId}. currentLeadRows: ${JSON.stringify(currentLeadRows)}`);
        return addCorsHeaders(NextResponse.json({ error: `Lead not found or data is invalid for leadId ${leadId}` }, { status: 400 }));
      }
      
      if (currentLeadRows[0].status !== 'approved') {
        console.error(`PATCH Error: Lead ${leadId} is not 'approved'. Current status: ${currentLeadRows[0].status}`);
        return addCorsHeaders(NextResponse.json({ error: `Lead must be 'approved' to be marked as '${status}'. Current status: '${currentLeadRows[0].status}'` }, { status: 400 }));
      }
      console.log(`Lead ${leadId} is 'approved'. Proceeding with status update to ${status}.`);
    }

    const result: any = await query('UPDATE leads SET status = ? WHERE id = ?', [status, leadId]);
    console.log('Update query result:', JSON.stringify(result, null, 2));

    if (result.affectedRows === 0) {
      console.error(`PATCH Error: Lead ${leadId} not found during update or status not changed.`);
      return addCorsHeaders(NextResponse.json({ error: 'Lead not found or status not changed' }, { status: 404 }));
    }

    console.log(`Lead ${leadId} status updated successfully to ${status}.`);
    return addCorsHeaders(NextResponse.json({ message: 'Lead status updated successfully' }));
  } catch (error) {
    console.error('PATCH - Unexpected error:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to update lead status', details: error instanceof Error ? error.message : String(error) }, { status: 500 }));
  }
}

// POST handler (example: create a new lead - adjust schema as needed)
const CreateLeadSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    projectOfInterest: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = CreateLeadSchema.safeParse(body);

        if (!validation.success) {
            return addCorsHeaders(NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 }));
        }

        const { name, email, phone, projectOfInterest } = validation.data;
        const newLeadId = randomUUID(); // Generate a unique ID

        await query(
            'INSERT INTO leads (id, name, email, phone, projectOfInterest, status) VALUES (?, ?, ?, ?, ?, ?)',
            [newLeadId, name, email, phone || null, projectOfInterest || null, 'pending']
        );

        return addCorsHeaders(NextResponse.json({ message: 'Lead created successfully', id: newLeadId }, { status: 201 }));

    } catch (error: any) {
        console.error('Failed to create lead:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return addCorsHeaders(NextResponse.json({ error: 'Email address already exists' }, { status: 409 }));
        }
        return addCorsHeaders(NextResponse.json({ error: 'Failed to create lead' }, { status: 500 }));
    }
}
