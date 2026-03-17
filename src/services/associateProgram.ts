export interface AssociateProgramStatus {
  id: string;
  status: string;
}

export async function getAssociateProgramStatus(): Promise<AssociateProgramStatus> {
  const response = await fetch('/api/associate-program-status');
  if (!response.ok) {
    throw new Error('Failed to fetch associate program status');
  }
  return response.json();
}

export async function updateAssociateProgramStatus(status: string): Promise<{ message: string }> {
  const response = await fetch('/api/associate-program-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error('Failed to update associate program status');
  }
  return response.json();
}
