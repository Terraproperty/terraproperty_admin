'use client';

import * as React from 'react';
import { getContactInquiries, deleteContactInquiry, type ContactInquiry } from '@/services/inquiries'; // Added deleteContactInquiry
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, MoreHorizontal, Trash2 } from 'lucide-react'; // Added Trash2
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator, // Added Separator
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // Not directly used here, but good to know it exists
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function ContactInquiriesPage() {
  const [inquiries, setInquiries] = React.useState<ContactInquiry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [inquiryToDelete, setInquiryToDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);


  const handleStatusChange = async (id: string, newStatus: 'new' | 'in_progress' | 'resolved') => {
    try {
      const response = await fetch(`/api/contact-inquiries?id=${id}`, {
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
      fetchInquiries();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to update status: ${error.message}`,
        variant: 'destructive',
      });
    }
  };


  const fetchInquiries = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getContactInquiries();
      setInquiries(data);
    } catch (error: any) {
      console.error('Failed to fetch inquiries:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch inquiries: ${error.message || 'Please try again.'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const openDeleteDialog = (id: string) => {
    setInquiryToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!inquiryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteContactInquiry(inquiryToDelete);
      toast({
        title: 'Success',
        description: 'Inquiry deleted successfully.',
      });
      setInquiries(prevInquiries => prevInquiries.filter(inq => inq.id !== inquiryToDelete));
      setIsDeleteDialogOpen(false);
      setInquiryToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to delete inquiry: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: // 'new'
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Contact Inquiries</h1>
        <Button onClick={fetchInquiries} variant="outline" size="icon" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="sr-only">Refresh Inquiries</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading inquiries...</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground"> {/* Updated colSpan */}
                  No inquiries found.
                </TableCell>
              </TableRow>
            ) : (
              inquiries.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell className="font-medium">{inquiry.name}</TableCell>
                  <TableCell>{inquiry.email}</TableCell>
                  <TableCell>{inquiry.phone || 'N/A'}</TableCell>
                  <TableCell className="max-w-xs truncate" title={inquiry.message}>{inquiry.message}</TableCell> {/* Adjusted max-w */}
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                      {inquiry.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>{format(new Date(inquiry.createdAt), 'PP pp')}</TableCell> {/* More precise date */}
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
                          onClick={() => handleStatusChange(inquiry.id, 'new')}
                          disabled={inquiry.status === 'new'}
                        >
                          Mark as New
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(inquiry.id, 'in_progress')}
                          disabled={inquiry.status === 'in_progress'}
                        >
                          Mark as In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(inquiry.id, 'resolved')}
                          disabled={inquiry.status === 'resolved'}
                        >
                          Mark as Resolved
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(inquiry.id)}
                          className="text-red-600 hover:!text-red-600 focus:!text-red-600" // Destructive styling
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Inquiry
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contact inquiry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setInquiryToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500" // Destructive styling
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
