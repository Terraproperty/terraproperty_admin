import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
 // Adjust path if needed

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyName = searchParams.get('propertyName');

    if (!propertyName) {
      return NextResponse.json(
        { error: 'propertyName query parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const results = await query(
      'SELECT location FROM properties WHERE propertyName = ?',
      [propertyName]
    );

    return NextResponse.json({ locations: results }, { headers: corsHeaders });
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle preflight OPTIONS requests for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}