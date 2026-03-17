'use client';

import React from 'react';
import { BuilderPropertyForm, type BuilderPropertyFormValues } from '@/components/builder-property';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';
import { createProperty } from '@/services/crm'; // Import the API service function

const BuilderPropertyPage: React.FC = () => {
  const { toast } = useToast();

  const handleSubmit = async (values: BuilderPropertyFormValues) => {
    try {
      // Call the API service function to create the property
      console.log('Submitting property values:', values);
      const newProperty = await createProperty({
        ...values,
        price: String(values.price),
      });
      toast({
        title: 'Success!',
        description: `Builder Property "${newProperty.propertyName}" listed successfully with ID: ${newProperty.id}.`,
      });
      // Form clearing is handled within BuilderPropertyForm component itself
    } catch (error: any) {
      console.error('Error listing property:', error);
      toast({
        title: 'Error',
        description: `Failed to list property: ${error.message || 'Please try again.'}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
       <Card className="max-w-2xl mx-auto shadow-lg">
         <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Building className="h-6 w-6 text-primary" /> List a New Builder Property
            </CardTitle>
            <CardDescription>Fill in the details below to add a new builder property listing.</CardDescription>
         </CardHeader>
         <CardContent>
             {/* Pass the API submission handler to the form */}
             <BuilderPropertyForm
               onSubmit={handleSubmit}
               initialValues={{
                 propertyName: '',
                 location: '',
                 price: '',
                 // Add other fields as required by BuilderPropertyFormValues
               }}
               onCancel={() => {
                 // Optionally handle cancel, e.g., reset form or navigate away
               }}
             />
         </CardContent>
       </Card>
    </div>
  );
};

export default BuilderPropertyPage;
