'use client';

import React from 'react';
import { RentPropertyForm, type RentPropertyFormValues } from '@/components/rent-property';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home } from 'lucide-react';
import { createRentProperty } from '@/services/crm'; // Import the API service function

const RentPropertyPage: React.FC = () => {
  const { toast } = useToast();

  const handleSubmit = async (values: RentPropertyFormValues) => {
    try {
      console.log('Submitting rent property values:', values);
      const newProperty = await createRentProperty({
        ...values,
        price: String(values.price),
      });
      toast({
        title: 'Success!',
        description: `Rent property "${newProperty.propertyName}" listed successfully with ID: ${newProperty.id}.`,
      });
    } catch (error: any) {
      console.error('Error listing rent property:', error);
      toast({
        title: 'Error',
        description: `Failed to list rent property: ${error.message || 'Please try again.'}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
       <Card className="max-w-2xl mx-auto shadow-lg">
         <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Home className="h-6 w-6 text-primary" /> List a New Rent Property
            </CardTitle>
            <CardDescription>Fill in the details below to add a new rent property listing.</CardDescription>
         </CardHeader>
         <CardContent>
             <RentPropertyForm
               initialValues={{
                 propertyName: '',
                 address: '',
                 price: '',
                 description: '',
                 // Add other fields as required by RentPropertyFormValues
               }}
               onSubmit={handleSubmit}
             />
         </CardContent>
       </Card>
    </div>
  );
};

export default RentPropertyPage;
