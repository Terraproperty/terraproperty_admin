'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function JobsPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [jdPdf, setJdPdf] = useState<File | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const { toast } = useToast();

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      setJobs(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch jobs',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setJdPdf(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || (!jdPdf && !editingJob)) {
      toast({
        title: 'Error',
        description: 'Please fill all fields and upload a JD PDF',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (jdPdf) formData.append('jdPdf', jdPdf);

      let res;
      if (editingJob) {
        res = await fetch(`/api/jobs?id=${editingJob.id}`, {
          method: 'PATCH',
          body: formData,
        });
      } else {
        res = await fetch('/api/jobs', {
          method: 'POST',
          body: formData,
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save job');
      }

      toast({
        title: 'Success',
        description: editingJob ? 'Job updated successfully' : 'Job added successfully',
      });

      setTitle('');
      setDescription('');
      setJdPdf(null);
      setEditingJob(null);
      fetchJobs();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save job',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (job: any) => {
    setEditingJob(job);
    setTitle(job.title);
    setDescription(job.description);
    setJdPdf(null);
  };

  const handleCancelEdit = () => {
    setEditingJob(null);
    setTitle('');
    setDescription('');
    setJdPdf(null);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{editingJob ? 'Edit Job' : 'Add Job and JD PDF'}</h1>
      <form onSubmit={handleSubmit} className="mb-8 space-y-4 max-w-lg">
        <div>
          <label htmlFor="title" className="block mb-1 font-medium">Job Title</label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block mb-1 font-medium">Job Description</label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
          />
        </div>
        <div>
          <label htmlFor="jdPdf" className="block mb-1 font-medium">Upload JD PDF</label>
          <input
            id="jdPdf"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            // Only required if not editing
            required={!editingJob}
          />
          {editingJob && editingJob.jd_pdf_url && (
            <div className="mt-2 text-sm">
              Current PDF:{" "}
              <a href={editingJob.jd_pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                View PDF
              </a>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? (editingJob ? 'Updating...' : 'Uploading...') : (editingJob ? 'Update Job' : 'Add Job')}
          </Button>
          {editingJob && (
            <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={loading}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <h2 className="text-2xl font-bold mb-4">Existing Jobs</h2>
      {jobs.length === 0 ? (
        <p>No jobs found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>JD PDF</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.title}</TableCell>
                <TableCell>{job.description}</TableCell>
                <TableCell>
                  <a href={job.jd_pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View PDF
                  </a>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(job)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
