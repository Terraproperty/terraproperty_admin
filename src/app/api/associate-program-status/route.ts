import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        const result = await db.query('SELECT * FROM associate_program_status');
        // If using mysql2 or similar, result[0] contains the rows
        const rows = Array.isArray(result) ? result[0] : result;
        if (!Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ status: 'unknown' });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error('Failed to fetch associate program status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch associate program status' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { status } = await request.json();
        if (!status) {
            return NextResponse.json(
                { error: 'Status is required' },
                { status: 400 }
            );
        }

        const result = await db.query('SELECT * FROM associate_program_status');
        const rows = Array.isArray(result) ? result[0] : result;
        const existing = Array.isArray(rows) && rows.length > 0 ? rows[0] : undefined;
        if (!existing) {
            const id = uuidv4();
            await db.query(
                'INSERT INTO associate_program_status (id, status) VALUES (?, ?)',
                [id, status]
            );
        } else {
            await db.query(
                'UPDATE associate_program_status SET status = ? WHERE id = ?',
                [status, existing.id]
            );
        }

        return NextResponse.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Failed to update associate program status:', error);
        return NextResponse.json(
            { error: 'Failed to update associate program status' },
            { status: 500 }
        );
    }
}
