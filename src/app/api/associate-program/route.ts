import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const result = await db.query('SELECT * FROM registration_forms');
    // Normalize rows for both pg and mysql2
    const rows =
      Array.isArray(result) && Array.isArray(result[0])
        ? result[0]
        : (typeof result === 'object' && result !== null && 'rows' in result && Array.isArray((result as any).rows)
            ? (result as any).rows
            : result);

    // Ensure createdAt is a valid ISO string
    const normalized = rows.map((row: any) => ({
      ...row,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch associate program entries' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const result = await db.query(
      'UPDATE registration_forms SET confirmation= $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    // If result is an array (e.g., mysql2), use result[0][0]; if using pg, use result.rows[0]
    const updated =
      Array.isArray(result) && Array.isArray(result[0])
        ? result[0][0]
        : (typeof result === 'object' && result !== null && 'rows' in result && Array.isArray((result as any).rows)
            ? (result as any).rows[0]
            : result);

    // If status is '0' (approved), send SMS notification
    // if (status === '0') {
    //   try {
    //     const phoneNumber = updated.mobile_number || updated.phone_number || null;
    //     if (phoneNumber) {
    //       await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/send-sms`, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({
    //           phoneNumber,
    //           message: `Hello ${updated.full_name || ''}, your associate program application has been approved.`,
    //         }),
    //       });
    //     }
    //   } catch (smsError) {
    //     console.error('Failed to send SMS notification:', smsError);
    //   }
    // }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
