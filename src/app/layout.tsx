import type { Metadata } from 'next';
import { GeistSans } from 'geist/font';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import AppShell from '@/components/AppShell';
import { ThemeProvider } from '@/components/theme-provider';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'EstateCentral',
  description: 'Real Estate Admin Panel',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={GeistSans.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthGuard>
            <SidebarProvider>
              <AppShell>{children}</AppShell>
            </SidebarProvider>
          </AuthGuard>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
