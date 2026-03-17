'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Newspaper, Building, Users, UserCog, FileText, Building2,
  MessageSquare, Home, Briefcase, GraduationCap 
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/leads', label: 'Lead Management', icon: Users },
    { href: '/associate-lead', label: 'Associate Lead', icon: Users },
    { href: '/site-visit', label: 'Scheduled Site Visit', icon: Building },
            { href: '/jobs', label: 'Job Posting', icon: Briefcase },

    // { href: '/associate-program', label: 'Associate Program', icon: Users },
    { href: '/blogs', label: 'Blog Management', icon: Newspaper },
    { href: '/employees', label: 'Employee Management', icon: UserCog },
        { href: '/rent-properties-list', label: 'Properties for Rent', icon: Home },


  ];

  const propertiesMenuItems = [
    { href: '/projects', label: 'Properties', icon: Building },
    { href: '/projects/list-property', label: 'Authority Plots', icon: FileText },
    { href: '/projects/builder-property', label: 'Builder Projects', icon: FileText },
    { href: '/projects/rent-property', label: 'Rent Properties', icon: Home },
    { href: '/distress-sales', label: 'Distress Sales', icon: Building2 },
  ];

  const inquiryMenuItems = [
    { href: '/contact-inquiries', label: 'Contact Inquiries', icon: MessageSquare },
    { href: '/property-inquiries', label: 'Buy/Sell/Rent Inquiries', icon: Home },
    { href: '/investor-appointments', label: 'Investor Appointments', icon: Briefcase },
    { href: '/career-applications', label: 'Career Applications', icon: GraduationCap },
    { href: '/associate-program', label: 'Associate Program', icon: GraduationCap },
  ];

  // Removed otherOptionsMenuItems array as job posting is now part of inquiryMenuItems

  const isEmployeeManagement = pathname.startsWith('/employees');
  const currentMode = isEmployeeManagement ? ' Terra Employee Management' : 'Terra Admin';

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar collapsible="icon">
        <SidebarHeader className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-primary">
              <img src="https://terraproperty.in/assets/logo.png" alt="Terra Logo" className="h-32 w-52" style={{ minWidth: 32, minHeight: 32 }} />
              {/* <span className="hidden group-data-[state=expanded]:inline text-2xl" style={{ fontSize: 32 }}>Terra Property</span> */}
            </Link>
          <SidebarTrigger className="hidden md:flex" />
        </SidebarHeader>
        <ScrollArea className="flex-1">
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href) && item.href !== '/projects'}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem key={'properties-group'}>
                  <SidebarMenuButton
                      asChild
                      isActive={pathname === '/projects'}
                      tooltip="Properties Overview"
                    >
                     <Link href={'/projects'}>
                         <Building />
                         <span>Properties</span>
                     </Link>
                  </SidebarMenuButton>

                  <SidebarMenu className="pl-6 group-data-[collapsible=icon]:hidden">
                     {propertiesMenuItems.filter(item => item.href !== '/projects').map((subItem) => (
                        <SidebarMenuItem key={subItem.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === subItem.href}
                            tooltip={subItem.label}
                            size="sm"
                          >
                            <Link href={subItem.href}>
                              <subItem.icon className="h-3.5 w-3.5" />
                              <span>{subItem.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                  </SidebarMenu>
              </SidebarMenuItem>

              {/* Inquiries Section */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={false}
                  tooltip="Inquiries"
                >
                  <div className="flex items-center">
                    <MessageSquare />
                    <span>Inquiries</span>
                  </div>
                </SidebarMenuButton>

                <SidebarMenu className="pl-6 group-data-[collapsible=icon]:hidden">
                  {inquiryMenuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.label}
                        size="sm"
                      >
                        <Link href={item.href}>
                          <item.icon className="h-3.5 w-3.5" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </ScrollArea>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          <SidebarTrigger className="md:hidden" />
          <span className="text-sm text-muted-foreground hidden sm:inline">{currentMode}</span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggleButton />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
