import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function addCorsHeaders(response: Response) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
}

export async function OPTIONS() {
    return addCorsHeaders(new Response(null, { status: 204 }));
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const referralCode = url.searchParams.get('referralCode');

        if (!referralCode) {
            return addCorsHeaders(
                NextResponse.json({ error: 'referralCode query parameter is required' }, { status: 400 })
            );
        }

        // Get list of referred persons
        const personsResult = await db.query(
            `SELECT
                full_name,
                email_address,
                created_at AS join_date,
                CASE WHEN confirmation = '0' OR confirmation = '1' THEN 'Active' 
 ELSE 'Inactive' END AS status
            FROM registration_forms
            WHERE referred_by = ?`,
            [referralCode]
        );
        console.log('personsResult:', JSON.stringify(personsResult));
const personsArr = Array.isArray(personsResult)
    ? personsResult
    : [];
const persons = personsArr;

        // Get summary info
        const summaryResult = await db.query(
            `SELECT
                COUNT(*) AS total_referred,
                SUM(CASE WHEN confirmation = 0 THEN 1 ELSE 0 END) AS active_referred_count
            FROM registration_forms
            WHERE referred_by = ?`,
            [referralCode]
        );
        const summaryArr = Array.isArray(summaryResult) ? summaryResult : [];
        const summary = summaryArr[0] || {};

        return addCorsHeaders(
            NextResponse.json({
                summary,
                persons
            })
        );
    } catch (error) {
        console.error('Failed to fetch referred persons:', error);
        return addCorsHeaders(
            NextResponse.json({ error: 'Failed to fetch referred persons' }, { status: 500 })
        );
    }
}