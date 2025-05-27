"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
// import ChatLayout from '@/app/chat/layout'; // No longer needed here
// import ChatIndexPage from '@/app/chat/page'; // No longer needed here
import LandingPage from '@/components/layout/LandingPage';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect logic based on auth state
  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is logged in, redirect them to the main chat interface page
        console.log("[Home Page Effect] User logged in, redirecting to /chat.");
        router.replace('/chat'); // Use replace to avoid adding landing page to history
      } else {
        // User is not logged in, ensure they see the landing page
        console.log("[Home Page Effect] Not logged in, rendering LandingPage.");
      }
    }
  }, [user, loading, router]);

  // Loading State - Show skeleton while checking auth
  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-screen p-4 space-y-6 bg-gradient-to-br from-background via-secondary to-background">
         <Skeleton className="h-16 w-16 rounded-full" />
         <Skeleton className="h-8 w-1/2 md:w-1/4" />
         <Skeleton className="h-4 w-3/4 md:w-1/2" />
         <Skeleton className="h-4 w-2/3 md:w-1/3" />
         <div className="flex gap-4">
             <Skeleton className="h-10 w-24" />
             <Skeleton className="h-10 w-24" />
         </div>
       </div>
     );
  }

  // Not Logged In or still waiting for redirect: Show Landing Page
  // The effect handles the redirect if user is logged in, but this covers the initial render
  // before the effect runs, or if the user logs out and returns to '/'.
  if (!user) {
     return <LandingPage user={user} loading={loading} />;
  }

   // Logged In but redirect hasn't completed yet (unlikely state, but safe fallback)
   // Show loading or minimal content while redirecting
   return (
       <div className="flex flex-col items-center justify-center h-screen p-4 space-y-6 bg-gradient-to-br from-background via-secondary to-background">
         <Skeleton className="h-16 w-16 rounded-full" />
         <p className="text-muted-foreground">Redirecting to chat...</p>
       </div>
   );
}
