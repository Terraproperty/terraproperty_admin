// src/app/api/rent-properties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Zod schema for creating/updating a rent property
const RentPropertySchema = z.object({
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
    coordinates: z.object({
        lat: z.number().optional(),
        lng: z.number().optional(),
    }).optional(),
    details: z.string().min(10),
    features: z.array(z.string()).min(1),
    idealFor: z.array(z.string()).min(1),
    additionalServices: z.array(z.string()).optional(),
    status: z.string().optional().default('pending'),
    images: z.array(z.string()).optional(),
});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// GET handler to fetch rent properties
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get('status');
        const propertyId = searchParams.get('id');
        const projectName = searchParams.get('projectName');

        if (propertyId) {
            const property = await query('SELECT * FROM rent_properties WHERE id = ?', [propertyId]) as any[];
            if (!property || property.length === 0) {
                return NextResponse.json({ error: 'Rent property not found' }, { status: 404 });
            }
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
            return NextResponse.json(prop, { headers: corsHeaders });
        }

        let sql = 'SELECT * FROM rent_properties';
        const params = [];
        const whereClauses = [];

        if (statusFilter && statusFilter !== 'all') {
            whereClauses.push('status = ?');
            params.push(statusFilter);
        }

        if (projectName) {
            whereClauses.push('projectName = ?');
            params.push(projectName);
        }

        if (whereClauses.length > 0) {
            sql += ' WHERE ' + whereClauses.join(' AND ');
        }

        sql += ' ORDER BY createdAt DESC';

        const properties = await query(sql, params);
        return NextResponse.json(properties, { headers: corsHeaders });
    } catch (error) {
        console.error('Failed to fetch rent properties:', error);
        return NextResponse.json({ error: 'Failed to fetch rent properties' }, { status: 500, headers: corsHeaders });
    }
}

// POST handler to create a new rent property listing
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = RentPropertySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 });
        }

        const { propertyName, address, price, description, contactNumber, email, status, propertyType, propertyCategory, projectName, location, coordinates, details, features, idealFor, additionalServices, images } = validation.data;
        const newPropertyId = randomUUID();

        await query(
          `INSERT INTO rent_properties (
            id, propertyName, address, price, description, contactNumber, email, status,
            propertyType, propertyCategory, projectName, location,
            coordinates_lat, coordinates_lng, details, features, idealFor, additionalServices, images
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newPropertyId, propertyName, address, price, description, contactNumber, email, status,
            propertyType, propertyCategory, projectName, location,
            coordinates?.lat ?? null, coordinates?.lng ?? null, details,
            JSON.stringify(features), JSON.stringify(idealFor), JSON.stringify(additionalServices ?? []), JSON.stringify(images ?? [])
          ]
        );

        const newProperty = await query('SELECT * FROM rent_properties WHERE id = ?', [newPropertyId]) as any[];

        return NextResponse.json({ message: 'Rent property listed successfully', property: newProperty[0] }, { status: 201, headers: corsHeaders });

    } catch (error) {
        console.error('Failed to list rent property:', error);
        return NextResponse.json({ error: 'Failed to list rent property' }, { status: 500, headers: corsHeaders });
    }
}

// PATCH handler to update rent property
export async function PATCH(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get('id');

        if (!propertyId) {
            return NextResponse.json({ error: 'Rent property ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const validation = RentPropertySchema.partial().safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid input for rent property update', details: validation.error.errors }, { status: 400 });
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

        const sql = `UPDATE rent_properties SET ${updates.join(', ')} WHERE id = ?`;
        const result: any = await query(sql, params);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Rent property not found or nothing changed' }, { status: 404 });
        }

        const updatedProperty = await query('SELECT * FROM rent_properties WHERE id = ?', [propertyId]) as any[];

        return NextResponse.json({ message: `Rent property ${propertyId} updated`, property: updatedProperty[0] }, { headers: corsHeaders });
    } catch (error) {
        console.error('Failed to update rent property:', error);
        return NextResponse.json({ error: 'Failed to update rent property' }, { status: 500, headers: corsHeaders });
    }
}

// DELETE handler to remove a rent property listing
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get('id');

        if (!propertyId) {
            return NextResponse.json({ error: 'Rent property ID is required' }, { status: 400 });
        }

        const result: any = await query('DELETE FROM rent_properties WHERE id = ?', [propertyId]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Rent property not found' }, { status: 404 });
        }

        return NextResponse.json({ message: `Rent property ${propertyId} deleted successfully` }, { headers: corsHeaders });
    } catch (error) {
        console.error('Failed to delete rent property:', error);
        return NextResponse.json({ error: 'Failed to delete rent property' }, { status: 500, headers: corsHeaders });
    }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
