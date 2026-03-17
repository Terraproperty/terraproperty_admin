'use client'

import * as React from 'react';
import { getLeads, submitLeadResponse, type Lead, getLeadComments, addLeadComment, type LeadComment, type GetLeadsParams, type LeadStatus } from '@/services/crm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, RefreshCw, Loader2, MessageSquare, CalendarIcon, Search, Briefcase, ThumbsUp, ThumbsDown, Download } from 'lucide-react'; // Added Download
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isValid } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

export default function LeadsPage() {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Filters State
  const [statusFilter, setStatusFilter] = React.useState<string>('pending');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [sortByDate, setSortByDate] = React.useState<'asc' | 'desc' | undefined>(undefined);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  // Comment Modal State
  const [isCommentModalOpen, setIsCommentModalOpen] = React.useState(false);
  const [selectedLeadForComments, setSelectedLeadForComments] = React.useState<Lead | null>(null);
  const [currentLeadComments, setCurrentLeadComments] = React.useState<LeadComment[]>([]);
  const [newCommentText, setNewCommentText] = React.useState('');
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [submittingComment, setSubmittingComment] = React.useState(false);

  const fetchLeads = React.useCallback(async () => {
    setLoading(true);
    const params: GetLeadsParams = {
      status: statusFilter,
      search: searchQuery,
      sortDate: sortByDate,
      startDate: dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined,
      endDate: dateRange?.to ? dateRange.to.toISOString().split('T')[0] : undefined,
    };
    try {
      const fetchedLeads = await getLeads(params);
      setLeads(fetchedLeads);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch leads: ${error.message || 'Please try again.'}`,
        variant: 'destructive',
      });
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [toast, statusFilter, searchQuery, sortByDate, dateRange]);

  React.useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleResponse = async (leadId: string, status: LeadStatus) => {
    setSubmitting((prev) => ({ ...prev, [leadId]: true }));
    try {
      await submitLeadResponse({ leadId, status });
      toast({
        title: 'Success',
        description: `Lead status updated to ${status.replace('_', ' ')}.`,
      });
      fetchLeads();
    } catch (error: any) {
      console.error(`Error submitting lead response for ${leadId}:`, error);
      toast({
        title: 'Error',
        description: `Failed to update lead status: ${error.message || 'Please try again.'}`,
        variant: 'destructive',
      });
    } finally {
      setSubmitting((prev) => {
        const newState = { ...prev };
        delete newState[leadId];
        return newState;
      });
    }
  };

  const openCommentModal = async (lead: Lead) => {
    setSelectedLeadForComments(lead);
    setIsCommentModalOpen(true);
    setLoadingComments(true);
    try {
      const comments = await getLeadComments(lead.id);
      setCurrentLeadComments(comments);
    } catch (error: any) {
      toast({
        title: 'Error fetching comments',
        description: error.message || 'Could not load comments.',
        variant: 'destructive',
      });
      setCurrentLeadComments([]);
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
      const newComment = await addLeadComment(selectedLeadForComments.id, newCommentText);
      setCurrentLeadComments(prevComments => [newComment, ...prevComments]);
      setNewCommentText('');
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

  const handleClearFilters = () => {
    setStatusFilter('pending');
    setSearchQuery('');
    setSortByDate(undefined);
    setDateRange(undefined);
    // fetchLeads will be called by useEffect due to state changes
  };

  const getStatusBadgeClass = (status: LeadStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'closed': // If you keep 'closed'
        return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300';
      case 'deal_won':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'; // Example for deal_won
      case 'deal_loss':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300'; // Example for deal_loss
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleExportLeads = () => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'all') {
      params.append('status', statusFilter);
    }
    if (searchQuery) {
      params.append('search', searchQuery);
    }
    if (sortByDate) {
      params.append('sortDate', sortByDate);
    }
    if (dateRange?.from) {
      params.append('startDate', dateRange.from.toISOString().split('T')[0]);
    }
    if (dateRange?.to) {
      params.append('endDate', dateRange.to.toISOString().split('T')[0]);
    }

    const exportUrl = `/api/leads/export?${params.toString()}`;
    window.open(exportUrl, '_blank'); // Opens the URL, browser handles download
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Filter and Refresh Controls */}
      <div className="p-4 border rounded-lg bg-card shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Search Input */}
          <div className="space-y-1">
            <label htmlFor="search-leads" className="text-sm font-medium">Search Name/Phone</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-leads"
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label htmlFor="status-filter" className="text-sm font-medium">Status</label>
            <Select onValueChange={setStatusFilter} value={statusFilter}>
              <SelectTrigger id="status-filter" className="w-full">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="deal_won">Deal Won</SelectItem>
                <SelectItem value="deal_loss">Deal Loss</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort by Date */}
          <div className="space-y-1">
            <label htmlFor="sort-date" className="text-sm font-medium">Sort by Date</label>
            <Select
              value={sortByDate === undefined ? 'default_sort_option' : sortByDate}
              onValueChange={(selectedValue) => {
                if (selectedValue === 'default_sort_option') {
                  setSortByDate(undefined);
                } else {
                  setSortByDate(selectedValue as 'asc' | 'desc');
                }
              }}
            >
              <SelectTrigger id="sort-date" className="w-full">
                <SelectValue placeholder="Sort by Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default_sort_option">Default (Newest)</SelectItem>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Picker */}
          <div className="space-y-1">
            <label htmlFor="date-range" className="text-sm font-medium">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-range"
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${!dateRange && "text-muted-foreground"}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex justify-end space-x-2 items-center"> {/* Updated for better alignment */}
            <Button onClick={handleClearFilters} variant="ghost" disabled={loading}>Clear Filters</Button>
            <Button onClick={fetchLeads} variant="outline" size="icon" disabled={loading} title="Refresh Leads">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button onClick={handleExportLeads} variant="outline" disabled={loading}>
                <Download className="mr-2 h-4 w-4" />
                Export as Excel
            </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Lead Management</CardTitle>
          <CardDescription>Review and respond to leads from the CRM.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No leads found with the current filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Project Interest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.phone || '-'}</TableCell>
                    <TableCell>{lead.projectOfInterest || '-'}</TableCell>
                    <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeClass(lead.status)}`}>
                             {lead.status.replace('_', ' ')}
                         </span>
                    </TableCell>
                    <TableCell>{isValid(new Date(lead.createdAt)) ? format(new Date(lead.createdAt), 'PP pp') : 'Invalid Date'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {lead.status === 'pending' && (
                          <>
                              <Button size="icon" onClick={() => handleResponse(lead.id, 'approved')} disabled={submitting[lead.id]} variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-100" title="Approve Lead">
                                {submitting[lead.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                              </Button>
                              <Button size="icon" onClick={() => handleResponse(lead.id, 'declined')} disabled={submitting[lead.id]} variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-100" title="Decline Lead">
                                {submitting[lead.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                              </Button>
                          </>
                      )}
                       {lead.status === 'approved' && (
                           <>
                            <Button size="icon" onClick={() => openCommentModal(lead)} variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-100" title="View/Add Comments">
                               <MessageSquare className="h-4 w-4" />
                           </Button>
                           <Button size="icon" onClick={() => handleResponse(lead.id, 'deal_won')} disabled={submitting[lead.id]} variant="ghost" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100" title="Mark as Deal Won">
                                {submitting[lead.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                           </Button>
                            <Button size="icon" onClick={() => handleResponse(lead.id, 'deal_loss')} disabled={submitting[lead.id]} variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-100" title="Mark as Deal Loss">
                                {submitting[lead.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
                           </Button>
                           {/* If you still want a generic 'closed' option for approved leads:
                           <Button size="icon" onClick={() => handleResponse(lead.id, 'closed')} disabled={submitting[lead.id]} variant="ghost" className="text-sky-600 hover:text-sky-700 hover:bg-sky-100" title="Mark as Closed Deal">
                                {submitting[lead.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}
                           </Button>
                           */}
                           </>
                       )}
                       {lead.status === 'declined' && (
                           <span className="text-xs text-muted-foreground italic px-2">Declined</span>
                       )}
                       {lead.status === 'closed' && ( // If you keep 'closed'
                           <span className="text-xs text-muted-foreground italic px-2">Deal Closed</span>
                       )}
                       {lead.status === 'deal_won' && (
                           <span className="text-xs text-emerald-700 italic px-2">Deal Won</span>
                       )}
                       {lead.status === 'deal_loss' && (
                           <span className="text-xs text-rose-700 italic px-2">Deal Loss</span>
                       )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {!loading && leads.length > 0 && (
           <CardFooter className="text-sm text-muted-foreground">
            Showing {leads.length} lead{leads.length !== 1 ? 's' : ''}.
           </CardFooter>
         )}
      </Card>

      {/* Comment Modal Dialog (keep as is) */}
      {selectedLeadForComments && (
        <Dialog open={isCommentModalOpen} onOpenChange={setIsCommentModalOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Comments for {selectedLeadForComments.name}</DialogTitle>
              <DialogDescription>
                View and add comments for this lead.
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
                      <p className="text-sm">{comment.comment_text}</p>
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
