import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db'; // Your database query function
import type { Lead } from '@/services/crm'; // Import your Lead type

// --- CORS Helper (optional, if not handled globally) ---
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*'); // Adjust as needed
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}

// Function to convert an array of objects to a CSV string
function convertToCSV(data: Lead[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Define the headers based on your Lead type and desired order
  const headers: (keyof Lead)[] = ['id', 'name', 'email', 'phone', 'projectOfInterest', 'status', 'createdAt'];
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      let value = row[header] === undefined || row[header] === null ? '' : String(row[header]);
      // Escape double quotes by doubling them and wrap value in double quotes
      value = `"${value.replace(/"/g, '""')}"`;
      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    // --- Re-use filtering logic from your main /api/leads GET handler ---
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const searchQuery = searchParams.get('search');
    const sortByDate = searchParams.get('sortDate');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let sql = 'SELECT id, name, email, phone, projectOfInterest, status, createdAt FROM leads';
    const conditions = [];
    const params: any[] = [];

    if (statusFilter && statusFilter !== 'all') {
      conditions.push('status = ?');
      params.push(statusFilter);
    }
    if (searchQuery) {
      conditions.push('(name LIKE ? OR phone LIKE ?)');
      params.push(`%${searchQuery}%`);
      params.push(`%${searchQuery}%`);
    }
    if (startDate) {
      conditions.push('createdAt >= ?');
      params.push(startDate); // Ensure your DB can handle ISO string
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push('createdAt <= ?');
      params.push(endOfDay.toISOString());
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Sorting (optional for export, but good to keep consistent if needed)
    if (sortByDate === 'asc') {
      sql += ' ORDER BY createdAt ASC';
    } else if (sortByDate === 'desc') {
      sql += ' ORDER BY createdAt DESC';
    } else {
      sql += ' ORDER BY createdAt DESC'; // Default sort
    }
    // --- End of re-used filtering logic ---

    const leadsResult = await query(sql, params);

    // Handle different possible return types from the query function
    let leadsData: Lead[] = [];
    if (Array.isArray(leadsResult)) {
      if (Array.isArray(leadsResult[0])) {
        leadsData = leadsResult[0] as Lead[];
      } else if (
        leadsResult.length > 0 &&
        typeof leadsResult[0] === 'object' &&
        'id' in leadsResult[0] &&
        'name' in leadsResult[0]
      ) {
        leadsData = leadsResult as Lead[];
      }
    } else if (
      leadsResult &&
      typeof leadsResult === 'object' &&
      'id' in leadsResult &&
      'name' in leadsResult
    ) {
      leadsData = [leadsResult as unknown as Lead];
    }

    if (leadsData.length === 0) {
      // Return an empty CSV or a message; here, an empty CSV is fine.
      const emptyCsvResponse = new NextResponse('', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="leads_export_empty_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
      return addCorsHeaders(emptyCsvResponse);
    }

    const csvData = convertToCSV(leadsData);
    const filename = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;

    const response = new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
    return addCorsHeaders(response);

  } catch (error) {
    console.error('Failed to export leads:', error);
    const errorResponse = NextResponse.json({ error: 'Failed to export leads' }, { status: 500 });
    return addCorsHeaders(errorResponse);
  }
}