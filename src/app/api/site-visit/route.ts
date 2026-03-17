import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

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

// Zod schemas for validation
const SiteVisitCreateSchema = z.object({
  leadId: z.string(),
  visitDate: z.string(), // ISO date string
  notes: z.string().optional(),
});

const SiteVisitStatusUpdateSchema = z.object({
  id: z.number(),
  status: z.enum(['scheduled', 'confirmed', 'cancelled']),
});

// POST handler to create a site visit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = SiteVisitCreateSchema.safeParse(body);

    if (!validation.success) {
      return addCorsHeaders(NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 }));
    }

    const { leadId, visitDate, notes } = validation.data;

    const result: any = await query(
      'INSERT INTO site_visits (lead_id, visit_date, status, notes) VALUES (?, ?, ?, ?)',
      [leadId, visitDate, 'scheduled', notes || null]
    );

    return addCorsHeaders(NextResponse.json({ message: 'Site visit scheduled successfully', id: result.insertId }, { status: 201 }));
  } catch (error) {
    console.error('Failed to create site visit:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to create site visit' }, { status: 500 }));
  }
}

// GET handler to list site visits, optionally filtered by leadId or status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const status = searchParams.get('status');

    let sql = 'SELECT id, lead_id, visit_date, status, notes, created_at FROM site_visits';
    const params: any[] = [];

    const conditions: string[] = [];
    if (leadId) {
      conditions.push('lead_id = ?');
      params.push(leadId);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY visit_date DESC';

    const siteVisits = await query(sql, params);

    return addCorsHeaders(NextResponse.json(siteVisits));
  } catch (error) {
    console.error('Failed to fetch site visits:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch site visits' }, { status: 500 }));
  }
}

// PATCH handler to update site visit status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = SiteVisitStatusUpdateSchema.safeParse(body);

    if (!validation.success) {
      return addCorsHeaders(NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 }));
    }

    const { id, status } = validation.data;

    const result: any = await query(
      'UPDATE site_visits SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return addCorsHeaders(NextResponse.json({ error: 'Site visit not found or status already updated' }, { status: 404 }));
    }

    return addCorsHeaders(NextResponse.json({ message: `Site visit ${id} status updated to ${status}` }));
  } catch (error) {
    console.error('Failed to update site visit status:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to update site visit status' }, { status: 500 }));
  }
}
