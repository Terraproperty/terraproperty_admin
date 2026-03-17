import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to add CORS headers
function addCorsHeaders(response: Response) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
}

export async function OPTIONS() {
    return addCorsHeaders(new Response(null, { status: 204 }));
}

export async function POST(request: Request) {
    try {
        const { userId, password } = await request.json();

        if (!userId || !password) {
            return addCorsHeaders(
                NextResponse.json(
                    { error: 'userId and password are required' },
                    { status: 400 }
                )
            );
        }

        const result = await db.query(
            'SELECT * FROM registration_forms WHERE user_id = ? AND password = ?',
            [userId, password]
        );
        console.log('DB query executed:', db.query.toString());
        console.log('DB query result:', userId, password, result);

        const user =
            Array.isArray(result) && Array.isArray(result[0])
                ? result[0][0]
                : (typeof result === 'object' && result !== null && 'rows' in result && Array.isArray((result as any).rows)
                    ? (result as any).rows[0]
                    : result);

        const userObj = Array.isArray(user) ? user[0] : user;

        if (!userObj) {
            return addCorsHeaders(
                NextResponse.json(
                    { error: 'Invalid credentials' },
                    { status: 401 }
                )
            );
        }
        console.log('user object:', userObj);
        console.log('user.confirmation value:', userObj.confirmation, typeof userObj.confirmation);

        // Check if the account is active (confirmation is '0' or '1')
        const confirmationValue = String(userObj.confirmation);
        if (confirmationValue !== '0' && confirmationValue !== '1') {
            return addCorsHeaders(
                NextResponse.json(
                    { error: 'Your account is temporarily disabled. Please contact support@terraproperty.in' },
                    { status: 403 }
                )
            );
        }

        delete userObj.password;

        return addCorsHeaders(
            NextResponse.json({ success: true, user: userObj })
        );
    } catch (error) {
        console.error('Login error:', error);
        return addCorsHeaders(
            NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            )
        );
    }
}