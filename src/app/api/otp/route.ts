import { NextResponse } from 'next/server';

const API_URL = 'https://www.fast2sms.com/dev/bulkV2';
const API_KEY = 'wj7nVYhtbsB0iUrCu64cHXvWIkdaToFR2fepZJ5qxyPAEMQmLzjWuqIT0Fgdx8ob52JyOKBfGn6mlvk7';

// Simple OTP generator
function generateOTP(length = 6): string {
  return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
}

// CORS headers helper
function addCorsHeaders(response: Response): Response {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle GET request
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get('mobile');
    const name = searchParams.get('name');
    const inquiry_type = searchParams.get('inquiry_type');

    if (!mobile || !name || !inquiry_type) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Missing required fields: mobile, name, inquiry_type.' }, { status: 400 })
      );
    }

    const otp = generateOTP();
    const variables_values = `${name}|${inquiry_type}|${otp}|`;

    // Construct URL with query params
    const url = `${API_URL}?authorization=${API_KEY}` +
      `&route=dlt&sender_id=TERPRO&message=186483` +
      `&variables_values=${encodeURIComponent(variables_values)}` +
      `&flash=0&numbers=${encodeURIComponent(mobile)}&schedule_time=`;

    const apiRes = await fetch(url, { method: 'GET' });
    const data = await apiRes.json();
console.log('API Response:', url, data);
    // Send response as it is
    return addCorsHeaders(
      NextResponse.json(data)
    );
  } catch (err) {
    return addCorsHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    );
  }
}

// Handle preflight CORS request
export async function OPTIONS() {
  return addCorsHeaders(new Response(null, { status: 204 }));
}