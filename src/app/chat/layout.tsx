
import type { ReactNode } from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { AuthProvider } from '@/components/auth/AuthProvider'; // Ensure AuthProvider wraps chat layout

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    // AuthProvider might already be in RootLayout, double check if needed here
    // <AuthProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar specifically for chat listing and creation */}
        <ChatSidebar />
        {/* Main content area for the chat conversation */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    // </AuthProvider>
  );
}
