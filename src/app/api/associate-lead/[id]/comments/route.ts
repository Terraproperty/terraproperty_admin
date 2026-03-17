import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { randomUUID } from 'crypto';

function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}



export async function GET(request: NextRequest, context: any
) {
 const id = context?.params?.id;
  if (!id) {
    return addCorsHeaders(
      NextResponse.json({ error: 'Associate Lead ID is required' }, { status: 400 })
    );
  }

  try {
    const commentsResult = await db.query(
      'SELECT id, associate_lead_id, comment_text, created_at FROM associate_lead_comments WHERE associate_lead_id = ? ORDER BY created_at DESC',
      [id]
    );

    const comments =
      Array.isArray(commentsResult) && Array.isArray(commentsResult[0])
        ? commentsResult[0]
        : Array.isArray(commentsResult)
        ? commentsResult
        : [];

    return addCorsHeaders(NextResponse.json(comments));
  } catch (error) {
    console.error('GET error:', error);
    return addCorsHeaders(
      NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    );
  }
}
const CreateCommentSchema = z.object({
  comment_text: z.string().min(1, { message: 'Comment text cannot be empty' }),
});

export async function POST(request: NextRequest, context: any
) {
  const id = context?.params?.id;

  if (!id) {
    return addCorsHeaders(
      NextResponse.json({ error: 'Associate Lead ID is required' }, { status: 400 })
    );
  }

  try {
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
      'INSERT INTO associate_lead_comments (id, associate_lead_id, comment_text, created_at) VALUES (?, ?, ?, ?)',
      [commentId, id, comment_text, createdAt]
    );

    const newComment = {
      id: commentId,
      associate_lead_id: id,
      comment_text,
      created_at: createdAt.toISOString(),
    };

    return addCorsHeaders(NextResponse.json(newComment, { status: 201 }));
  } catch (error) {
    console.error('POST error:', error);
    return addCorsHeaders(
      NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
    );
  }
}
