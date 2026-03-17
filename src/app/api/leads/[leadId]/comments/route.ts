import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// CORS Helper
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle preflight CORS requests
export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}

// GET handler to fetch comments for a specific lead
export async function GET(request: NextRequest, context: any
) {
  try {
    const  leadId  = context?.params?.leadId;
    if (!leadId) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
      );
    }

    const commentsResult = await db.query(
      'SELECT id, lead_id, comment_text, created_at FROM lead_comments WHERE lead_id = ? ORDER BY created_at DESC',
      [leadId]
    );

    const comments = Array.isArray(commentsResult) && Array.isArray(commentsResult[0])
      ? commentsResult[0]
      : Array.isArray(commentsResult)
      ? commentsResult
      : [];

    return addCorsHeaders(NextResponse.json(comments));
  } catch (error) {
    console.error('Failed to fetch lead comments:', error);
    return addCorsHeaders(
      NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    );
  }
}

// Zod schema for validation
const CreateCommentSchema = z.object({
  comment_text: z.string().min(1, { message: 'Comment text cannot be empty' }),
});

// POST handler to add a new comment
export async function POST(request: NextRequest, context: any
) {
  try {
    const  leadId  = context?.params?.leadId;
    if (!leadId) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
      );
    }

    const body = await request.json();
    const validation = CreateCommentSchema.safeParse(body);

    if (!validation.success) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Invalid input', details: validation.error.errors },
          { status: 400 }
        )
      );
    }

    const { comment_text } = validation.data;
    const commentId = randomUUID();
    const createdAt = new Date();

    await db.query(
      'INSERT INTO lead_comments (id, lead_id, comment_text, created_at) VALUES (?, ?, ?, ?)',
      [commentId, leadId, comment_text, createdAt]
    );

    const newComment = {
      id: commentId,
      lead_id: leadId,
      comment_text,
      created_at: createdAt.toISOString(),
    };

    return addCorsHeaders(NextResponse.json(newComment, { status: 201 }));
  } catch (error) {
    console.error('Failed to add lead comment:', error);
    return addCorsHeaders(
      NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
    );
  }
}
