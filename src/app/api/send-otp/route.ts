import { NextResponse } from 'next/server';

const API_KEY = 'wj7nVYhtbsB0iUrCu64cHXvWIkdaToFR2fepZJ5qxyPAEMQmLzjWuqIT0Fgdx8ob52JyOKBfGn6mlvk7';
const API_URL = 'https://www.fast2sms.com/dev/bulkV2';

// CORS headers configuration
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
};

// Helper function to add CORS headers to response
const addCorsHeaders = (response: NextResponse) => {
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
};

// Generate 6 digit OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// OPTIONS handler for preflight requests
export async function OPTIONS() {
    const response = new NextResponse(null, { status: 200 });
    return addCorsHeaders(response);
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const mobile = data.mobile;
        const name = data.name;
        const inquiry_type = data.inquiry_type;

        if (!mobile || !name || !inquiry_type) {
            const response = NextResponse.json({
                success: false,
                error: 'Missing required fields: mobile, name, inquiry_type.'
            }, { status: 400 });
            return addCorsHeaders(response);
        }

        // Generate OTP
        const otp = generateOTP();

        // Prepare Fast2SMS JSON body
        const body = {
            route: 'dlt',
            sender_id: 'TERPRO',
            message: '186483',
            variables_values: `${name}|${inquiry_type}|${otp}|`,
            schedule_time: '',
            flash: 0,
            numbers: mobile
        };

        // Log the request body for debugging
        console.log('Fast2SMS request body:', body);

        // Send OTP via Fast2SMS
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
                message: 'OTP sent successfully',
                request_id: smsResult.request_id,
                otp: otp
            });
            return addCorsHeaders(response);
        } else {
            const response = NextResponse.json({
                success: false,
                error: smsResult.message || 'Failed to send OTP',
                details: smsResult
            }, { status: 400 });
            return addCorsHeaders(response);
        }
    } catch (error) {
        console.error('Failed to send OTP:', error);
        const response = NextResponse.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
        return addCorsHeaders(response);
    }
}
