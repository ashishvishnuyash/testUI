
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { initializationError } from '@/lib/firebase/config'; // Import initError
import ChatArea from '@/components/chat/ChatArea'; // Use ChatArea directly
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';

// Main component for displaying a specific chat conversation
export default function ChatConversationPage() {
  const { user, loading: authLoading, authError: contextAuthError } = useAuth();
  const router = useRouter();
  const params = useParams();
  const chatId = typeof params?.chatId === 'string' ? params.chatId : undefined;

  // Combine initialization error with context auth error
  const combinedError = initializationError || contextAuthError;

  console.log(`[ChatConversationPage] chatId: ${chatId}, authLoading: ${authLoading}, user: ${!!user}, combinedError: ${combinedError}`);

  // Redirect logic based on auth state and init state
  useEffect(() => {
    if (!authLoading) { // Only check after auth state is determined
        if (initializationError) {
            console.error('[ChatConversationPage] Firebase Initialization Error:', initializationError);
            // Error is handled in render logic, no redirect needed here, but log it.
        } else if (contextAuthError) {
            console.error('[ChatConversationPage] Auth Context Error:', contextAuthError);
            // Error is handled in render logic
        } else if (!user) {
            console.log('[ChatConversationPage] No user found, redirecting to /login');
            router.replace('/login');
        } else {
            console.log('[ChatConversationPage] User authenticated.');
        }
    }
  }, [user, authLoading, contextAuthError, initializationError, router]);

  // Validate chatId format (basic check)
  useEffect(() => {
     // Ensure validation only runs if user exists and there are no initial errors
     if (user && !combinedError && chatId && !/^[a-zA-Z0-9]+$/.test(chatId)) {
        console.warn(`[ChatConversationPage] Invalid chatId format: ${chatId}. Redirecting to /chat`);
        router.replace('/chat'); // Redirect if chatId format is invalid
     }
  }, [chatId, user, combinedError, router]);


  // --- Render Logic ---

  // 1. Auth Loading State (or Initializing Firebase)
  if (authLoading) {
    console.log('[ChatConversationPage] Render: Auth Loading / Initializing');
    return (
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        {/* Use skeletons matching ChatArea structure more closely */}
        <Skeleton className="h-12 w-full mb-2" /> {/* Placeholder for sticky header */}
        <div className="flex-1 space-y-4">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-16 w-3/4 ml-auto" />
            <Skeleton className="h-16 w-1/2" />
        </div>
        <Skeleton className="h-12 w-full mt-2" /> {/* Placeholder for input area */}
      </div>
    );
  }

  // 2. Initialization or Auth Error State
  if (combinedError) {
    console.log('[ChatConversationPage] Render: Initialization or Auth Error');
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Chat</AlertTitle>
          <AlertDescription>
            {combinedError}. Cannot load chat. Please check setup or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 3. No User State (Should be redirected, show loading/message)
  if (!user) {
    console.log('[ChatConversationPage] Render: No user, waiting for redirect');
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

   // 4. Missing or Invalid Chat ID
   if (!chatId || !/^[a-zA-Z0-9]+$/.test(chatId)) {
       console.log(`[ChatConversationPage] Render: Invalid or missing chatId (${chatId}), redirecting...`);
       // Redirect effect should handle this, show loading meanwhile
       return (
           <div className="flex h-full flex-1 items-center justify-center">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
               <p className="ml-2 text-muted-foreground">Loading chat...</p>
           </div>
       );
   }


  // 5. Valid State: Render the Chat Area directly
  console.log(`[ChatConversationPage] Render: Rendering ChatArea for chatId: ${chatId}`);
  return (
    // flex-1 ensures it takes remaining height within the AppLayout's main area
    // overflow-hidden prevents content from spilling outside its container
    <div className="flex-1 overflow-hidden">
       {/* Pass chatId directly to ChatArea */}
       <ChatArea chatId={chatId} />
    </div>
  );
}
