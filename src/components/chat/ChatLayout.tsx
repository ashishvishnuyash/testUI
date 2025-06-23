'use client';

import { ReactNode } from 'react';
import ChatSidebar from './ChatSidebar';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';

interface ChatLayoutProps {
  children: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { isSidebarOpen, setSidebarOpen } = useMobileSidebar();

  const handleSidebarNavigate = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ChatSidebar 
        isMobileOpen={isSidebarOpen} 
        setMobileOpen={setSidebarOpen} 
        onNavigate={handleSidebarNavigate} 
      />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}