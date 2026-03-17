// src/app/api/employees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface DbEmployee {
    id: string;
    name: string;
    position: string;
    managerId: string | null;
}

interface EmployeeNode extends DbEmployee {
    subordinates?: EmployeeNode[];
}

// Helper function to build the hierarchy recursively
const buildHierarchy = (employees: DbEmployee[], managerId: string | null = null): EmployeeNode[] => {
    return employees
        .filter(emp => emp.managerId === managerId)
        .map(emp => {
            const subordinates = buildHierarchy(employees, emp.id);
            const node: EmployeeNode = { ...emp };
            if (subordinates.length > 0) {
                node.subordinates = subordinates;
            }
            return node;
        });
};

// GET handler to fetch the entire employee hierarchy
export async function GET(request: NextRequest) {
    try {
        // Fetch all employees from the database
        const allEmployees = await query(
            'SELECT id, name, position, managerId FROM employees ORDER BY name' // Ordering can help consistency
        ) as DbEmployee[];

        // Build the hierarchy starting from the root (employees with managerId = NULL)
        const hierarchy = buildHierarchy(allEmployees, null);

        // Assuming there's typically one root (CEO) or a few top-level managers
        // If there can be multiple roots, the hierarchy array is the result.
        // If there's expected to be only one root (e.g., CEO), return that object.
        const result = hierarchy.length === 1 ? hierarchy[0] : hierarchy; // Adjust based on expected structure

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to fetch employee hierarchy:', error);
        return NextResponse.json({ error: 'Failed to fetch employee hierarchy' }, { status: 500 });
    }
}

// Note: POST, PATCH, DELETE for employees are not implemented here
// but would follow similar patterns, involving validation and database operations.
