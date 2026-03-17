'use client';

import * as React from 'react';
import { getCareerApplications, type CareerApplication } from '@/services/inquiries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ExternalLink, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { DropdownMenuSeparator } from '@radix-ui/react-dropdown-menu';

export default function CareerApplicationsPage() {
  const [applications, setApplications] = React.useState<CareerApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = React.useState<CareerApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = React.useState(false);
  const [applicationToDelete, setApplicationToDelete] = React.useState<CareerApplication | null>(null);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  const handleStatusChange = async (id: string, newStatus: 'new' | 'under_review' | 'shortlisted' | 'rejected' | 'hired') => {
    try {
      const response = await fetch(`/api/career-applications?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });

      // Refresh the list
      fetchApplications();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to update status: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const fetchApplications = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCareerApplications();
      setApplications(data);
    } catch (error: any) {
      console.error('Failed to fetch applications:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch applications: ${error.message || 'Please try again.'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hired':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Career Applications</h1>
        <Button onClick={fetchApplications} variant="outline" size="icon" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="sr-only">Refresh Applications</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading applications...</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Current Company</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No applications found.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">{application.name}</TableCell>
                  <TableCell>
                    <div>{application.email}</div>
                    <div className="text-sm text-muted-foreground">{application.phone || 'No phone'}</div>
                  </TableCell>
                  <TableCell>{application.position_applied}</TableCell>
                  <TableCell>{application.experience_years ? `${application.experience_years} years` : 'Not specified'}</TableCell>
                  <TableCell>{application.current_company || 'Not specified'}</TableCell>
                  <TableCell>
                    {application.resume_url && (
                      <a
                        href={application.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Resume <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    )}
                    {application.coverLetter && (
                      <div className="mt-1 text-sm text-muted-foreground">Has cover letter</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(application.status)}`}>
                      {application.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>{format(new Date(application.createdAt), 'PP')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowDetailsModal(true);
                          }}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setApplicationToDelete(application);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 focus:text-red-700"
                        >
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(application.id, 'new')}
                          disabled={application.status === 'new'}
                        >
                          Mark as New
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(application.id, 'under_review')}
                          disabled={application.status === 'under_review'}
                        >
                          Mark as Under Review
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(application.id, 'shortlisted')}
                          disabled={application.status === 'shortlisted'}
                        >
                          Mark as Shortlisted
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(application.id, 'rejected')}
                          disabled={application.status === 'rejected'}
                        >
                          Mark as Rejected
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(application.id, 'hired')}
                          disabled={application.status === 'hired'}
                        >
                          Mark as Hired
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Application Details</h2>
            <div className="space-y-2 text-sm">
              <div><b>Name:</b> {selectedApplication.name}</div>
              <div><b>Email:</b> {selectedApplication.email}</div>
              <div><b>Phone:</b> {selectedApplication.phone || 'No phone'}</div>
              <div><b>Position:</b> {selectedApplication.position_applied}</div>
              <div><b>Experience:</b> {selectedApplication.experience_years ? `${selectedApplication.experience_years} years` : 'Not specified'}</div>
              <div><b>Current Company:</b> {selectedApplication.current_company || 'Not specified'}</div>
              <div><b>Status:</b> {selectedApplication.status.replace('_', ' ')}</div>
              <div><b>Applied On:</b> {format(new Date(selectedApplication.createdAt), 'PP')}</div>
              {selectedApplication.coverLetter && (
                <div>
                  <b>Cover Letter:</b>
                  <div className="border rounded p-2 bg-muted mt-1">{selectedApplication.coverLetter}</div>
                </div>
              )}
              {selectedApplication.resume_url && (
                <div>
                  <b>Resume:</b> <a href={selectedApplication.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Resume</a>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedApplication(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && applicationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">Delete Application</h2>
            <p className="mb-4">Are you sure you want to delete <b>{applicationToDelete.name}</b>'s application?</p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setApplicationToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    await fetch(`/api/career-applications?id=${applicationToDelete.id}`, { method: 'DELETE' });
                    await fetchApplications(); // <-- Await this before closing modal
                    setShowDeleteModal(false);
                    setApplicationToDelete(null);
                    toast({ title: 'Deleted', description: 'Application deleted.' });
                  } catch (error: any) {
                    toast({
                      title: 'Error',
                      description: `Failed to delete application: ${error.message || 'Please try again.'}`,
                      variant: 'destructive',
                    });
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
