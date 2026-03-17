import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const id = pathname.split('/').pop();

  try {
    const result = await db.query('SELECT * FROM registration_forms WHERE id = ?', [id]);
    const rows =
      Array.isArray(result) && Array.isArray(result[0])
        ? result[0]
        : (typeof result === 'object' && result !== null && 'rows' in result && Array.isArray((result as any).rows)
            ? (result as any).rows
            : result);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Associate program entry not found' }, { status: 404 });
    }

    const entry = rows[0];
    const normalized = {
      ...entry,
      createdAt: entry.createdAt ? new Date(entry.createdAt).toISOString() : null,
    };

    return NextResponse.json(normalized);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch associate program entry' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const id = pathname.split('/').pop();

  try {
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 });
    }

    await db.query(
      'UPDATE registration_forms SET confirmation= ? WHERE id = ?',
      [status, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
