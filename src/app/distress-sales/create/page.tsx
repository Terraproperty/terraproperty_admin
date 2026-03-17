'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MultiFileInput, type FilePreview } from '@/components/ui/multi-file-input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateDistressSalePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [marketPrice, setMarketPrice] = React.useState<number>(0);
  const [distressPrice, setDistressPrice] = React.useState<number>(0);
  const [discountPercentage, setDiscountPercentage] = React.useState<number>(0);
  const [selectedImages, setSelectedImages] = React.useState<FilePreview[]>([]);
  const [rareDealInput, setRareDealInput] = React.useState('');
  const [rareDealPoints, setRareDealPoints] = React.useState<string[]>([]);

  const calculateDiscount = React.useCallback(() => {
    if (marketPrice > 0 && distressPrice > 0 && distressPrice < marketPrice) {
      const discount = ((marketPrice - distressPrice) / marketPrice) * 100;
      setDiscountPercentage(Number(discount.toFixed(2)));
    } else {
      setDiscountPercentage(0);
    }
  }, [marketPrice, distressPrice]);

  React.useEffect(() => {
    calculateDiscount();
  }, [marketPrice, distressPrice, calculateDiscount]);

  const handleImagesChange = async (files: FilePreview[]) => {
    setSelectedImages(files);

    const filesToUpload = files.filter(f => !f.url);

    for (const filePreview of filesToUpload) {
      const formData = new FormData();
      formData.append('file', filePreview.file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();

        setSelectedImages(prev =>
          prev.map(p =>
            p === filePreview ? { ...p, uploading: false, url: data.filename } : p
          )
        );
      } catch (error) {
        setSelectedImages(prev =>
          prev.map(p =>
            p === filePreview ? { ...p, uploading: false, error: 'Failed to upload image' } : p
          )
        );
        console.error('Upload error:', error);
      }
    }
  };

  const handleRareDealKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = rareDealInput.trim();
      if (value && rareDealPoints.length < 4) {
        setRareDealPoints([...rareDealPoints, value]);
        setRareDealInput('');
      }
    }
  };

  const handleRemoveRareDealPoint = (idx: number) => {
    setRareDealPoints(rareDealPoints.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      heading: formData.get('heading'),
      images: selectedImages.filter(img => img.url).map(img => img.url).filter(Boolean) as string[],
      location: formData.get('location'),
      marketPrice: parseFloat(formData.get('marketPrice') as string),
      distressPrice: parseFloat(formData.get('distressPrice') as string),
      expiryDate: formData.get('expiryDate'),
      rareDealPoints,
    };

    try {
      const response = await fetch('/api/distress-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create listing');
      }

      toast({
        title: 'Success',
        description: 'Distress sale listing created successfully',
      });

      router.push('/distress-sales');
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/distress-sales">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Create Distress Sale Listing</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="heading" className="text-sm font-medium">
                  Heading <span className="text-red-500">*</span>
                </label>
                <Input
                  id="heading"
                  name="heading"
                  maxLength={100}
                  required
                  placeholder="Brief, attention-grabbing heading (max 100 characters)"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Property Images <span className="text-xs text-muted-foreground">(Up to 5 images)</span>
                </label>
                <MultiFileInput
                  onChange={handleImagesChange}
                  value={selectedImages}
                  maxFiles={5}
                  onClear={(index: number) => {
                    setSelectedImages(prev => prev.filter((_, i) => i !== index));
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location <span className="text-red-500">*</span>
                </label>
                <Input
                  id="location"
                  name="location"
                  required
                  placeholder="Property location"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Why This is a Rare Deal <span className="text-red-500">*</span>
                  <span className="block text-xs text-muted-foreground">Add up to 4 bullet points. Press Enter to add each point.</span>
                </label>
                <Input
                  type="text"
                  value={rareDealInput}
                  onChange={e => setRareDealInput(e.target.value)}
                  onKeyDown={handleRareDealKeyDown}
                  placeholder="Type a point and press Enter"
                  disabled={rareDealPoints.length >= 4}
                />
                <ul className="list-disc pl-5 space-y-1">
                  {rareDealPoints.map((point, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span>{point}</span>
                      <button
                        type="button"
                        className="ml-2 text-xs text-red-500 hover:underline"
                        onClick={() => handleRemoveRareDealPoint(idx)}
                        aria-label="Remove point"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                {rareDealPoints.length >= 4 && (
                  <div className="text-xs text-muted-foreground">Maximum 4 points allowed.</div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="marketPrice" className="text-sm font-medium">
                    Market Price <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="marketPrice"
                    name="marketPrice"
                    type="number"
                    min="0"
                    step="1000"
                    required
                    placeholder="Regular market price"
                    onChange={(e) => setMarketPrice(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="distressPrice" className="text-sm font-medium">
                    Distress Price <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="distressPrice"
                    name="distressPrice"
                    type="number"
                    min="0"
                    step="1000"
                    required
                    placeholder="Discounted distress price"
                    onChange={(e) => setDistressPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              {discountPercentage > 0 && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium">
                    Calculated Discount: {discountPercentage}%
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="expiryDate" className="text-sm font-medium">
                  Expiry Date & Time <span className="text-red-500">*</span>
                </label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="datetime-local"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Listing
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
