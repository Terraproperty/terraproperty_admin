'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Loader2, FileText, Trash2, RefreshCw } from 'lucide-react';
import { getBlogs, addBlog, deleteBlog, type Blog } from '@/services/crm'; // Use services
import { format } from 'date-fns'; // For formatting dates

// Zod schema for form validation (File handling is complex in server actions/APIs)
// For now, we focus on the metadata aspect. File upload itself needs dedicated handling.
// const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
// const ACCEPTED_FILE_TYPES = ['application/pdf'];

const blogFormSchema = z.object({
  heading: z.string().min(1, "Heading is required."),
  subheading: z.string().min(1, "Subheading is required."),
  content: z.string().min(1, "Content is required."),
  image: z
    .instanceof(File, { message: 'Please select an image.' })
    .refine((file) => !file || file.size <= 10 * 1024 * 1024, "Image must be ≤ 10MB")
    .refine((file) => !file || file.type.startsWith('image/'), "Only image files allowed")
    .optional(),
});

type BlogFormValues = z.infer<typeof blogFormSchema>;


export default function BlogsPage() {
  const [isUploading, setIsUploading] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [uploadedBlogs, setUploadedBlogs] = React.useState<Blog[]>([]); // Use Blog type from service
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null); // Ref for file input
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      heading: "",
      subheading: "",
      content: "",
      image: undefined,
    },
  });

  // Fetch blogs from API
  const fetchBlogs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const blogs = await getBlogs();
      setUploadedBlogs(blogs);
    } catch (error: any) {
      console.error('Error fetching blogs:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch blogs: ${error.message || 'Please try again.'}`,
        variant: 'destructive',
      });
       setUploadedBlogs([]); // Clear on error
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // Depend on toast

  // Fetch blogs on mount
  React.useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);


   // Function to handle blog creation via API
   const createBlogEntry = async (fileName: string): Promise<Blog> => {
     console.log('Creating blog entry for:', fileName);
     // In a real app:
     // 1. Upload the actual file `blogFile` from the form state to your storage (S3, Firebase Storage, etc.)
     // 2. Get the storage path or URL from the upload result.
     // 3. Call the addBlog service with the fileName and the storagePathOrUrl.

     // Simulating API call delay and response
     await new Promise((resolve) => setTimeout(resolve, 1500));

     // For demo, we call addBlog with placeholder values for required fields
     const newBlog = await addBlog({
       heading: 'Demo Heading',
       subheading: 'Demo Subheading',
       content: 'Demo Content',
       imageUrl: '/demo/path/to/image.jpg',
     });
     console.log('API Response - New Blog:', newBlog);
     return newBlog;
   };

  const onSubmit = async (data: BlogFormValues) => {
    setIsUploading(true);
    try {
      if (!data.image) {
        toast({ title: 'Error', description: 'No image selected.', variant: 'destructive' });
        setIsUploading(false);
        return;
      }
      // 1. Upload image
      const imageForm = new FormData();
      imageForm.append('file', data.image);
      const imageRes = await fetch('/api/upload', { method: 'POST', body: imageForm });
      if (!imageRes.ok) throw new Error('Image upload failed');
      const imageData = await imageRes.json();

      // 2. Save blog metadata (no PDF upload)
      const newBlog = await addBlog({
        heading: data.heading,
        subheading: data.subheading,
        content: data.content,
        imageUrl: imageData.filename,
      });

      setUploadedBlogs((prev) => [newBlog, ...prev]);
      toast({
        title: 'Success',
        description: `Blog "${newBlog.heading}" saved.`,
      });
      form.reset();
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error('Error creating blog entry:', error);
      toast({
        title: 'Error',
        description: `Failed to save blog: ${error.message || 'Please try again.'}`,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle blog deletion via API
  const handleDeleteBlog = async (blogId: string, blogName: string) => {
      // Optional: Add confirmation dialog
      // if (!confirm(`Are you sure you want to delete "${blogName}"?`)) {
      //     return;
      // }

      try {
          await deleteBlog(blogId);
          setUploadedBlogs((prev) => prev.filter(blog => blog.id !== blogId));
          toast({
              title: 'Blog Deleted',
              description: `Blog post "${blogName}" has been removed.`,
          });
      } catch (error: any) {
          console.error('Error deleting blog:', error);
          toast({
              title: 'Error',
              description: `Failed to delete blog: ${error.message || 'Please try again.'}`,
              variant: 'destructive',
          });
      }
  }


  return (
    <div className="container mx-auto py-8 grid gap-8 md:grid-cols-2">
      {/* Upload Blog Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <UploadCloud className="h-6 w-6 text-primary" /> Upload New Blog Post
          </CardTitle>
          <CardDescription>Upload a PDF file to add a new blog post.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="heading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heading</FormLabel>
                    <FormControl>
                      <Input placeholder="Blog Heading" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subheading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subheading</FormLabel>
                    <FormControl>
                      <Input placeholder="Blog Subheading" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Content</FormLabel>
                    <FormControl>
                      <textarea
                        className="w-full border rounded px-3 py-2"
                        rows={6}
                        placeholder="Write your blog content here..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field: { onChange, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Blog Image (max 1, ≤10MB)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          onChange(file);
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = ev => setImagePreview(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          } else {
                            setImagePreview(null);
                          }
                        }}
                        // Remove value from rest to avoid passing File as value
                        {...(() => {
                          const { value, ...restWithoutValue } = rest;
                          return restWithoutValue;
                        })()}
                      />
                    </FormControl>
                    {imagePreview && (
                      <div className="mt-2">
                        <img src={imagePreview} alt="Preview" className="h-32 rounded shadow" />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Blog'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

       {/* Uploaded Blogs List Card */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" /> Published Blogs
                </CardTitle>
                <CardDescription>List of currently published blog posts (by heading).</CardDescription>
             </div>
             <Button onClick={fetchBlogs} variant="outline" size="icon" disabled={isLoading || isUploading}>
               {(isLoading || isUploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
               <span className="sr-only">Refresh Blogs</span>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
             ) : uploadedBlogs.length === 0 ? (
               <div className="text-center py-10 text-muted-foreground">
                 No blogs uploaded yet.
               </div> 
            ) : (
               <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                 {uploadedBlogs.map((blog) => (
                   <li key={blog.id} className="border p-3 rounded-md bg-card-foreground/5 flex justify-between items-center">
                      <div className="overflow-hidden mr-2">
                        <p className="font-medium flex items-center gap-2 truncate">
                            <FileText className="h-4 w-4 text-secondary flex-shrink-0" />
                            <span title={blog.heading}>{blog.heading}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Uploaded: {format(new Date(blog.uploadDate), 'PPp')} {/* Format date */}
                        </p>
                       </div>
                       <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBlog(blog.id, blog.heading)}
                          className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                       >
                         <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Delete Blog</span>
                       </Button>
                   </li>
                ))}
               </ul>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
