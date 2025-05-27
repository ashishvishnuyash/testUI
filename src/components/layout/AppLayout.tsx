
import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

// This layout might be used for non-chat pages if needed,
// or could be removed if all authenticated views use ChatLayout.
export default function AppLayout({ children }: AppLayoutProps) {
  return (
    // Ensure the main layout container uses full height
    <div className="flex h-screen overflow-hidden bg-background">
      {/* No sidebar here anymore, handled by specific layouts like ChatLayout */}
      {/* The main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
