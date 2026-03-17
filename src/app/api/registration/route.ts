import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Helper to add CORS headers
function addCorsHeaders(response: Response) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
}

export async function OPTIONS() {
    return addCorsHeaders(new Response(null, { status: 204 }));
}

function generateAssociateId(fullName: string): string {
    const firstName = fullName.split(' ')[0].toLowerCase();
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    return `${firstName}${randomDigits}`;
}

function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const {
            fullName,
            emailAddress,
            mobileNumber,
            highestQualification,
            coverLetterUrl,
            confirmation,
            referralCode // This is referedBy from frontend
        } = data;

        // Validation
        if (
            !fullName ||
            !emailAddress ||
            !mobileNumber ||
            !highestQualification ||
            confirmation !== true
        ) {
            return addCorsHeaders(
                NextResponse.json(
                    { error: 'All fields except cover letter are required and confirmation must be true' },
                    { status: 400 }
                )
            );
        }

        // Check for duplicate by email or mobile number
        const duplicateCheck = await db.query(
            `SELECT id FROM registration_forms WHERE email_address = ? OR mobile_number = ? LIMIT 1`,
            [emailAddress, mobileNumber]
        );
        // For mysql2, the first element is the rows array
        const duplicates = Array.isArray(duplicateCheck) ? duplicateCheck[0] : duplicateCheck;
console.log('Duplicate check result:', duplicates);

        if (duplicates && (
              (Array.isArray(duplicates) && duplicates.length > 0) ||
              (!Array.isArray(duplicates) && typeof duplicates === 'object' && Object.keys(duplicates).length > 0)
            )) {
            return addCorsHeaders(
                NextResponse.json(
                    {
                        error: 'You have already registered for the associate program. Please login or contact support at support@terraproperty.in'
                    },
                    { status: 409 }
                )
            );
        }

        const associateId = generateAssociateId(fullName);
        const generatedReferralCode = generateReferralCode();

        const registration = {
            id: uuidv4(),
            fullName,
            emailAddress,
            mobileNumber,
            highestQualification,
            coverLetterUrl: coverLetterUrl || null,
            confirmation,
            associateId,
            referralCode: generatedReferralCode,
            referedBy: referralCode || null,
            address: null,
            bio: null,
            userId: emailAddress,
            password: associateId
        };

        await db.query(
            `INSERT INTO registration_forms (
                id, full_name, email_address, mobile_number, highest_qualification,
                cover_letter_url, confirmation, associate_id, referral_code, referred_by,
                address, bio, user_id, password
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                registration.id,
                registration.fullName,
                registration.emailAddress,
                registration.mobileNumber,
                registration.highestQualification,
                registration.coverLetterUrl,
                registration.confirmation,
                registration.associateId,
                registration.referralCode,
                registration.referedBy,
                registration.address,
                registration.bio,
                registration.userId,
                registration.password
            ]
        );

        return addCorsHeaders(
            NextResponse.json(registration, { status: 201 })
        );
    } catch (error) {
        console.error('Failed to create registration form entry:', error);
        return addCorsHeaders(
            NextResponse.json(
                { error: 'Failed to create registration form entry' },
                { status: 500 }
            )
        );
    }
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const associateId = url.searchParams.get('associateId');

        if (!associateId) {
            return addCorsHeaders(
                NextResponse.json({ error: 'associateId query parameter is required' }, { status: 400 })
            );
        }

        // Fetch referral details from referral_details table
        const result = await db.query(
            `SELECT * FROM referral_details WHERE associate_id = ?`,
            [associateId]
        );
        // For mysql2, result[0] is the rows array
        const rows = Array.isArray(result) ? result[0] : result;

        // Check if any rows were returned
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return addCorsHeaders(
                NextResponse.json({ error: 'No referral details found for the given associateId' }, { status: 404 })
            );
        }

        return addCorsHeaders(
            NextResponse.json(rows[0], { status: 200 })
        );
    } catch (error) {
        console.error('Failed to fetch referral details:', error);
        return addCorsHeaders(
            NextResponse.json({ error: 'Failed to fetch referral details' }, { status: 500 })
        );
    }
}
