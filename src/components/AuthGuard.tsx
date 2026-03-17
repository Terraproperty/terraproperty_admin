'use client';

import { useEffect, useState } from 'react';
import Login from './App';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAuthenticated(true);
    }
    setChecked(true);
  }, []);

  if (!checked) {
    return null;
  }

  if (!isAuthenticated) {
    // Only render the login form, not AppShell or sidebar
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  // Only render the protected app if authenticated
  return <>{children}</>;
}