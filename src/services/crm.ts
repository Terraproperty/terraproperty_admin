/**
 * Represents a lead from the backend system.
 */
export type LeadStatus = 'pending' | 'approved' | 'declined' | 'closed' | 'deal_won' | 'deal_loss'; // Added new statuses

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  projectOfInterest?: string;
  status: LeadStatus; // Use the new type
  createdAt: string; // Or Date
  // any other fields
}
// assosiate lead comment section
export interface AssociateLeadComment {
  id: string;
  associate_lead_id: string;
  comment_text: string;
  created_at: string; 
}

export async function getAssociateLeadComments(associateLeadId: string): Promise<AssociateLeadComment[]> {
  const response = await fetch(`/api/associate-lead/${associateLeadId}/comments`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch comments' }));
    throw new Error(errorData.error || errorData.message || 'Failed to fetch comments');
  }
  return response.json();
}

export async function addAssociateLeadComment(associateLeadId: string, commentText: string): Promise<AssociateLeadComment> {
  const response = await fetch(`/api/associate-lead/${associateLeadId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment_text: commentText }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to add comment' }));
    throw new Error(errorData.error || errorData.message || 'Failed to add comment');
  }
  return response.json();
}

/**
 * Represents a response to a lead to be sent to the backend.
 */
export interface LeadResponse {
  leadId: string;
  status: 'approved' | 'declined'; // Match PATCH endpoint schema
}

/**
 * Asynchronously retrieves a list of leads from the backend API.
 * @param statusFilter Optional filter for lead status ('pending', 'approved', 'declined', 'all'). Defaults to 'pending'.
 * @returns A promise that resolves to an array of Lead objects.
 */
export interface GetLeadsParams {
  status?: string;
  search?: string;
  sortDate?: 'asc' | 'desc';
  startDate?: string | null; // ISO string
  endDate?: string | null;   // ISO string
}

export async function getLeads(params: GetLeadsParams = {}): Promise<Lead[]> {
  const queryParams = new URLSearchParams();
  if (params.status && params.status !== 'all') {
    queryParams.append('status', params.status);
  }
  if (params.search) {
    queryParams.append('search', params.search);
  }
  if (params.sortDate) {
    queryParams.append('sortDate', params.sortDate);
  }
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }

  const response = await fetch(`/api/leads?${queryParams.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch leads' }));
    throw new Error(errorData.error || errorData.message || 'Failed to fetch leads');
  }
  return response.json();
}

/**
 * Asynchronously submits a response for a lead to the backend API.
 *
 * @param response The response containing leadId and new status.
 * @returns A promise that resolves when the response is submitted successfully.
 */
export interface SubmitLeadResponsePayload {
  leadId: string;
  status: LeadStatus; // Use the new type
}

export async function submitLeadResponse(payload: SubmitLeadResponsePayload): Promise<void> {
  const response = await fetch(`/api/leads?leadId=${payload.leadId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: payload.status }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Failed to update lead to ${payload.status}` }));
    throw new Error(errorData.error || errorData.message || `Failed to update lead to ${payload.status}`);
  }
}

/**
 * Represents a property listing from the backend.
 */
export interface Property {
  id: string;
  propertyName: string;
  address: string;
  price: number; // Keep as number
  description: string;
  contactNumber: string;
  exclusive: boolean;
  email: string;
  status: 'pending' | 'approved' | 'declined' | 'sold'; // Match DB enum
  createdAt: string; // Timestamps are strings
}

// Renamed from Project for consistency with API/DB
export type Project = Property; // Alias for compatibility if needed elsewhere

/**
 * Asynchronously retrieves a list of properties from the backend API.
 * @param statusFilter Optional filter for property status ('pending', 'approved', 'declined', 'sold', 'all'). Defaults to 'all'.
 * @returns A promise that resolves to an array of Property objects.
 */
