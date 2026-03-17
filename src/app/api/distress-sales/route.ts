import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

// CORS headers configuration
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper function to add CORS headers to response
const addCorsHeaders = (response: NextResponse) => {
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
};

interface DistressSale extends RowDataPacket {
    id: string;
    heading: string;
    description: string;
    images: string;
    property_name: string;
    location: string;
    market_price: number;
    distress_price: number;
    expiry_date: string;
    status: 'live' | 'sold' | 'expired';
    created_at: string;
    updated_at: string;
}

// OPTIONS handler for preflight requests
export async function OPTIONS() {
    return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function GET() {
    try {
        const sales = await db.query(
            `SELECT * FROM distress_sales 
             WHERE status = 'live' AND expiry_date > CURRENT_TIMESTAMP
             ORDER BY created_at DESC`
        );
        
        // Parse JSON images array for each sale
        const salesWithParsedImages = (sales as DistressSale[]).map(sale => {
            let images: string[] = [];
            if (Array.isArray(sale.images)) {
                images = sale.images;
            } else if (typeof sale.images === 'string') {
                try {
                    // Try parsing as JSON array
                    images = JSON.parse(sale.images);
                    if (!Array.isArray(images)) {
                        // If it's a single string (not an array), wrap in array
                        images = [sale.images];
                    }
                } catch {
                    // If not JSON, treat as single image path
                    images = [sale.images];
                }
            }
            return {
                ...sale,
                images
            };
        });

        const response = NextResponse.json(salesWithParsedImages);
        return addCorsHeaders(response);
    } catch (error) {
        console.error('Failed to fetch distress sales:', error);
        const response = NextResponse.json(
            { error: 'Failed to fetch distress sales' },
            { status: 500 }
        );
        return addCorsHeaders(response);
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { 
            heading,
            images,
            location,
            marketPrice,
            distressPrice,
            expiryDate,
            rareDealPoints
        } = data;

        // Validation
        if (!heading || !location || !marketPrice || !distressPrice || !expiryDate || !rareDealPoints || !Array.isArray(rareDealPoints) || rareDealPoints.length === 0) {
            const response = NextResponse.json(
                { error: 'All fields are required, including at least one rare deal point.' },
                { status: 400 }
            );
            return addCorsHeaders(response);
        }

        if (heading.length > 100) {
            const response = NextResponse.json(
                { error: 'Heading must be 100 characters or less' },
                { status: 400 }
            );
            return addCorsHeaders(response);
        }

        if (marketPrice <= distressPrice) {
            const response = NextResponse.json(
                { error: 'Market price must be greater than distress price' },
                { status: 400 }
            );
            return addCorsHeaders(response);
        }

        if (rareDealPoints.length > 4) {
            const response = NextResponse.json(
                { error: 'Maximum 4 rare deal points allowed.' },
                { status: 400 }
            );
            return addCorsHeaders(response);
        }

        const sale = {
            id: uuidv4(),
            heading,
            images: JSON.stringify(images || []),
            rare_deal_points: JSON.stringify(rareDealPoints),
            location,
            market_price: marketPrice,
            distress_price: distressPrice,
            expiry_date: expiryDate,
            status: 'live' as const
        };

        await db.query(
            `INSERT INTO distress_sales (
                id, heading, images, rare_deal_points,
                location, market_price, distress_price, expiry_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sale.id, sale.heading, sale.images, sale.rare_deal_points,
                sale.location, sale.market_price,
                sale.distress_price, sale.expiry_date, sale.status
            ]
        );

        const response = NextResponse.json(sale, { status: 201 });
        return addCorsHeaders(response);
    } catch (error) {
        console.error('Failed to create distress sale:', error);
        const response = NextResponse.json(
            { error: 'Failed to create distress sale' },
            { status: 500 }
        );
        return addCorsHeaders(response);
    }
}

export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const { status } = await request.json();

        if (!id || !status || !['live', 'sold', 'expired'].includes(status)) {
            const response = NextResponse.json(
                { error: 'Valid ID and status (live/sold/expired) are required' },
                { status: 400 }
            );
            return addCorsHeaders(response);
        }

        await db.query(
            'UPDATE distress_sales SET status = ? WHERE id = ?',
            [status, id]
        );

        const response = NextResponse.json({ message: 'Status updated successfully' });
        return addCorsHeaders(response);
    } catch (error) {
        console.error('Failed to update distress sale:', error);
        const response = NextResponse.json(
            { error: 'Failed to update distress sale' },
            { status: 500 }
        );
        return addCorsHeaders(response);
    }
}
