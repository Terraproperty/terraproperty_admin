// import { getAssociateProgram } from '@/services/associateProgram';
/**
 * Types for different inquiry forms
 */

export interface ContactInquiry {
    id: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
    status: 'new' | 'in_progress' | 'resolved';
    createdAt: string;
}

export interface PropertyInquiry {
    id: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
    inquiry_type: 'buy' | 'sell' | 'rent';
    property_type?: string;
    budget_range?: string;
    preferred_location?: string;
    additional_details?: string;
    status: 'new' | 'in_progress' | 'resolved';
    createdAt: string;
}

export interface InvestorAppointment {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    investment_range?: string;
    preferred_date: string;
    preferred_time: string;
    investment_interests?: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    createdAt: string;
}

export interface CareerApplication {
    id: string;
    name: string;
    email: string;
    phone?: string;
    position_applied: string;
    experience_years?: number;
    current_company?: string;
    resume_url?: string;
    coverLetter?: string;
    status: 'new' | 'under_review' | 'shortlisted' | 'rejected' | 'hired';
    createdAt: string;
}

export interface getAssociateProgram {
    id: string;
    full_name: string;
    email_address: string;
    user_id: string;
    password: string;
    mobile_number?: string;
    highest_qualification?: string;
    confirmation: string;
    created_at: string;
}
// Contact Inquiries
export async function getContactInquiries(): Promise<ContactInquiry[]> {
    const response = await fetch('/api/contact-inquiries');
    if (!response.ok) {
        throw new Error('Failed to fetch contact inquiries');
    }
    return response.json();
}

export async function submitContactInquiry(data: Omit<ContactInquiry, 'id' | 'status' | 'createdAt'>): Promise<ContactInquiry> {
    const response = await fetch('/api/contact-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to submit contact inquiry');
    }
    return response.json();
}

// Property Inquiries
export async function getPropertyInquiries(): Promise<PropertyInquiry[]> {
    const response = await fetch('/api/property-inquiries');
    if (!response.ok) {
        throw new Error('Failed to fetch property inquiries');
    }
    return response.json();
}
export async function deletePropertyInquiry(id: string): Promise<void> {
  const response = await fetch(`/api/property-inquiries?id=${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to delete inquiry' }));
    throw new Error(errorData.error || errorData.message || 'Failed to delete inquiry');
  }
}
export async function deleteContactInquiry(id: string): Promise<void> {
  const response = await fetch(`/api/contact-inquiries?id=${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to delete inquiry' }));
    throw new Error(errorData.error || errorData.message || 'Failed to delete inquiry');
  }
  // No need to return response.json() for a successful delete if the API returns 200/204 with no body or just a message
}

export async function submitPropertyInquiry(data: Omit<PropertyInquiry, 'id' | 'status' | 'createdAt'>): Promise<PropertyInquiry> {
    const response = await fetch('/api/property-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to submit property inquiry');
    }
    return response.json();
}

// Investor Appointments
export async function getInvestorAppointments(): Promise<InvestorAppointment[]> {
    const response = await fetch('/api/investor-appointments');
    if (!response.ok) {
        throw new Error('Failed to fetch investor appointments');
    }
    return response.json();
}

export async function submitInvestorAppointment(data: Omit<InvestorAppointment, 'id' | 'status' | 'createdAt'>): Promise<InvestorAppointment> {
    const response = await fetch('/api/investor-appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to submit investor appointment');
    }
    return response.json();
}

// Career Applications
export async function getCareerApplications(): Promise<CareerApplication[]> {
    const response = await fetch('/api/career-applications');
    if (!response.ok) {
        throw new Error('Failed to fetch career applications');
    }
    return response.json();
}

export async function submitCareerApplication(data: Omit<CareerApplication, 'id' | 'status' | 'createdAt'>): Promise<CareerApplication> {
    const response = await fetch('/api/career-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to submit career application');
    }
    return response.json();
}

// Get all associate program entries
export async function getAssociateProgramEntries(): Promise<getAssociateProgram[]> {
    const response = await fetch('/api/associate-program');
    if (!response.ok) {
        throw new Error('Failed to fetch associate program entries');
    }
    return response.json();
}

// Update associate program entry status
export async function updateAssociateProgramEntryStatus(id: string, newStatus: '1' | '0' | '3'): Promise<getAssociateProgram> {
    const response = await fetch(`/api/associate-program/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
    });
    if (!response.ok) {
        throw new Error('Failed to update associate program entry status');
    }
    return response.json();
}
