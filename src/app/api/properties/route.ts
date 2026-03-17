// src/app/api/properties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Zod schema for creating/updating a property
const PropertySchema = z.object({
    propertyName: z.string().min(3),
    address: z.string().min(10),
    price: z.string().min(1), // Accept price as string
    description: z.string().min(10).max(5000),
    contactNumber: z.string().regex(/^[+]?\d{10,15}$/),
    email: z.string().email(),
    propertyType: z.string().min(1),
    propertyCategory: z.string().min(1),
    projectName: z.string().min(1),
    location: z.string().min(1),
    city: z.string().min(1).optional(),
    brochure: z.string().optional(),
    coordinates: z.object({
        lat: z.number().optional(),
        lng: z.number().optional(),
    }).optional(),
    details: z.string().min(10),
    features: z.array(z.string()).min(1),
    idealFor: z.array(z.string()).min(1),
    additionalServices: z.array(z.string()).optional(),
    status: z.enum(['pending', 'approved', 'declined', 'Sold', 'sold', 'Ready to Move', 'Empty Plot','Under Construction','Completion Plots']).optional().default('pending'),
    images: z.array(z.string()).optional(),
    isReraApproved: z.boolean().optional(), // <-- Add this line
});

// Zod schema for updating property status
const PropertyStatusUpdateSchema = z.object({
    status: z.enum(['pending', 'approved', 'declined', 'Sold', 'Completion Plots']),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// GET handler to fetch properties
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get('status');
        const propertyId = searchParams.get('id');
        const projectName = searchParams.get('projectName'); // <-- Add this

        if (propertyId) {
            // Fetch full property details by id
            const property = await query('SELECT * FROM properties WHERE id = ?', [propertyId]) as any[];
            if (!property || property.length === 0) {
                return NextResponse.json({ error: 'Property not found' }, { status: 404 });
            }
            // Parse JSON fields before returning
            const prop = property[0];
            try {
                prop.features = JSON.parse(prop.features || '[]');
            } catch {}
            try {
                prop.idealFor = JSON.parse(prop.idealFor || '[]');
            } catch {}
            try {
                prop.additionalServices = JSON.parse(prop.additionalServices || '[]');
            } catch {}
            try {
                prop.images = JSON.parse(prop.images || '[]');
            } catch {}
            try {
                prop.isReraApproved = prop.isReraApproved === null ? null : Boolean(prop.isReraApproved);
            } catch {}
            return NextResponse.json(prop, { headers: corsHeaders });
        }

        let sql = 'SELECT * FROM properties';
        const params = [];
        const whereClauses = [];

        if (statusFilter && statusFilter !== 'all') {
            if (['pending', 'approved', 'declined', 'Sold'].includes(statusFilter)) {
                whereClauses.push('status = ?');
                params.push(statusFilter);
            }
        }

        // Add this logic for projectName
        if (projectName) {
            if (projectName === 'not-authority') {
                whereClauses.push('projectName != ?');
                params.push('Authority');
            } else {
                whereClauses.push('projectName = ?');
                params.push(projectName);
            }
        }

        if (whereClauses.length > 0) {
            sql += ' WHERE ' + whereClauses.join(' AND ');
        }

        sql += ' ORDER BY createdAt DESC';

        const properties = await query(sql, params);
        return NextResponse.json(properties, { headers: corsHeaders });
    } catch (error) {
        console.error('Failed to fetch properties:', error);
        return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500, headers: corsHeaders });
    }
}

