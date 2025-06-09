'use client';

import { ReactNode } from 'react';
import ChatSidebar from './ChatSidebar';

interface ChatLayoutProps {
  children: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - handles both mobile and desktop */}
      <ChatSidebar />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}