export async function getProperties(statusFilter: string = 'all'): Promise<Property[]> {
   try {
    const response = await fetch(`/api/properties?status=${statusFilter}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to fetch properties: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }
    const properties: Property[] = await response.json();
    return properties;
  } catch (error) {
    console.error('Error in getProperties service:', error);
    throw error;
  }
}

// Use getProperties instead of getProjects
export const getProjects = getProperties;

/**
 * Updates the status of a property.
 * @param propertyId The ID of the property to update
 * @param status The new status to set
 */
export async function updatePropertyStatus(propertyId: string, status: 'pending' | 'approved' | 'declined' | 'sold'): Promise<void> {
  try {
    const response = await fetch(`/api/properties?id=${propertyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to update property status: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }
    console.log(`Successfully updated property ${propertyId} status to ${status}`);
  } catch (error) {
    console.error('Error in updatePropertyStatus service:', error);
    throw error;
  }
}

/**
 * Represents the data needed to create a new property listing via the API.
 */
export interface CreatePropertyData {
    propertyName: string;
    address: string;
    price: string;
    description: string;
    contactNumber: string;
    email: string;
    // status is optional, defaults to 'pending' on backend
}

/**
 * Asynchronously creates a new property listing via the backend API.
 * @param propertyData The data for the new property.
 * @returns A promise that resolves to the newly created Property object.
 */
export async function createProperty(propertyData: CreatePropertyData): Promise<Property> {
    try {
        console.log('Creating property with data:', propertyData);
        const response = await fetch('/api/properties', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(propertyData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to create property: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
        }

        const result = await response.json();
        return result.property; // Assuming the API returns { message: '...', property: {...} }
    } catch (error) {
        console.error('Error in createProperty service:', error);
        throw error;
    }
}


/**
 * Represents blog post data from the backend.
 */
export interface Blog {
    id: string;
    heading: string;
    storagePathOrUrl: string | null;
    uploadDate: string; // Timestamps are strings
}

/**
 * Fetches all blog posts from the API.
 */
export async function getBlogs(): Promise<Blog[]> {
    try {
        const response = await fetch('/api/blogs');
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to fetch blogs: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error in getBlogs service:', error);
        throw error;
    }
}

/**
 * Represents the data needed to add a blog post record (metadata).
 */
export type AddBlogData = {
  heading: string;
  subheading: string;
  content: string;
  imageUrl: string;
};

/**
 * Adds a new blog post record to the backend.
 * Note: This typically follows a separate file upload process.
 * @param blogData Metadata about the blog post.
 */
export async function addBlog(blogData: AddBlogData): Promise<Blog> {
     try {
        const response = await fetch('/api/blogs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(blogData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to add blog: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
        }
        const result = await response.json();
        return result.blog;
    } catch (error) {
        console.error('Error in addBlog service:', error);
        throw error;
    }
}

/**
 * Deletes a blog post by its ID via the API.
 * @param blogId The ID of the blog post to delete.
 */
export async function deleteBlog(blogId: string): Promise<void> {
     try {
        const response = await fetch(`/api/blogs?id=${blogId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to delete blog: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
        }
        console.log(`Successfully deleted blog ${blogId}`);
    } catch (error) {
        console.error('Error in deleteBlog service:', error);
        throw error;
    }
}


/**
 * Represents an employee node in the hierarchy.
 */
export interface Employee {
  id: string;
  name: string;
  position: string;
  managerId: string | null;
  subordinates?: Employee[]; // Optional array for direct reports
}

/**
 * Fetches the employee hierarchy from the API.
 * @returns A promise resolving to the root Employee node (e.g., CEO) or an array if multiple roots exist.
 */
export async function getEmployeeHierarchy(): Promise<Employee | Employee[]> {
    try {
        const response = await fetch('/api/employees');
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to fetch employee hierarchy: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error in getEmployeeHierarchy service:', error);
        throw error;
    }
}

/**
 * Represents an associate lead from the backend system.
 */
export interface AssociateLead {
  id: string;
  full_name: string;
  email_address: string;
  phone_number: string;
  property_type: string;
  preferred_location: string;
  budget_range: string;
  additional_notes: string;
  per_deal_commission: number;
  total_commission: number;
  pending_commission: number;
  status: string;
  referred_by: string | null;
  referred_by_name?: string | null;
  created_at: string;
}

/**
 * Fetches all associate leads from the backend API.
 * @returns A promise that resolves to an array of AssociateLead objects.
 */
export async function getAssociateLeads(): Promise<AssociateLead[]> {
  try {
    const response = await fetch('/api/associate-lead');
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch associate leads: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`
      );
    }
    const leads: AssociateLead[] = await response.json();
    return leads;
  } catch (error) {
    console.error('Error in getAssociateLeads service:', error);
    throw error;
  }
}

/**
 * Represents a comment on a lead.
 */
export interface LeadComment {
  id: string;
  lead_id: string;
  comment_text: string;
  created_at: string; // ISO date string
}

/**
 * Asynchronously retrieves comments for a specific lead.
 * @param leadId The ID of the lead to fetch comments for.
 * @returns A promise that resolves to an array of LeadComment objects.
 */
export async function getLeadComments(leadId: string): Promise<LeadComment[]> {
  const response = await fetch(`/api/leads/${leadId}/comments`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch comments' }));
    throw new Error(errorData.error || errorData.message || 'Failed to fetch comments');
  }
  return response.json();
}

/**
 * Asynchronously adds a comment to a specific lead.
 * @param leadId The ID of the lead to add a comment to.
 * @param commentText The text of the comment to add.
 * @returns A promise that resolves to the newly created LeadComment object.
 */
export async function addLeadComment(leadId: string, commentText: string): Promise<LeadComment> {
  const response = await fetch(`/api/leads/${leadId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment_text: commentText }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to add comment' }));
    throw new Error(errorData.error || errorData.details || errorData.message || 'Failed to add comment');
  }
  return response.json();
}

/**
 * Updates a property with the given data.
 * @param id The ID of the property to update.
 * @param data The data to update the property with.
 */
export async function updateProperty(id: string, data: any) {
  const res = await fetch(`/api/properties?id=${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update property');
  return res.json();
}

import { RentPropertyFormValues } from '@/components/rent-property';

export async function createRentProperty(data: RentPropertyFormValues) {
  const res = await fetch('/api/rent-properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('Failed to create rent property');
  }
  return res.json();
}
