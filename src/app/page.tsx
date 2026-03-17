import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the leads page as the default view
  redirect('/leads');

  // Keep a placeholder in case redirect doesn't work immediately or for future use
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-4xl font-bold text-primary mb-4">Welcome to EstateCentral</h1>
      <p className="text-lg text-foreground">Your Real Estate Admin Panel</p>
      <p className="text-muted-foreground mt-2">Redirecting to Lead Management...</p>
    </div>
  );
}
