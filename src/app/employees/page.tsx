'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCog, Users, ChevronRight, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { getEmployeeHierarchy, type Employee } from '@/services/crm'; // Import service and type
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

// Recursive component to render employee and their subordinates - remains the same
const EmployeeNode: React.FC<{ employee: Employee; level: number }> = ({ employee, level }) => {
    const [isOpen, setIsOpen] = React.useState(level < 2); // Initially open top levels

    const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;

    const toggleOpen = () => {
        if (hasSubordinates) {
          setIsOpen(!isOpen);
        }
    };

    return (
        <div style={{ paddingLeft: `${level * 20}px` }} className="my-2"> {/* Use paddingLeft */}
            <div
                className={`flex items-center p-2 rounded-md cursor-${hasSubordinates ? 'pointer' : 'default'} hover:bg-accent/50 transition-colors`}
                onClick={toggleOpen}
                role={hasSubordinates ? 'button' : undefined}
                aria-expanded={hasSubordinates ? isOpen : undefined}
            >
                 {hasSubordinates ? (
                   isOpen ? <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0"/> : <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0"/>
                 ) : (
                   <span className="w-4 mr-2 flex-shrink-0"></span> // Placeholder for alignment
                 )}
                <Users className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                <div>
                    <span className="font-medium">{employee.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">({employee.position})</span>
                </div>
            </div>
            {isOpen && hasSubordinates && (
                <div className="mt-1 border-l-2 border-muted-foreground/30 pl-4"> {/* Adjusted padding */}
                    {employee.subordinates?.map((sub) => (
                        <EmployeeNode key={sub.id} employee={sub} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};


export default function EmployeesPage() {
  const [employeeData, setEmployeeData] = React.useState<Employee | null>(null); // Can be single root or null
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchHierarchy = React.useCallback(async () => {
    setLoading(true);
    try {
        const data = await getEmployeeHierarchy();
        // Assuming the API returns a single root employee object or an empty array/null if no employees
        if (Array.isArray(data)) {
            // Handle multiple roots if necessary, or assume first is the main root
            setEmployeeData(data.length > 0 ? data[0] : null);
             if (data.length > 1) console.warn("Multiple root employees found, displaying the first.");
        } else {
            setEmployeeData(data);
        }
    } catch (error: any) {
         console.error('Error fetching employee hierarchy:', error);
          toast({
            title: 'Error',
            description: `Failed to fetch employee data: ${error.message || 'Please try again.'}`,
            variant: 'destructive',
          });
         setEmployeeData(null); // Clear data on error
    } finally {
        setLoading(false);
    }
  }, [toast]); // Dependency on toast

  // Fetch data on component mount
  React.useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);


  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
           <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <UserCog className="h-6 w-6 text-primary" /> Employee Management
              </CardTitle>
              <CardDescription>View the organizational hierarchy.</CardDescription>
            </div>
             <Button onClick={fetchHierarchy} variant="outline" size="icon" disabled={loading}>
               {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
               <span className="sr-only">Refresh Hierarchy</span>
            </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : employeeData ? (
             <EmployeeNode employee={employeeData} level={0} />
          ) : (
             <div className="text-center py-10 text-muted-foreground">
                No employee data available. Check database connection and seed data.
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
