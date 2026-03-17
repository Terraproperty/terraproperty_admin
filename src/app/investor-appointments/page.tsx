'use client';

import * as React from 'react';
// Ensure InvestorAppointment type in inquiries.ts no longer expects company or preferred_time if they are fully removed
import { getInvestorAppointments, type InvestorAppointment } from '@/services/inquiries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { format, isValid, parse } from 'date-fns';

export default function InvestorAppointmentsPage() {
  const [appointments, setAppointments] = React.useState<InvestorAppointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedAppointment, setSelectedAppointment] = React.useState<InvestorAppointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = React.useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    try {
      const response = await fetch(`/api/investor-appointments?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update status' }));
        throw new Error(errorData.error || errorData.message ||'Failed to update status');
      }

      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });
      fetchAppointments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to update status: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const fetchAppointments = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInvestorAppointments();
      setAppointments(data);
      console.log('Fetched appointments:', data);
    } catch (error: any) {
      console.error('Failed to fetch appointments:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch appointments: ${error.message || 'Please try again.'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: // pending
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  // Helper to format preferredTime safely - This might become unused if preferred_time is fully removed from data
  // For now, keeping it in case the InvestorAppointment type might still have it from other sources.
  // If appointment.preferred_time is guaranteed to be undefined/null, this function will always return 'N/A'.
  const formatPreferredTime = (timeString: string | null | undefined) => {
    if (!timeString) {
      return 'N/A';
    }
    try {
      const date = parse(timeString, 'HH:mm:ss', new Date());
      if (isValid(date)) {
        return format(date, 'p');
      }
      return 'Invalid Time';
    } catch (e) {
      console.error("Error formatting time:", timeString, e);
      return 'Invalid Time';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Investor Appointments</h1>
        <Button onClick={fetchAppointments} variant="outline" size="icon" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="sr-only">Refresh Appointments</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading appointments...</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              {/* <TableHead>Company</TableHead> Removed */}
              <TableHead>Investment Range</TableHead>
              <TableHead>Preferred Date</TableHead> {/* Changed from "Appointment" to "Preferred Date" */}
              <TableHead>Interests</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground"> {/* Adjusted colSpan from 9 to 8 */}
                  No appointments found.
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">{appointment.name}</TableCell>
                  <TableCell>
                    <div>{appointment.email}</div>
                    <div className="text-sm text-muted-foreground">{appointment.phone || 'No phone'}</div>
                  </TableCell>
                  {/* <TableCell>{appointment.company || 'Not specified'}</TableCell> Removed */}
                  <TableCell>{appointment.investment_range || 'Not specified'}</TableCell>
                  <TableCell>
                    <div>
                      {appointment.preferred_date ? format(new Date(appointment.preferred_date), 'PP') : 'N/A'}
                    </div>
                    {/* Removed preferred_time display
                    <div className="text-sm text-muted-foreground">
                      {formatPreferredTime(appointment.preferred_time)}
                    </div>
                    */}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {appointment.investment_interests || 'Not specified'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </TableCell>
                  <TableCell>{appointment.createdAt ? format(new Date(appointment.createdAt), 'PP') : 'N/A'}</TableCell>
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
                          onClick={() => handleStatusChange(appointment.id, 'pending')}
                          disabled={appointment.status === 'pending'}
                        >
                          Mark as Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                          disabled={appointment.status === 'confirmed'}
                        >
                          Mark as Confirmed
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(appointment.id, 'completed')}
                          disabled={appointment.status === 'completed'}
                        >
                          Mark as Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                          disabled={appointment.status === 'cancelled'}
                        >
                          Mark as Cancelled
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowDetailsModal(true);
                          }}
                        >
                          View Full Details
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

      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Investor Appointment Details</h2>
            <div className="space-y-2 text-sm">
              <div><b>Name:</b> {selectedAppointment.name}</div>
              <div><b>Email:</b> {selectedAppointment.email}</div>
              <div><b>Phone:</b> {selectedAppointment.phone || 'N/A'}</div>
              <div><b>Investment Range:</b> {selectedAppointment.investment_range || 'N/A'}</div>
              <div><b>Preferred Date:</b> {selectedAppointment.preferred_date ? format(new Date(selectedAppointment.preferred_date), 'PP') : 'N/A'}</div>
              <div><b>Interests:</b> {selectedAppointment.investment_interests || 'N/A'}</div>
              <div><b>Status:</b> {selectedAppointment.status}</div>
              <div><b>Created:</b> {selectedAppointment.createdAt ? format(new Date(selectedAppointment.createdAt), 'PP') : 'N/A'}</div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedAppointment(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
