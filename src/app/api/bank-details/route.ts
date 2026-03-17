import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

function addCorsHeaders(response: Response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

export async function OPTIONS() {
  return addCorsHeaders(new Response(null, { status: 204 }));
}

// POST: Save new bank details
export async function POST(request: Request) {
  try {
    const {
      associate_id,
      account_holder_name,
      ifsc,
      bank_account_number,
      account_type,
      bank_name,
      upi,
    } = await request.json();

    if (
      !associate_id ||
      !account_holder_name ||
      !ifsc ||
      !bank_account_number ||
      !account_type ||
      !bank_name
    ) {
      return addCorsHeaders(
        NextResponse.json({ error: 'All fields except upi are required' }, { status: 400 })
      );
    }

    const id = uuidv4();
    await db.query(
      `INSERT INTO bank_details 
      (id, associate_id, account_holder_name, ifsc, bank_account_number, account_type, bank_name, upi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        associate_id,
        account_holder_name,
        ifsc,
        bank_account_number,
        account_type,
        bank_name,
        upi || null,
      ]
    );

    return addCorsHeaders(
      NextResponse.json({ message: 'Bank details saved successfully', id })
    );
  } catch (error) {
    console.error('Failed to save bank details:', error);
    return addCorsHeaders(
      NextResponse.json({ error: 'Failed to save bank details' }, { status: 500 })
    );
  }
}

// PATCH: Update bank details by associate_id
export async function PATCH(request: Request) {
  try {
    const {
      associate_id,
      account_holder_name,
      ifsc,
      bank_account_number,
      account_type,
      bank_name,
      upi,
    } = await request.json();

    if (!associate_id) {
      return addCorsHeaders(
        NextResponse.json({ error: 'associate_id is required' }, { status: 400 })
      );
    }

    const fields = [];
    const values = [];

    if (account_holder_name !== undefined) {
      fields.push('account_holder_name = ?');
      values.push(account_holder_name);
    }
    if (ifsc !== undefined) {
      fields.push('ifsc = ?');
      values.push(ifsc);
    }
    if (bank_account_number !== undefined) {
      fields.push('bank_account_number = ?');
      values.push(bank_account_number);
    }
    if (account_type !== undefined) {
      fields.push('account_type = ?');
      values.push(account_type);
    }
    if (bank_name !== undefined) {
      fields.push('bank_name = ?');
      values.push(bank_name);
    }
    if (upi !== undefined) {
      fields.push('upi = ?');
      values.push(upi);
    }

    if (fields.length === 0) {
      return addCorsHeaders(
        NextResponse.json({ error: 'No fields to update' }, { status: 400 })
      );
    }

    values.push(associate_id);

    await db.query(
      `UPDATE bank_details SET ${fields.join(', ')} WHERE associate_id = ?`,
      values
    );

    return addCorsHeaders(
      NextResponse.json({ message: 'Bank details updated successfully' })
    );
  } catch (error) {
    console.error('Failed to update bank details:', error);
    return addCorsHeaders(
      NextResponse.json({ error: 'Failed to update bank details' }, { status: 500 })
    );
  }
}

// GET: Get bank details by associate_id
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const associate_id = url.searchParams.get('associate_id');

    if (!associate_id) {
      return addCorsHeaders(
        NextResponse.json({ error: 'associate_id query parameter is required' }, { status: 400 })
      );
    }

    const result = await db.query(
      `SELECT * FROM bank_details WHERE associate_id = ? LIMIT 1`,
      [associate_id]
    );

    // Debug log
    console.log('Bank details query result:', JSON.stringify(result));

    // Use result directly as array of rows
    const rows = Array.isArray(result) ? result : [];
    if (rows.length === 0) {
      return addCorsHeaders(
        NextResponse.json({ error: 'No bank details found' }, { status: 404 })
      );
    }

    return addCorsHeaders(NextResponse.json(rows[0]));
  } catch (error) {
    console.error('Failed to fetch bank details:', error);
    return addCorsHeaders(
      NextResponse.json({ error: 'Failed to fetch bank details' }, { status: 500 })
    );
  }
}