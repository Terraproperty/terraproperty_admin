'use client';

import * as React from 'react';
import { getProperties, updatePropertyStatus, type Property } from '@/services/crm';
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
import { ListPropertyForm } from '@/components/list-property';
import { BuilderPropertyForm } from '@/components/builder-property'; // Import your builder form
import { useState } from 'react';

export default function PropertiesPage() {
  const [tab, setTab] = useState<'authority' | 'builder'>('authority');
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [filter, setFilter] = React.useState<string>("all");
  const [loading, setLoading] = React.useState(true);
  const [editingProperty, setEditingProperty] = useState<any | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const { toast } = useToast();

  const fetchProperties = React.useCallback(
    async (statusFilter: string, currentTab = tab) => {
      setLoading(true);
      const projectName = currentTab === 'authority' ? 'authority' : 'not-authority';
      // Only add status param if not "all"
      const statusParam = statusFilter && statusFilter !== "all" ? `&status=${statusFilter}` : "";
      try {
        const res = await fetch(`/api/properties?projectName=${projectName}${statusParam}`);
        const data = await res.json();
        setProperties(data);
      } catch (error: any) {
        console.error("Failed to fetch properties:", error);
        toast({
          title: 'Error',
          description: `Failed to fetch properties: ${error.message || 'Please try again.'}`,
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

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };

  const handleStatusChange = async (propertyId: string, newStatus: Property['status']) => {
    try {
      await updatePropertyStatus(propertyId, newStatus);
      // Refresh the properties list after status update
      await fetchProperties(filter);
      toast({
        title: 'Success',
        description: 'Property status updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to update status: ${error.message || 'Please try again.'}`,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: Property['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'sold':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const [editBullets, setEditBullets] = useState<string[]>(editingProperty?.rareDealPoints || []);
  const [editImages, setEditImages] = useState<string[]>(editingProperty?.images || []);

  React.useEffect(() => {
    if (editingProperty) {
      setEditBullets(editingProperty.rareDealPoints || []);
      setEditImages(editingProperty.images || []);
    }
  }, [editingProperty]);

  const handleRemoveBullet = (idx: number) => {
    setEditBullets(editBullets.filter((_, i) => i !== idx));
  };

  const handleRemoveImage = (idx: number) => {
    setEditImages(editImages.filter((_, i) => i !== idx));
  };

  const handleEditSubmit = async (values: any) => {
    await fetch(`/api/properties?id=${editingProperty.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        rareDealPoints: editBullets,
        images: editImages,
      }),
    });
    setEditingProperty(null);
    fetchProperties(filter, tab);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Property Listings</h1>
        <Button onClick={() => fetchProperties(filter)} variant="outline" size="icon" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="sr-only">Refresh Properties</span>
        </Button>
      </div>
      <div className="mb-6">
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => handleFilterChange("all")}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => handleFilterChange("pending")}
            size="sm"
          >
            Pending
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => handleFilterChange("approved")}
            size="sm"
          >
            Approved
          </Button>
          <Button
            variant={filter === "declined" ? "default" : "outline"}
            onClick={() => handleFilterChange("declined")}
            size="sm"
          >
            Declined
          </Button>
          <Button
            variant={filter === "sold" ? "default" : "outline"}
            onClick={() => handleFilterChange("sold")}
            size="sm"
          >
            Sold
          </Button>
          <Button
            variant={tab === "authority" ? "default" : "outline"}
            onClick={() => setTab('authority')}
            size="sm"
          >
            Authority Projects
          </Button>
          <Button
            variant={tab === "builder" ? "default" : "outline"}
            onClick={() => setTab('builder')}
            size="sm"
          >
            Builder Projects
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading properties...</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Listed On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Exclusive</TableHead> {/* Add this */}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No properties found{filter !== 'all' ? ` for the "${filter}" filter` : ''}.
                </TableCell>
              </TableRow>
            ) : (
              properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">{property.propertyName}</TableCell>
                  <TableCell>{property.address}</TableCell>
                  <TableCell>${property.price.toLocaleString()}</TableCell>
                  <TableCell>{format(new Date(property.createdAt), 'PP')}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(property.status)}`}>
                      {property.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {property.exclusive ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        Exclusive
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                        -
                      </span>
                    )}
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
                          onClick={() => handleStatusChange(property.id, 'sold')}
                          disabled={property.status === 'sold'}
                        >
                          Mark as Sold
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            const res = await fetch(`/api/properties?id=${property.id}`);
                            const data = await res.json();
                                console.log('Edit property data:', data); // <-- Add this line for debugging

                            setEditingProperty(data);
                          }}
                        >
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
  onClick={() => setPropertyToDelete(property)}
  className="text-red-600 focus:text-red-700"
>
  Delete
</DropdownMenuItem>
<DropdownMenuItem
  onClick={async () => {
    await fetch(`/api/properties?id=${property.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exclusive: true }),
    });
    fetchProperties(filter, tab);
  }}
  disabled={property.exclusive}
>
  Mark as Exclusive
</DropdownMenuItem>
<DropdownMenuItem
  onClick={async () => {
    await fetch(`/api/properties?id=${property.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exclusive: false }),
    });
    fetchProperties(filter, tab);
  }}
  disabled={!property.exclusive}
>
  Remove from Exclusive
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
      {tab === 'builder' ? (
        <BuilderPropertyForm
          initialValues={{
            ...editingProperty,
            images: Array.isArray(editingProperty.images)
              ? editingProperty.images
              : (editingProperty.images ? JSON.parse(editingProperty.images) : []),
            rareDealPoints: Array.isArray(editingProperty.rareDealPoints)
              ? editingProperty.rareDealPoints
              : (editingProperty.rareDealPoints ? JSON.parse(editingProperty.rareDealPoints) : []),
          }}
          onSubmit={async (values) => {
            await fetch(`/api/properties?id=${editingProperty.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(values),
            });
            setEditingProperty(null);
            fetchProperties(filter, tab);
          }}
          onCancel={() => setEditingProperty(null)}
        />
      ) : (
        <ListPropertyForm
          initialValues={{
            ...editingProperty,
            images: Array.isArray(editingProperty.images)
              ? editingProperty.images
              : (editingProperty.images ? JSON.parse(editingProperty.images) : []),
            features: Array.isArray(editingProperty.features)
              ? editingProperty.features
              : (editingProperty.features ? JSON.parse(editingProperty.features) : []),
            idealFor: Array.isArray(editingProperty.idealFor)
              ? editingProperty.idealFor
              : (editingProperty.idealFor ? JSON.parse(editingProperty.idealFor) : []),
            additionalServices: Array.isArray(editingProperty.additionalServices)
              ? editingProperty.additionalServices
              : (editingProperty.additionalServices ? JSON.parse(editingProperty.additionalServices) : []),
          }}
          onSubmit={async (values) => {
            await fetch(`/api/properties?id=${editingProperty.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(values),
            });
            setEditingProperty(null);
            fetchProperties(filter, tab);
          }}
        />
      )}
    </div>
  </div>
)}

      {propertyToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Delete Property</h2>
            <p className="mb-6">
              Are you sure you want to delete <span className="font-bold">{propertyToDelete.propertyName}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPropertyToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    await fetch(`/api/properties?id=${propertyToDelete.id}`, { method: 'DELETE' });
                    setPropertyToDelete(null);
                    fetchProperties(filter);
                  } catch (error) {
                    alert('Failed to delete property.');
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
