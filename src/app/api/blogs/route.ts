// src/app/api/blogs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const BlogSchema = z.object({
    heading: z.string().min(1, "Heading is required."),
    subheading: z.string().min(1, "Subheading is required."),
    content: z.string().min(1, "Content is required."),
    imageUrl: z.string().min(1, "Image URL is required."),
});

// --- CORS Helper ---
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', '*');
  return response;
}

// --- OPTIONS Handler ---
export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}

// GET handler to fetch all blogs or a single blog by id
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const blogId = searchParams.get('id');

        // If an 'id' query parameter is provided, fetch and return the blog with that id.
        // Otherwise, return all blogs. Returns 404 if the blog is not found.
        if (blogId) {
            const result = await query('SELECT id, heading, subheading, content, imageUrl, uploadDate FROM blogs WHERE id = ?', [blogId]);
            const blogs = Array.isArray(result) ? result : [];
            if (blogs.length === 0) {
                return addCorsHeaders(NextResponse.json({ error: 'Blog not found' }, { status: 404 }));
            }
            return addCorsHeaders(NextResponse.json(blogs[0]));
        } else {
            const result = await query('SELECT id, heading, subheading, content, imageUrl, uploadDate FROM blogs ORDER BY uploadDate DESC');
            const blogs = Array.isArray(result) ? result : [];
            return addCorsHeaders(NextResponse.json(blogs));
        }
    } catch (error) {
        console.error('Failed to fetch blogs:', error);
        return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 }));
    }
}

// POST handler to add a new blog entry (metadata only for now)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = BlogSchema.safeParse(body);

        if (!validation.success) {
            return addCorsHeaders(NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 }));
        }

        const { heading, subheading, content, imageUrl } = validation.data;
        const newBlogId = randomUUID();

        await query(
            'INSERT INTO blogs (id, heading, subheading, content, imageUrl) VALUES (?, ?, ?, ?, ?)',
            [newBlogId, heading, subheading, content, imageUrl]
        );

        const newBlog = await query('SELECT id, heading, subheading, content, imageUrl, uploadDate FROM blogs WHERE id = ?', [newBlogId]) as any[];

        return addCorsHeaders(NextResponse.json({ message: 'Blog added successfully', blog: newBlog[0] }, { status: 201 }));

    } catch (error) {
        console.error('Failed to add blog:', error);
        return addCorsHeaders(NextResponse.json({ error: 'Failed to add blog' }, { status: 500 }));
    }
}

// DELETE handler to remove a blog post
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const blogId = searchParams.get('id');

        if (!blogId) {
            return addCorsHeaders(NextResponse.json({ error: 'Blog ID is required' }, { status: 400 }));
        }

        // 1. Get blog details to find the file path (optional but needed for file deletion)
        const blogs = await query('SELECT storagePathOrUrl FROM blogs WHERE id = ?', [blogId]) as any[];
        if (blogs.length === 0) {
            return addCorsHeaders(NextResponse.json({ error: 'Blog not found' }, { status: 404 }));
        }
        const storagePath = blogs[0].storagePathOrUrl;

        // 2. Delete the database record
        const result: any = await query('DELETE FROM blogs WHERE id = ?', [blogId]);

        if (result.affectedRows === 0) {
            return addCorsHeaders(NextResponse.json({ error: 'Blog not found' }, { status: 404 }));
        }

        // 3. Delete the actual file from storage (Placeholder)
        // if (storagePath) {
        //     try {
        //         await deleteFileFromStorage(storagePath);
        //         console.log(`Deleted file from storage: ${storagePath}`);
        //     } catch (storageError) {
        //         console.error(`Failed to delete file ${storagePath} from storage:`, storageError);
        //         // Decide if this should be a critical error or just a warning
        //     }
        // }

        return addCorsHeaders(NextResponse.json({ message: `Blog ${blogId} deleted successfully` }));
    } catch (error) {
        console.error('Failed to delete blog:', error);
        return addCorsHeaders(NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 }));
    }
}
