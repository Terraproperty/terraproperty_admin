'use client';

import * as React from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, MoreHorizontal, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DistressSale {
  id: string;
  heading: string;
  description: string;
  images: string[];
  propertyName: string;
  location: string;
  market_price: number;
  distress_price: number;
  expiryDate: string;
  status: 'live' | 'sold' | 'expired';
  createdAt: string;
}

export default function DistressSalesPage() {
  const [sales, setSales] = React.useState<DistressSale[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchSales = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/distress-sales');
      if (!response.ok) throw new Error('Failed to fetch sales');
      const data = await response.json();
      const mapped = data.map((sale: any) => ({
        ...sale,
        expiryDate: sale.expiry_date,
        createdAt: sale.createdAt || sale.created_at,
        images: Array.isArray(sale.images) ? sale.images : JSON.parse(sale.images || '[]'),
      }));
      setSales(mapped);
    } catch (error: any) {
      console.error('Failed to fetch sales:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch sales: ${error.message || 'Please try again.'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleStatusChange = async (id: string, newStatus: 'live' | 'sold' | 'expired') => {
    try {
      const response = await fetch(`/api/distress-sales?id=${id}`, {
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

      fetchSales();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to update status: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'sold':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateDiscount = (marketPrice: number, distressPrice: number) => {
    return Number((((marketPrice - distressPrice) / marketPrice) * 100).toFixed(1));
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Distress Sales</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchSales} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="sr-only">Refresh Sales</span>
          </Button>
          <Button asChild>
            <Link href="/distress-sales/create">
              <Plus className="h-4 w-4 mr-2" />
              Add New Listing
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading sales...</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Market Price</TableHead>
              <TableHead>Distress Price</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Listed On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No distress sales found.
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {sale.images && sale.images.length > 0 && (
                        <div className="flex space-x-1">
                          {sale.images.slice(0, 3).map((img: string, idx: number) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Property image ${idx + 1}`}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ))}
                          {sale.images.length > 3 && (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-sm text-muted-foreground">
                              +{sale.images.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{sale.propertyName}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">{sale.heading}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{sale.location}</TableCell>
                  <TableCell>{formatPrice(sale.market_price)}</TableCell>
                  <TableCell>{formatPrice(sale.distress_price)}</TableCell>
                  <TableCell>
                    {calculateDiscount(sale.market_price, sale.distress_price)}%
                  </TableCell>
                  <TableCell>
                    <div>{format(new Date(sale.expiryDate), 'PP')}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(sale.expiryDate), 'p')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(sale.status)}`}>
                      {sale.status}
                    </span>
                  </TableCell>
                  <TableCell>{format(new Date(sale.createdAt), 'PP')}</TableCell>
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
                          onClick={() => handleStatusChange(sale.id, 'live')}
                          disabled={sale.status === 'live'}
                        >
                          Mark as Live
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(sale.id, 'sold')}
                          disabled={sale.status === 'sold'}
                        >
                          Mark as Sold
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(sale.id, 'expired')}
                          disabled={sale.status === 'expired'}
                        >
                          Mark as Expired
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
