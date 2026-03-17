'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { getAssociateLeads, getAssociateLeadComments, addAssociateLeadComment, type AssociateLeadComment } from '@/services/crm'; // Added comment functions and type

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"; // Added Dialog components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, MessageSquare, Loader2 } from 'lucide-react'; // Added MessageSquare, Loader2
import { useToast } from '@/hooks/use-toast'; // Assuming you have a useToast hook
import { format, isValid } from 'date-fns';


type LeadStatus = 'new' | 'progress' | 'Ongoing' | 'deal closed' | 'meeting' | 'Rejected';

interface AssociateLead {
  id: string;
  // comment: string; // This will be handled by the modal now
  full_name: string;
  email_address: string;
  phone_number: string;
  property_type: string;
  preferred_location: string;
  budget_range: number | string;
  additional_notes: string;
  per_deal_commission: number;
  total_commission: number;
  pending_commission: number;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
  referred_by?: string | null;
  referred_by_name?: string | null;
  lead_type?: string; // Make sure this is part of your type if used
}

const statusOptions: LeadStatus[] = ['new', 'progress', 'Ongoing', 'deal closed', 'meeting','Rejected'];

async function updateAssociateLead(
  id: string,
  update: { price?: number; status?: string; budget_range?: number | string | null } // Allow null for budget_range
) {
  const res = await fetch('/api/associate-lead', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...update }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update lead');
  }
  return res.json();
}

