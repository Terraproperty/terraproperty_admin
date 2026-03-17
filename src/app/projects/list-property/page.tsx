'use client';

import React from 'react';
import { ListPropertyForm, type ListPropertyFormValues } from '@/components/list-property';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';
import { createProperty } from '@/services/crm'; // Import the API service function

const ListPropertyPage: React.FC = () => {
  const { toast } = useToast();

  const handleSubmit = async (values: ListPropertyFormValues) => {
    try {
      // Call the API service function to create the property
      console.log('Submitting property values:', values);
      const newProperty = await createProperty({
        ...values,
        price: String(values.price),
      });
      toast({
        title: 'Success!',
        description: `Property "${newProperty.propertyName}" listed successfully with ID: ${newProperty.id}.`,
      });
      // Form clearing is handled within ListPropertyForm component itself
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
                <Building className="h-6 w-6 text-primary" /> List a New Property
            </CardTitle>
            <CardDescription>Fill in the details below to add a new property listing.</CardDescription>
         </CardHeader>
         <CardContent>
             {/* Pass the API submission handler to the form */}
             <ListPropertyForm onSubmit={handleSubmit} />
         </CardContent>
       </Card>
    </div>
  );
};

export default ListPropertyPage;