// POST handler to create a new property listing
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('Received property data:', body); // <-- Log incoming data
        const validation = PropertySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 });
        }

        const {
          propertyName, address, price, description, contactNumber, email, status,
          propertyType, propertyCategory, projectName, location, coordinates, details,
          features, idealFor, additionalServices, images,
          city = null, brochure = null, // <-- default to null if missing
          isReraApproved = null, // <-- Add this
        } = validation.data;
        const newPropertyId = randomUUID();

        await query(
          `INSERT INTO properties (
            id, propertyName, address, price, description, contactNumber, email, status, city, brochure,
            propertyType, propertyCategory, projectName, location,
            coordinates_lat, coordinates_lng, details, features, idealFor, additionalServices, images,
            isReraApproved -- <-- Add this
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

          [
            newPropertyId, propertyName, address, price, description, contactNumber, email, status, city, brochure,
            propertyType, propertyCategory, projectName, location,
            coordinates?.lat ?? null, coordinates?.lng ?? null, details,
            JSON.stringify(features), JSON.stringify(idealFor), JSON.stringify(additionalServices ?? []), JSON.stringify(images ?? []),
            isReraApproved // <-- Add this
          ]
        );

         const newProperty = await query('SELECT * FROM properties WHERE id = ?', [newPropertyId]) as any[];


        return NextResponse.json({ message: 'Property listed successfully', property: newProperty[0] }, { status: 201, headers: corsHeaders });

    } catch (error) {
        console.error('Failed to list property:', error);
        return NextResponse.json({ error: 'Failed to list property' }, { status: 500, headers: corsHeaders });
    }
}

// PATCH handler to update property (all fields)
export async function PATCH(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get('id');

        if (!propertyId) {
            return NextResponse.json({ error: 'Property ID is required in query parameters' }, { status: 400 });
        }

        const body = await request.json();

        // --- Handle exclusive update directly ---
        if (typeof body.exclusive === 'boolean') {
            await query('UPDATE properties SET exclusive = ? WHERE id = ?', [body.exclusive, propertyId]);
            const updatedProperty = await query('SELECT * FROM properties WHERE id = ?', [propertyId]) as any[];
            return NextResponse.json({ message: `Property ${propertyId} updated`, property: updatedProperty[0] }, { headers: corsHeaders });
        }
        // --- End exclusive update ---

        // Validate input for full update
        const validation = PropertySchema.partial().safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid input for property update', details: validation.error.errors }, { status: 400 });
        }

        const fields = validation.data;
        const updates = [];
        const params = [];

        for (const key of Object.keys(fields) as Array<keyof typeof fields>) {
            if (fields[key] !== undefined) {
                if (['features', 'idealFor', 'additionalServices', 'images'].includes(key as string)) {
                    updates.push(`${key} = ?`);
                    params.push(JSON.stringify(fields[key]));
                } else if (key === 'coordinates') {
                    updates.push('coordinates_lat = ?', 'coordinates_lng = ?');
                    params.push((fields[key] as any)?.lat ?? null, (fields[key] as any)?.lng ?? null);
                } else if (key === 'isReraApproved') {
                    updates.push('isReraApproved = ?');
                    params.push(fields[key]);
                } else {
                    updates.push(`${key} = ?`);
                    params.push(fields[key]);
                }
            }
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        params.push(propertyId);

        const sql = `UPDATE properties SET ${updates.join(', ')} WHERE id = ?`;
        const result: any = await query(sql, params);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Property not found or nothing changed' }, { status: 404 });
        }

        const updatedProperty = await query('SELECT * FROM properties WHERE id = ?', [propertyId]) as any[];

        return NextResponse.json({ message: `Property ${propertyId} updated`, property: updatedProperty[0] }, { headers: corsHeaders });
    } catch (error) {
        console.error('Failed to update property:', error);
        return NextResponse.json({ error: 'Failed to update property' }, { status: 500, headers: corsHeaders });
    }
}


// DELETE handler to remove a property listing
export async function DELETE(request: NextRequest) {
     try {
        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get('id');

        if (!propertyId) {
            return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
        }

        const result: any = await query('DELETE FROM properties WHERE id = ?', [propertyId]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 });
        }

        return NextResponse.json({ message: `Property ${propertyId} deleted successfully` }, { headers: corsHeaders });
    } catch (error) {
        console.error('Failed to delete property:', error);
        return NextResponse.json({ error: 'Failed to delete property' }, { status: 500, headers: corsHeaders });
    }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
