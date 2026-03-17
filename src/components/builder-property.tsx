'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { X } from 'lucide-react';

// Define mapping of category to types
const PROPERTY_TYPE_OPTIONS: Record<string, string[]> = {
  Residential: ['Apartments / Flats', 'Independent Villas', 'Residential Plots', 'Studio Apartments','Pant Houses'],
  Commercial: ['Retail Shops & Showrooms', 'Office Spaces','SCOs (Shop-cum-Office)','Food Courts','Pre-Leased Commercial Units','Commercial Plots'],
  
  Institutional: [ 'School Land / Building',
    'Hospitals / Nursing Homes',
    'Coaching Center Plots',
    'NGO / Trust Land',
    'Community Hall'],
  "Mixed Use": ['Integrated Townships', 'HIgh Street Retail', 'Mixed-Use Developments'],
};

const builderPropertyFormSchema = z.object({
  propertyName: z.string().min(3, { message: 'Property name must be at least 3 characters.' }),
  address: z.string().min(10, { message: 'Address must be at least 10 characters.' }),
  price: z.string().min(1, { message: 'Enter price (e.g., 2 Cr).' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }).max(500, { message: 'Description cannot exceed 500 characters.'}),
  contactNumber: z.string().regex(/^[+]?\d{10,15}$/, { message: 'Invalid phone number format.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  propertyType: z.string().min(1, { message: 'Select property type.' }),
  propertyCategory: z.string().min(1, { message: 'Select property category.' }),
  projectName: z.string().min(1, { message: 'Enter project name.' }),
  location: z.string().min(1, { message: 'Enter location.' }),
  coordinates: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
  details: z.string().min(10, { message: 'Details must be at least 10 characters.' }),
  features: z.array(z.string()).min(1, { message: 'Add at least one feature.' }),
  idealFor: z.array(z.string()).min(1, { message: 'Add at least one ideal for.' }),
  additionalServices: z.array(z.string()).optional(),
  status: z.string().min(1, { message: 'Select status.' }),
  city: z.string().min(2, { message: 'Enter city.' }),
  brochure: z.string().optional(), // Will store the uploaded PDF filename or URL
  isReraApproved: z.boolean().optional(),
});

export type BuilderPropertyFormValues = z.infer<typeof builderPropertyFormSchema> & {
  images?: string[];
};

export interface BuilderPropertyFormProps {
  initialValues: any;
  onSubmit: (values: BuilderPropertyFormValues) => Promise<void>;
  onCancel: () => void;
}

export function BuilderPropertyForm({ onSubmit, initialValues }: BuilderPropertyFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [idealFor, setIdealFor] = useState<string[]>([]);
  const [idealForInput, setIdealForInput] = useState('');
  const [additionalServices, setAdditionalServices] = useState<string[]>([]);
  const [additionalServiceInput, setAdditionalServiceInput] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [brochureUploading, setBrochureUploading] = useState(false);
  const [brochureUrl, setBrochureUrl] = useState<string | null>(null);

  const form = useForm<BuilderPropertyFormValues>({
    resolver: zodResolver(builderPropertyFormSchema),
    defaultValues: {
      propertyName: '',
      address: '',
      price: '',
      description: '',
      contactNumber: '',
      email: '',
      propertyType: '',
      propertyCategory: '',
      projectName: '',
      location: '',
      coordinates: undefined,
      details: '',
      features: [],
      idealFor: [],
      additionalServices: [],
      status: '',
      city: '',
    },
  });

  React.useEffect(() => {
    if (initialValues) {
      setFeatures(initialValues.features ?? []);
      setIdealFor(initialValues.idealFor ?? []);
      setAdditionalServices(initialValues.additionalServices ?? []);
      setImagePaths(initialValues.images ?? []);
      setImagePreviews((initialValues.images ?? []).map((img: string) => typeof img === 'string' && img.startsWith('blob:') ? img : img));
      setCoordinates(initialValues.coordinates ?? (initialValues.coordinates_lat && initialValues.coordinates_lng ? { lat: initialValues.coordinates_lat, lng: initialValues.coordinates_lng } : null));
      if (initialValues.brochure) setBrochureUrl(initialValues.brochure);
      // Prefill all scalar fields in the form
      form.reset({
        ...form.getValues(),
        ...initialValues,
        coordinates: initialValues.coordinates ?? (initialValues.coordinates_lat && initialValues.coordinates_lng ? { lat: initialValues.coordinates_lat, lng: initialValues.coordinates_lng } : undefined),
        features: initialValues.features ?? [],
        idealFor: initialValues.idealFor ?? [],
        additionalServices: initialValues.additionalServices ?? [],
        images: initialValues.images ?? [],
        brochure: initialValues.brochure ?? '',
      });
    }
  }, [initialValues]);

  const handleFormSubmit = async (values: BuilderPropertyFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...values,
        features,
        idealFor,
        additionalServices,
        coordinates: coordinates ?? undefined,
        images: imagePaths,
        brochure: brochureUrl ?? undefined, // Add this line
      });
      form.reset();
      setFeatures([]);
      setIdealFor([]);
      setAdditionalServices([]);
      setCoordinates(null);
      setImageFiles([]);
      setImagePreviews([]);
      setImagePaths([]);
      setImageError(null);
    } catch (error) {
      console.error('Submission error in form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput('');
      form.setValue('features', [...features, featureInput.trim()]);
    }
  };
  const handleAddIdealFor = () => {
    if (idealForInput.trim()) {
      setIdealFor([...idealFor, idealForInput.trim()]);
      setIdealForInput('');
      form.setValue('idealFor', [...idealFor, idealForInput.trim()]);
    }
  };
  const handleAddAdditionalService = () => {
    if (additionalServiceInput.trim()) {
      setAdditionalServices([...additionalServices, additionalServiceInput.trim()]);
      setAdditionalServiceInput('');
      form.setValue('additionalServices', [...additionalServices, additionalServiceInput.trim()]);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        form.setValue('coordinates', { lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  };

  // Fetch suggestions from Nominatim (OpenStreetMap) API, bias to India
  const fetchLocationSuggestions = async (query: string) => {
    if (!query) return setLocationSuggestions([]);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=IN&q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setLocationSuggestions(data);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length + imageFiles.length > 5) {
      setImageError('You can upload up to 5 images.');
      return;
    }
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setImageError('Each image must be less than 10MB.');
        return;
      }
    }
    // Upload images to /api/upload and get paths
    const newImagePaths: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        // console.log('Image upload response:', data);
        if (data.filename) {
          newImagePaths.push(data.filename);
        }
      } catch (err) {
        setImageError('Failed to upload image.');
        return;
      }
    }
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    setImagePaths(prev => [...prev, ...newImagePaths]);
  };

  const handleRemoveImage = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    setImagePaths(prev => prev.filter((_, i) => i !== idx));
  };

  const handleBrochureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setImageError('Only PDF files are allowed for brochure.');
      return;
    }
    setBrochureUploading(true);
    const formData = new FormData();
    formData.append('jdPdf', file); // /api/jobs expects 'jdPdf'

    // Log the file and FormData content
    console.log('Uploading brochure file:', file);
    for (let [key, value] of Array.from(formData.entries())) {
      console.log('FormData entry:', key, value);
    }

    try {
      const res = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Brochure upload failed');
      const data = await res.json();
      console.log('Brochure upload response:', data);
      if (data.filePath) {
        setBrochureUrl(data.filePath);
        form.setValue('brochure', data.filePath);
        console.log('Brochure uploaded successfully:', data.filePath);
      }
    } catch (err) {
      setImageError('Failed to upload brochure.');
    } finally {
      setBrochureUploading(false);
    }
  };

  return (
    <Form {...form}>
      <div className="flex justify-end mb-4">
        {/* <Button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} variant="outline">
          Switch to {theme === 'dark' ? 'Light' : 'Dark'} Theme
        </Button> */}
      </div>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg max-w-2xl mx-auto border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">List Your Builder Property</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="propertyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Builder Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Builder Name" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="projectName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Green Valley Project" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="propertyCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Category</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    disabled={isSubmitting}
                    className="w-full border rounded px-3 py-2"
                    onChange={e => {
                      field.onChange(e);
                      setSelectedCategory(e.target.value);
                      // Optionally reset propertyType when category changes
                      form.setValue('propertyType', '');
                    }}
                  >
                    <option value="">Select category</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Mixed Use">Mixed Use</option>
                    {/* <option value="Industrial">Industrial</option>
                    <option value="Agricultural">Agricultural</option>
                    <option value="Semi-Commercial">Semi-Comercial</option> */}
                    <option value="Institutional">Institutional</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="propertyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Type</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    disabled={isSubmitting || !form.watch('propertyCategory')}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select type</option>
                    {(PROPERTY_TYPE_OPTIONS[form.watch('propertyCategory')] || []).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Status</FormLabel>
                <FormControl>
                  <select {...field} disabled={isSubmitting} className="w-full border rounded px-3 py-2">
                    <option value="">Select status</option>
                    <option value="Ready to Move">Ready to Move</option>
                    <option value="Under Construction">Under Construction</option>
                    <option value="Empty Plot">Empty Plots</option>

                    <option value="Sold">Sold</option>
                    <option value="Pending">Pending</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 2 Cr" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    disabled={isSubmitting}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select city</option>
                    <option value="Greater Noida">Greater Noida</option>
                    <option value="Noida">Noida</option>
                    <option value="YEIDA">YEIDA</option>
                    <option value="Greater Noida West">Greater Noida West</option>
                    <option value="Others">Others</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type location"
                      {...field}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        field.onChange(e);
                        fetchLocationSuggestions(e.target.value);
                      }}
                    />
                    <Button type="button" onClick={handleGetLocation} disabled={isSubmitting} variant="outline">
                      Use Current Location
                    </Button>
                  </div>
                </FormControl>
                {coordinates && (
                  <div className="text-xs text-gray-500 mt-1">
                    Lat: {coordinates.lat}, Lng: {coordinates.lng}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
  control={form.control}
  name="isReraApproved"
  render={({ field }) => (
    <FormItem className="flex items-center space-x-2 mt-2">
      <FormControl>
        <input
          type="checkbox"
          checked={field.value ?? false}
          onChange={e => field.onChange(e.target.checked)}
          className="h-4 w-4"
        />
      </FormControl>
      <FormLabel className="mb-0">Is this property RERA approved?</FormLabel>
    </FormItem>
  )}
/>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Full Address</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 123 Main St, Anytown, USA 12345" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="e.g., +15551234567" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="e.g., agent@example.com" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the property features, size, amenities, etc."
                  className="resize-none min-h-[80px]"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Details</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add more details about the property, legal info, etc."
                  className="resize-none min-h-[80px]"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Features dynamic list */}
        <div>
          <FormLabel>Features</FormLabel>
          <div className="flex gap-2 mt-1">
            <Input
              value={featureInput}
              onChange={e => setFeatureInput(e.target.value)}
              placeholder="Add feature"
              disabled={isSubmitting}
              className="flex-1"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFeature();
                }
              }}
            />
            <Button type="button" onClick={handleAddFeature} disabled={isSubmitting} variant="secondary">Add</Button>
          </div>
          <ul className="list-disc list-inside mt-2 text-gray-700">
            {features.map((f, i) => (
              <li key={i} className="flex items-center">
                {f}
                <button
                  type="button"
                  onClick={() => {
                    setFeatures(features.filter((_, idx) => idx !== i));
                    form.setValue('features', features.filter((_, idx) => idx !== i));
                  }}
                  className="ml-2 text-xs text-red-500 hover:underline"
                  aria-label="Remove feature"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* Ideal For dynamic list */}
        <div>
          <FormLabel>Ideal For</FormLabel>
          <div className="flex gap-2 mt-1">
            <Input
              value={idealForInput}
              onChange={e => setIdealForInput(e.target.value)}
              placeholder="Add ideal for"
              disabled={isSubmitting}
              className="flex-1"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddIdealFor();
                }
              }}
            />
            <Button type="button" onClick={handleAddIdealFor} disabled={isSubmitting} variant="secondary">Add</Button>
          </div>
          <ul className="list-disc list-inside mt-2 text-gray-700">
            {idealFor.map((f, i) => (
              <li key={i} className="flex items-center">
                {f}
                <button
                  type="button"
                  onClick={() => {
                    setIdealFor(idealFor.filter((_, idx) => idx !== i));
                    form.setValue('idealFor', idealFor.filter((_, idx) => idx !== i));
                  }}
                  className="ml-2 text-xs text-red-500 hover:underline"
                  aria-label="Remove ideal for"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* Additional Services dynamic list */}
        <div>
          <FormLabel>Additional Services</FormLabel>
          <div className="flex gap-2 mt-1">
            <Input
              value={additionalServiceInput}
              onChange={e => setAdditionalServiceInput(e.target.value)}
              placeholder="Add additional service"
              disabled={isSubmitting}
              className="flex-1"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAdditionalService();
                }
              }}
            />
            <Button type="button" onClick={handleAddAdditionalService} disabled={isSubmitting} variant="secondary">Add</Button>
          </div>
          <ul className="list-disc list-inside mt-2 text-gray-700">
            {additionalServices.map((f, i) => (
              <li key={i} className="flex items-center">
                {f}
                <button
                  type="button"
                  onClick={() => {
                    setAdditionalServices(additionalServices.filter((_, idx) => idx !== i));
                    form.setValue('additionalServices', additionalServices.filter((_, idx) => idx !== i));
                  }}
                  className="ml-2 text-xs text-red-500 hover:underline"
                  aria-label="Remove additional service"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* Property Images Upload */}
        <div>
          <FormLabel>Property Images (up to 5, max 10MB each)</FormLabel>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={isSubmitting || imageFiles.length >= 5}
            onChange={handleImageChange}
            className="block mt-2"
          />
          {imageError && <div className="text-red-500 text-sm mt-1">{imageError}</div>}
          <div className="flex flex-wrap gap-4 mt-2">
            {imagePreviews.map((src, idx) => (
              <div key={idx} className="relative w-24 h-24 border rounded overflow-hidden">
                <img src={src} alt={`Property ${idx + 1}`} className="object-cover w-full h-full" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-80"
                  aria-label="Remove image"
                  disabled={isSubmitting}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
        {/* Brochure PDF Upload */}
        <FormField
          control={form.control}
          name="brochure"
          render={() => (
            <FormItem>
              <FormLabel>Brochure PDF</FormLabel>
              <FormControl>
                <input
                  type="file"
                  accept="application/pdf"
                  disabled={isSubmitting || brochureUploading}
                  onChange={handleBrochureChange}
                />
              </FormControl>
              {brochureUploading && <div className="text-blue-500 text-sm mt-1">Uploading brochure...</div>}
              {brochureUrl && (
                <div className="text-green-600 text-sm mt-1">
                  Brochure uploaded: <a href={brochureUrl} target="_blank" rel="noopener noreferrer">{brochureUrl}</a>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full mt-6 font-semibold text-lg" disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'List Builder Property'
          )}
        </Button>
      </form>
    </Form>
  );
}

// Category selector component for reuse
export const PropertyCategorySelector: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    className="w-full border rounded px-3 py-2"
  >
    <option value="">Select category</option>
    <option value="Residentials">Residentials</option>
    <option value="Commercial">Commercial</option>
    <option value="Industrial">Industrial</option>
    <option value="Agricultural">Agricultural</option>
    <option value="Semi-Commercial">Semi-Comercial</option>
    <option value="Institutional">Institutional</option>
  </select>
);
