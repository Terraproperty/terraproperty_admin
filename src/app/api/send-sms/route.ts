import { NextRequest, NextResponse } from 'next/server';

const API_KEY = 'wj7nVYhtbsB0iUrCu64cHXvWIkdaToFR2fepZJ5qxyPAEMQmLzjWuqIT0Fgdx8ob52JyOKBfGn6mlvk7';
const API_URL = 'https://www.fast2sms.com/dev/bulkV2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
};

const addCorsHeaders = (response: NextResponse) => {
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
};

export async function OPTIONS() {
    const response = new NextResponse(null, { status: 200 });
    return addCorsHeaders(response);
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { mobile_number, full_name, user_id, password } = data;

        if (!mobile_number || !full_name || !user_id || !password) {
            const response = NextResponse.json({
                success: false,
                error: 'Missing required fields: mobile_number, full_name, user_id, password.'
            }, { status: 400 });
            return addCorsHeaders(response);
        }

        // Prepare Fast2SMS JSON body
        const body = {
            route: 'dlt',
            sender_id: 'TERPRO',
            message: '186982',
            variables_values: `${full_name}|${user_id}|${password}|`,
            schedule_time: '',
            flash: 0,
            numbers: mobile_number
        };

        // Log the request body for debugging
        console.log('Fast2SMS request body:', body);

        // Send SMS via Fast2SMS
        const smsResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'authorization': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const smsResult = await smsResponse.json();
        console.log('SMS API response:', smsResult);

        if (smsResult.return === true) {
            const response = NextResponse.json({
                success: true,
                message: 'SMS sent successfully',
                request_id: smsResult.request_id
            });
            return addCorsHeaders(response);
        } else {
            const response = NextResponse.json({
                success: false,
                error: smsResult.message || 'Failed to send SMS',
                details: smsResult
            }, { status: 400 });
            return addCorsHeaders(response);
        }
    } catch (error) {
        console.error('Failed to send SMS:', error);
        const response = NextResponse.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
        return addCorsHeaders(response);
    }
}
