'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RentPropertyForm } from '@/components/rent-property';

export default function RentPropertiesPage() {
  const [tab, setTab] = React.useState<'authority' | 'builder'>('authority');
  const [properties, setProperties] = React.useState<any[]>([]);
  const [filter, setFilter] = React.useState<string>("all");
  const [loading, setLoading] = React.useState(true);
  const [propertyToDelete, setPropertyToDelete] = React.useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [editingProperty, setEditingProperty] = React.useState<any | null>(null);
  const { toast } = useToast();

  const fetchProperties = React.useCallback(
    async (statusFilter: string, currentTab = tab) => {
      setLoading(true);
      const projectName = currentTab === 'authority' ? 'authority' : 'not-authority';
      const statusParam = statusFilter && statusFilter !== "all" ? `&status=${statusFilter}` : "";
      try {
        const res = await fetch(`/api/rent-properties?projectName=${projectName}${statusParam}`);
        const data = await res.json();
        setProperties(data);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: `Failed to fetch rent properties: ${error.message || 'Please try again.'}`,
          variant: 'destructive',
        });
        setProperties([]);
      } finally {
        setLoading(false);
      }
    },
    [toast, tab]
  );

  React.useEffect(() => {
    fetchProperties(filter, tab);
  }, [fetchProperties, filter, tab]);

  const handleFilterChange = (newFilter: string) => setFilter(newFilter);

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    try {
      await fetch(`/api/rent-properties?id=${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchProperties(filter, tab);
      toast({ title: 'Success', description: 'Rent property status updated.' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to update status: ${error.message || 'Please try again.'}`,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!propertyId) return;
    try {
      await fetch(`/api/rent-properties?id=${propertyId}`, {
        method: 'DELETE',
      });
      setPropertyToDelete(null);
      setShowDeleteModal(false);
      await fetchProperties(filter, tab);
      toast({ title: 'Deleted', description: 'Rent property deleted.' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to delete property: ${error.message || 'Please try again.'}`,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'rented':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rent Property Listings</h1>
        <Button onClick={() => fetchProperties(filter, tab)} variant="outline" size="icon" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="sr-only">Refresh Properties</span>
        </Button>
      </div>
      <div className="mb-6">
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => handleFilterChange("all")} size="sm">All</Button>
          <Button variant={filter === "pending" ? "default" : "outline"} onClick={() => handleFilterChange("pending")} size="sm">Pending</Button>
          <Button variant={filter === "approved" ? "default" : "outline"} onClick={() => handleFilterChange("approved")} size="sm">Approved</Button>
          <Button variant={filter === "declined" ? "default" : "outline"} onClick={() => handleFilterChange("declined")} size="sm">Declined</Button>
          <Button variant={filter === "rented" ? "default" : "outline"} onClick={() => handleFilterChange("rented")} size="sm">Rented</Button>
          {/* <Button variant={tab === "authority" ? "default" : "outline"} onClick={() => setTab('authority')} size="sm">Authority Projects</Button>
          <Button variant={tab === "builder" ? "default" : "outline"} onClick={() => setTab('builder')} size="sm">Builder Projects</Button> */}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading rent properties...</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Price</TableHead>
              {/* <TableHead>Listed On</TableHead> */}
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No rent properties found{filter !== 'all' ? ` for the "${filter}" filter` : ''}.
                </TableCell>
              </TableRow>
            ) : (
              properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">{property.propertyName}</TableCell>
                  <TableCell>{property.address}</TableCell>
                  <TableCell>₹{property.price}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(property.status)}`}>
                      {property.status}
                    </span>
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
                          onClick={() => handleStatusChange(property.id, 'pending')}
                          disabled={property.status === 'pending'}
                        >
                          Mark as Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(property.id, 'approved')}
                          disabled={property.status === 'approved'}
                        >
                          Mark as Approved
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(property.id, 'declined')}
                          disabled={property.status === 'declined'}
                        >
                          Mark as Declined
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(property.id, 'rented')}
                          disabled={property.status === 'rented'}
                        >
                          Mark as Rented
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setPropertyToDelete(property);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 focus:text-red-700"
                        >
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            const res = await fetch(`/api/rent-properties?id=${property.id}`);
                            const data = await res.json();
                            setEditingProperty(data);
                          }}
                        >
                          Edit Details
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

      {showDeleteModal && propertyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">Delete Rent Property</h2>
            <p className="mb-4">Are you sure you want to delete <b>{propertyToDelete.propertyName}</b>?</p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setPropertyToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await handleDelete(propertyToDelete.id);
                  setShowDeleteModal(false);
                  setPropertyToDelete(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div
            className="relative w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            <Button
              type="button"
              onClick={() => setEditingProperty(null)}
              className="absolute top-2 right-2"
              variant="ghost"
              size="icon"
              aria-label="Close edit form"
            >
              X
            </Button>
            <RentPropertyForm
              initialValues={editingProperty}
              onSubmit={async (values) => {
                await fetch(`/api/rent-properties?id=${editingProperty.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(values),
                });
                setEditingProperty(null);
                fetchProperties(filter, tab);
              }}
              onCancel={() => setEditingProperty(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}