export default function AssociateLeadPage() {
  const [leads, setLeads] = useState<AssociateLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<string>('');
  // const [commentInput, setCommentInput] = useState<{ [key: string]: string }>({}); // Removed old comment input
  const [search, setSearch] = useState('');
  const { toast } = useToast(); // Initialize toast

  // Comment Modal State
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedLeadForComments, setSelectedLeadForComments] = useState<AssociateLead | null>(null);
  const [currentLeadComments, setCurrentLeadComments] = useState<AssociateLeadComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);


  const fetchLeadsData = useCallback(() => {
    setLoading(true);
    getAssociateLeads()
      .then((data) => {
        const normalizedLeads = data.map((lead: any) => ({
          // comment: '', // No longer needed here
          updated_at: lead.updated_at || '', // Ensure updated_at exists
          ...lead,
        }));
        setLeads(normalizedLeads);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load leads');
        setLoading(false);
        toast({ title: 'Error', description: 'Failed to load leads.', variant: 'destructive' });
      });
  }, [toast]);

  useEffect(() => {
    fetchLeadsData();
  }, [fetchLeadsData]);

  const handlePriceEdit = (id: string, currentPrice: number | string | null) => {
    setEditingPriceId(id);
    setPriceInput(currentPrice ? String(currentPrice) : '0');
  };

   const handlePriceSave = async (id: string) => {
    try {
      await updateAssociateLead(id, { budget_range: priceInput });
      const updatedLeads = leads.map((lead) =>
        lead.id === id ? { ...lead, budget_range: priceInput } : lead
      );
      setLeads(updatedLeads);
      setEditingPriceId(null);
    } catch (err) {
      alert('Failed to update budget range');
    }
  };

  // const handleCommentChange = (id: string, value: string) => { // Removed old comment change
  //   setCommentInput((prev) => ({ ...prev, [id]: value }));
  //   const updatedLeads = leads.map((lead) =>
  //     lead.id === id ? { ...lead, comment: value } : lead
  //   );
  //   setLeads(updatedLeads);
  // };

  const handleStatusChange = async (id: string, newStatus: LeadStatus) => {
    try {
      await updateAssociateLead(id, { status: newStatus });
      const updatedLeads = leads.map((lead) =>
        lead.id === id ? { ...lead, status: newStatus } : lead
      );
      setLeads(updatedLeads);
      toast({ title: 'Success', description: 'Status updated.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update status.', variant: 'destructive' });
    }
  };

  const openCommentModal = async (lead: AssociateLead) => {
    setSelectedLeadForComments(lead);
    setIsCommentModalOpen(true);
    setLoadingComments(true);
    setCurrentLeadComments([]); // Clear previous comments
    try {
      const comments = await getAssociateLeadComments(lead.id);
      setCurrentLeadComments(comments);
    } catch (error: any) {
      toast({
        title: 'Error fetching comments',
        description: error.message || 'Could not load comments.',
        variant: 'destructive',
      });
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedLeadForComments || !newCommentText.trim()) {
      toast({ title: 'Error', description: 'Comment text cannot be empty.', variant: 'destructive' });
      return;
    }
    setSubmittingComment(true);
    try {
      const newComment = await addAssociateLeadComment(selectedLeadForComments.id, newCommentText);
      setCurrentLeadComments(prevComments => [newComment, ...prevComments]);
      setNewCommentText(''); // Clear input after successful submission
      toast({ title: 'Success', description: 'Comment added.' });
    } catch (error: any) {
      toast({
        title: 'Error adding comment',
        description: error.message || 'Could not add comment.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingComment(false);
    }
  };


  // Filter leads by referred_by_name or full_name
  const filteredLeads = leads.filter(
    (lead) =>
      !search ||
      (lead.referred_by_name &&
        lead.referred_by_name.toLowerCase().includes(search.toLowerCase())) ||
      (lead.full_name &&
        lead.full_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Associate Leads</h1>
      <div className="mb-4 flex items-center">
        <Input
          type="text"
          placeholder="Search by Name or Referred By"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
      </div>
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-8">{error}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Lead type</TableHead>
              <TableHead>Property Type</TableHead>
              <TableHead>Budget Range</TableHead>
              {/* <TableHead>Comment</TableHead> Removed */}
              <TableHead>Referred By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground"> {/* Adjusted colSpan */}
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{lead.full_name}</TableCell>
                  <TableCell>{lead.phone_number}</TableCell>
                  <TableCell>{lead.lead_type || 'N/A'}</TableCell>
                  <TableCell>{lead.property_type || 'N/A'}</TableCell>

                  <TableCell>
                    {editingPriceId === lead.id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="text" // Changed to text to allow empty string for null
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          className="w-24"
                          placeholder="e.g., 500000"
                        />
                        <Button size="sm" onClick={() => handlePriceSave(lead.id)}>
                          Save
                        </Button>
                         <Button size="sm" variant="ghost" onClick={() => setEditingPriceId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>
                          {lead.budget_range === null || lead.budget_range === undefined || lead.budget_range === ''
                            ? 'N/A'
                            : typeof lead.budget_range === 'number'
                            ? `$${lead.budget_range.toLocaleString()}`
                            : lead.budget_range}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePriceEdit(lead.id, lead.budget_range)}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  {/* <TableCell> // Removed old comment Textarea
                    <Textarea
                      value={lead.comment}
                      onChange={(e) => handleCommentChange(lead.id, e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </TableCell> */}
                  <TableCell>
                    {lead.referred_by ? `${lead.referred_by_name || 'Unknown'} (ID: ${lead.referred_by})` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openCommentModal(lead)}
                      title="View/Add Comments"
                      className="mr-1"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"> {/* Changed to icon for consistency */}
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {statusOptions.map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => handleStatusChange(lead.id, status)}
                            disabled={lead.status === status}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Comment Modal Dialog */}
      {selectedLeadForComments && (
        <Dialog open={isCommentModalOpen} onOpenChange={(isOpen) => {
          setIsCommentModalOpen(isOpen);
          if (!isOpen) {
            setSelectedLeadForComments(null); // Clear selected lead when closing
            setCurrentLeadComments([]);
            setNewCommentText('');
          }
        }}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Comments for {selectedLeadForComments.full_name}</DialogTitle>
              <DialogDescription>
                View and add comments for this associate lead.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Type your comment here..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleAddComment} disabled={submittingComment || !newCommentText.trim()}>
                  {submittingComment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Add Comment
                </Button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                {loadingComments ? (
                  <div className="flex justify-center items-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : currentLeadComments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">No comments yet.</p>
                ) : (
                  currentLeadComments.map(comment => (
                    <div key={comment.id} className="p-3 bg-muted/50 rounded-md border">
                      <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isValid(new Date(comment.created_at)) ? format(new Date(comment.created_at), 'PP pp') : 'Invalid Date'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                        Close
                    </Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
