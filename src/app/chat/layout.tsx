'use client';

import { ReactNode } from 'react';
import ChatLayout from '@/components/chat/ChatLayout';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { MobileSidebarProvider } from '@/contexts/MobileSidebarContext';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <MobileSidebarProvider>
        <ChatLayout>
          {children}
        </ChatLayout>
      </MobileSidebarProvider>
    </AuthProvider>
  );
}
