import { NextResponse, NextRequest } from 'next/server'; // Import NextRequest
import { db } from '@/lib/db';

function addCorsHeaders(response: NextResponse) { // Changed type to NextResponse
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Added Authorization as common header
  return response;
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}


export async function GET(request: NextRequest) { // Changed type to NextRequest
  try {
    const url = new URL(request.url);
    const associate_id = url.searchParams.get('associate_id');
    const status = url.searchParams.get('status');
    const lead_type_filter = url.searchParams.get('lead_type'); // New: filter by lead_type

    let sqlQuery = `
      SELECT 
        al.*, 
        ap.full_name AS referred_by_name
      FROM 
        associate_leads al
      LEFT JOIN 
        registration_forms ap 
        ON al.referred_by = ap.associate_id
    `;
    const queryParams: any[] = []; // Explicitly type queryParams
    const conditions = [];

    if (associate_id) {
      conditions.push('al.referred_by = ?');
      queryParams.push(associate_id);
    }

    if (status) {
      conditions.push('al.status = ?');
      queryParams.push(status);
    }

    if (lead_type_filter) { // Add lead_type to conditions
      conditions.push('al.lead_type = ?');
      queryParams.push(lead_type_filter);
    }

    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ');
    }

    sqlQuery += ' ORDER BY al.created_at DESC';

    const leadsResult = await db.query(sqlQuery, queryParams);
    
    console.log(`Fetched associate leads. associate_id: "${associate_id}", status: "${status}", lead_type: "${lead_type_filter}". Query: ${sqlQuery.trim()}, Params: ${JSON.stringify(queryParams)}`);

    const rows = Array.isArray(leadsResult) && Array.isArray(leadsResult[0]) 
                 ? leadsResult[0] 
                 : Array.isArray(leadsResult) 
                 ? leadsResult 
                 : [];
    
    return addCorsHeaders(NextResponse.json(rows));
  } catch (error) {
    console.error('Failed to fetch associate leads:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return addCorsHeaders(
      NextResponse.json({ error: 'Failed to fetch associate leads', details: errorMessage }, { status: 500 })
    );
  }
}

export async function POST(request: NextRequest) { // Changed type to NextRequest
  try {
    const data = await request.json();
    const {
      full_name,
      email_address,
      phone_number,
      property_type,
      preferred_location,
      budget_range, // This will be checked
      additional_notes,
      per_deal_commission,
      total_commission,
      pending_commission,
      status,
      referred_by,
      lead_type, 
    } = data;

    // Basic validation for required fields
    if (!full_name || !email_address || !phone_number || !lead_type) {
        return addCorsHeaders(
            NextResponse.json({ error: 'Full name, email, phone number, and lead type are required.' }, { status: 400 })
        );
    }

    // Check for duplicate by email or phone
    const duplicatesResult: any = await db.query( // Added type any for duplicatesResult
      `SELECT id FROM associate_leads WHERE email_address = ? OR phone_number = ? LIMIT 1`,
      [email_address, phone_number]
    );
    
    // Adjust this depending on your db.query return type
    // Assuming duplicatesResult[0] is the array of rows if successful
    const duplicates = Array.isArray(duplicatesResult) && Array.isArray(duplicatesResult[0]) 
                       ? duplicatesResult[0] 
                       : Array.isArray(duplicatesResult)
                       ? duplicatesResult
                       : [];


    if (duplicates.length > 0) {
      return addCorsHeaders(
        NextResponse.json(
          {
            error:
              'This is a duplicate entry based on email or phone number. If this happens again, please contact support@terraproperty.in',
          },
          { status: 409 } // 409 Conflict
        )
      );
    }

    const result: any = await db.query( // Added type any for result
      `INSERT INTO associate_leads 
      (full_name, email_address, phone_number, property_type, preferred_location, budget_range, additional_notes, per_deal_commission, total_commission, pending_commission, status, referred_by, lead_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // Added placeholder for lead_type
      [
        full_name,
        email_address,
        phone_number,
        property_type || null,
        preferred_location || null,
        budget_range !== undefined && budget_range !== null && budget_range !== '' ? budget_range : 0, // Default budget_range to 0 if not provided or empty
        additional_notes || null,
        per_deal_commission || 0,
        total_commission || 0,
        pending_commission || 0,
        status || 'new',
        referred_by || null,
        lead_type || 'BUYING', 
      ]
    );

    // Standard way to get insertId from mysql2 result
    const insertId = result && result.insertId ? result.insertId : null;


    return addCorsHeaders(
      NextResponse.json({
        message: 'Associate lead created successfully',
        id: insertId,
        lead_type: lead_type || 'BUYING' // Return the lead_type used
      })
    );
  } catch (error) {
    console.error('Failed to create associate lead:', error); // Log the actual error
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Failed to create associate lead', details: errorMessage },
        { status: 500 }
      )
    );
  }
}

export async function PATCH(request: NextRequest) { // Changed type to NextRequest
  try {
    const data = await request.json();
    const { id, budget_range, status, referred_by, lead_type } = data; // New: capture lead_type for update

    if (!id) {
      return addCorsHeaders(
        NextResponse.json({ error: 'ID is required for update' }, { status: 400 })
      );
    }

    const fieldsToUpdate = [];
    const values = [];

    if (budget_range !== undefined) {
      fieldsToUpdate.push('budget_range = ?');
      values.push(budget_range);
    }

    if (status !== undefined) {
      fieldsToUpdate.push('status = ?');
      values.push(status);
    }

    if (referred_by !== undefined) {
      fieldsToUpdate.push('referred_by = ?');
      values.push(referred_by);
    }
    
    if (lead_type !== undefined) { // New: add lead_type to update
      fieldsToUpdate.push('lead_type = ?');
      values.push(lead_type);
    }


    if (fieldsToUpdate.length === 0) {
      return addCorsHeaders(
        NextResponse.json({ error: 'No fields to update' }, { status: 400 })
      );
    }

    values.push(id); // Add id as the last parameter for WHERE clause

    const sql = `UPDATE associate_leads SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

    await db.query(sql, values);

    return addCorsHeaders(
      NextResponse.json({ message: 'Associate lead updated successfully' })
    );
  } catch (error) {
    console.error('Failed to update associate lead:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return addCorsHeaders(
      NextResponse.json({ error: 'Failed to update associate lead', details: errorMessage }, { status: 500 })
    );
  }
}
