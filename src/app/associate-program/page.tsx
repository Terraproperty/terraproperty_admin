'use client';

import * as React from 'react';
import { getAssociateProgramEntries, updateAssociateProgramEntryStatus, type getAssociateProgram as GetAssociateProgramType } from '@/services/inquiries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Import Input
import { Loader2, RefreshCw, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isYesterday, parseISO } from 'date-fns'; // Import date-fns helpers

export type LocalAssociateProgram = {
  id: string;
  full_name: string;
  email_address: string;
  mobile_number: string;
  highest_qualification?: string;
  confirmation: string; // Will store 'approved', 'rejected', 'unknown'
  created_at?: string;
  user_id?: string;
  password?: string;
  // ...other fields as needed
};

export default function AssociateProgramPage() {
  const [allEntries, setAllEntries] = React.useState<LocalAssociateProgram[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeView, setActiveView] = React.useState<'today' | 'yesterday' | 'older'>('today');

  const handleStatusChange = async (id: string, newStatus: '1' | '0' | '3') => {
    try {
      await updateAssociateProgramEntryStatus(id, newStatus);
      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });
      fetchEntries(); // Refresh entries to show updated status
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to update status: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const fetchEntries = React.useCallback(async () => {
    setLoading(true);
    try {
      const data: GetAssociateProgramType[] = await getAssociateProgramEntries();
      console.log('getAssociateProgramEntries response:', data);

      const sortedData = data.sort((a, b) => {
        const dateA = a.created_at ? parseISO(a.created_at).getTime() : 0;
        const dateB = b.created_at ? parseISO(b.created_at).getTime() : 0;
        if (dateA === 0 && dateB === 0) return 0;
        if (dateA === 0) return 1;
        if (dateB === 0) return -1;
        return dateB - dateA; // Newest first
      });

      const normalized = sortedData.map((entry) => ({
        ...entry,
        mobile_number: entry.mobile_number ?? '',
        confirmation:
          Number(entry.confirmation) === 1
            ? 'approved'
            : Number(entry.confirmation) === 0
            ? 'approved'
            : Number(entry.confirmation) === 3
            ? 'rejected'
            : 'unknown',
        user_id: entry.user_id,
        password: entry.password,
      }));

      setAllEntries(normalized);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to fetch associate program entries: ${error.message || 'Please try again.'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const displayedEntries = React.useMemo(() => {
    let processedEntries = allEntries;

    if (searchQuery) {
      processedEntries = processedEntries.filter(entry =>
        entry.mobile_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const todayEntries = processedEntries.filter(entry => entry.created_at && isToday(parseISO(entry.created_at)));
    const yesterdayEntries = processedEntries.filter(entry => entry.created_at && isYesterday(parseISO(entry.created_at)));
    const olderEntries = processedEntries.filter(entry =>
      entry.created_at && !isToday(parseISO(entry.created_at)) && !isYesterday(parseISO(entry.created_at))
    );

    if (activeView === 'today') {
      return todayEntries;
    } else if (activeView === 'yesterday') {
      return yesterdayEntries;
    } else { // activeView === 'older'
      return olderEntries;
    }
  }, [allEntries, searchQuery, activeView]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Associate Program Entries</h1>
        <Button onClick={fetchEntries} variant="outline" size="icon" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="sr-only">Refresh Entries</span>
        </Button>
      </div>

      <Input
        type="text"
        placeholder="Search by phone number..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          // setActiveView('today'); // Optionally reset to today's view on new search
        }}
        className="mb-4 max-w-sm"
      />

      <div className="flex space-x-2 mb-4">
        <Button onClick={() => setActiveView('today')} variant={activeView === 'today' ? 'default' : 'outline'}>
          Today
        </Button>
        <Button onClick={() => setActiveView('yesterday')} variant={activeView === 'yesterday' ? 'default' : 'outline'}>
          Yesterday
        </Button>
        <Button onClick={() => setActiveView('older')} variant={activeView === 'older' ? 'default' : 'outline'}>
          Older Entries
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading entries...</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Qualifications</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No entries found for this view{searchQuery && ' with the current search'}.
                </TableCell>
              </TableRow>
            ) : (
              displayedEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.full_name}</TableCell>
                  <TableCell>{entry.email_address}</TableCell>
                  <TableCell>{entry.mobile_number || 'N/A'}</TableCell>
                  <TableCell>{entry.highest_qualification || 'N/A'}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        entry.confirmation === 'approved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          // The 'pending' style might not be used if your normalization doesn't produce 'pending'
                          : entry.confirmation === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          : entry.confirmation === 'rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                      }`}
                    >
                      {entry.confirmation}
                    </span>
                  </TableCell>
                  <TableCell>
                    {entry.created_at ? format(parseISO(entry.created_at), 'PPpp') : 'N/A'}
                  </TableCell>
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
                          onClick={() => handleStatusChange(entry.id, '0')} // API '0' for approve
                          disabled={entry.confirmation === 'approved'}
                        >
                          Mark as Approved
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(entry.id, '3')} // API '3' for reject
                          disabled={entry.confirmation === 'rejected'}
                        >
                          Mark as Rejected
                        </DropdownMenuItem>
                        {/* If API '1' is for pending, and it's displayed as 'approved', this button might be complex.
                            Assuming API '1' should result in a 'pending' display if it were a distinct state.
                            Given current normalization (API 1 -> display 'approved'), this button will behave like "Mark as Approved".
                        */}
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(entry.id, '1')} // API '1'
                          disabled={entry.confirmation === 'approved'} // Disabled if current display is 'approved'
                        >
                          Mark as Pending (API status 1)
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
    </div>
  );
}
