'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

interface SiteVisit {
  id: number;
  lead_id: string;
  visit_date: string;
  status: 'scheduled' | 'confirmed' | 'cancelled';
  notes?: string | null;
  created_at: string;
}

export default function SiteVisitPage() {
  const [siteVisits, setSiteVisits] = React.useState<SiteVisit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    leadId: '',
    visitDate: '',
    notes: '',
  });
  const { toast } = useToast();

  const fetchSiteVisits = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/site-visit');
      if (!res.ok) throw new Error('Failed to fetch site visits');
      const data: SiteVisit[] = await res.json();
      setSiteVisits(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch site visits',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchSiteVisits();
  }, [fetchSiteVisits]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leadId || !formData.visitDate) {
      toast({
        title: 'Validation Error',
        description: 'Lead ID and Visit Date are required.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const res = await fetch('/api/site-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: formData.leadId,
          visitDate: formData.visitDate,
          notes: formData.notes || undefined,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to schedule site visit');
      }
      toast({
        title: 'Success',
        description: 'Site visit scheduled successfully.',
      });
      setFormData({ leadId: '', visitDate: '', notes: '' });
      fetchSiteVisits();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule site visit',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (id: number, newStatus: 'scheduled' | 'confirmed' | 'cancelled') => {
    try {
      const res = await fetch('/api/site-visit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      toast({
        title: 'Success',
        description: `Site visit status updated to ${newStatus}.`,
      });
      fetchSiteVisits();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Scheduled Site Visits</h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <Label htmlFor="leadId">Lead ID</Label>
          <Input
            id="leadId"
            name="leadId"
            value={formData.leadId}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="visitDate">Visit Date</Label>
          <Input
            id="visitDate"
            name="visitDate"
            type="datetime-local"
            value={formData.visitDate}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="w-full rounded-md border border-gray-300 p-2"
            rows={3}
          />
        </div>
        <Button type="submit">Schedule Site Visit</Button>
      </form>

      <div>
        {loading ? (
          <p>Loading site visits...</p>
        ) : siteVisits.length === 0 ? (
          <p>No site visits found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Lead ID</TableHead>
                <TableHead>Visit Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {siteVisits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell>{visit.id}</TableCell>
                  <TableCell>{visit.lead_id}</TableCell>
                  <TableCell>{format(new Date(visit.visit_date), 'PPpp')}</TableCell>
                  <TableCell>{visit.status}</TableCell>
                  <TableCell>{visit.notes || '-'}</TableCell>
                  <TableCell>{format(new Date(visit.created_at), 'PPpp')}</TableCell>
                  <TableCell className="space-x-2">
                    {visit.status !== 'confirmed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(visit.id, 'confirmed')}
                      >
                        Confirm
                      </Button>
                    )}
                    {visit.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusChange(visit.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
