'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { collection, addDoc, deleteDoc, doc, getDocs, query, orderBy, onSnapshot, where, limit, Timestamp, serverTimestamp } from 'firebase/firestore';
import { MessageSquarePlus, LogOut, Crown, Settings, TrendingUp, History, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SettingsDialogContent } from '@/components/settings/SettingsDialog';
import { SubscriptionDialogContent } from '@/components/settings/SubscriptionDialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

interface ChatListItem {
  id: string;
  title: string;
  lastMessageTimestamp: Timestamp | null;
}

// Helper function to delete subcollection (requires Cloud Function for production)
async function deleteChatMessages(userId: string, chatId: string) {
    if (!db) {
        console.error("Firestore service is not available for deleting messages.");
        toast({ title: "Error", description: "Database service unavailable.", variant: "destructive"});
        return false; // Indicate failure
    }
    try {
        const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
        const q = query(messagesRef);
        const snapshot = await getDocs(q);
        const deletePromises: Promise<void>[] = [];
        snapshot.forEach((doc) => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        await Promise.all(deletePromises);
        console.log(`Subcollection 'messages' for chat ${chatId} deleted (client-side attempt).`);
        return true; // Indicate success
    } catch (error) {
        console.error(`Error deleting subcollection messages for chat ${chatId}:`, error);
        toast({ title: "Deletion Error", description: "Could not delete chat messages.", variant: "destructive" });
        return false; // Indicate failure
    }
}


export default function ChatSidebar() {
  const { user, loading: authLoading, authError } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [errorChats, setErrorChats] = useState<string | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const isDbAvailable = !!db; // Check if db is initialized

  // --- Logout ---
  const handleLogout = async () => {
     if (!auth) {
        console.error("Logout Error: Firebase Auth service is not initialized.");
        toast({ title: "Logout Error", description: "Authentication service unavailable.", variant: "destructive" });
        return;
      }
    try {
      await signOut(auth);
      router.push('/login'); // Redirect to login after logout
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
      console.error('Logout Error:', error);
      toast({ title: "Logout Error", description: "Failed to log out. Please try again.", variant: "destructive" });
    }
  };

   // --- Fetch Chats ---
   useEffect(() => {
     if (!user || !isDbAvailable || authError) {
       setChats([]);
       setLoadingChats(false);
       if (!isDbAvailable) setErrorChats("Database service unavailable.");
       else if (authError) setErrorChats(`Auth Error: ${authError}`);
       else setErrorChats(null);
       return;
     }

     setLoadingChats(true);
     setErrorChats(null);
     console.log("[ChatSidebar] Setting up Firestore listener for chats...");
     const chatsRef = collection(db, 'users', user.uid, 'chats');
     const q = query(chatsRef, orderBy('lastMessageTimestamp', 'desc'));

     const unsubscribe = onSnapshot(q, (querySnapshot) => {
       console.log(`[ChatSidebar] Chats snapshot received with ${querySnapshot.docs.length} docs.`);
       const loadedChats: ChatListItem[] = querySnapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          // Basic validation for chat document data
          if (data && typeof data.title === 'string' && (data.lastMessageTimestamp === null || data.lastMessageTimestamp instanceof Timestamp)) {
             return {
                 id: docSnapshot.id,
                 title: data.title || 'Untitled Chat', // Fallback title
                 lastMessageTimestamp: data.lastMessageTimestamp || null,
             };
          } else {
              console.warn(`[ChatSidebar] Skipping invalid chat document data for doc ${docSnapshot.id}:`, data);
              return null;
          }
       }).filter((chat): chat is ChatListItem => chat !== null); // Filter out invalid entries

       setChats(loadedChats);
       setErrorChats(null);
       setLoadingChats(false);
     }, (error) => {
       console.error("[ChatSidebar] Error fetching chats collection: ", error);
       setErrorChats(`Failed to load chats: ${error.message}`);
       setLoadingChats(false);
     });

     return () => {
        console.log("[ChatSidebar] Unsubscribing Firestore listener.");
        unsubscribe();
    };
   }, [user, isDbAvailable, authError]); // Re-run on user, db status, or auth error change

   // --- Delete Chat ---
   const handleDeleteChat = async (chatIdToDelete: string, e: React.MouseEvent) => {
     e.stopPropagation(); // Prevent link navigation
     e.preventDefault();
     if (!user || deletingChatId === chatIdToDelete || !isDbAvailable) {
         if(!isDbAvailable) toast({ title: "Error", description: "Database service unavailable.", variant: "destructive"});
         return;
     };

     setDeletingChatId(chatIdToDelete);
     console.log(`Attempting to delete chat: ${chatIdToDelete}`);

     try {
       // Attempt to delete subcollection first
       const messagesDeleted = await deleteChatMessages(user.uid, chatIdToDelete);

       if (messagesDeleted) {
           // Only delete the chat doc if messages were deleted (or if deletion wasn't necessary/failed gracefully)
           const chatDocRef = doc(db!, 'users', user.uid, 'chats', chatIdToDelete);
           await deleteDoc(chatDocRef);

           toast({
             title: "Chat Deleted",
             description: "The chat session has been removed.",
           });

           // Navigate away if the currently viewed chat was deleted
           if (pathname === `/chat/${chatIdToDelete}`) {
             router.push('/chat'); // Redirect to the base chat page
           }
       } else {
            // Error handled within deleteChatMessages with a toast
            console.warn(`Skipping deletion of chat document ${chatIdToDelete} due to message deletion failure.`);
       }
     } catch (error) {
       console.error("Error deleting chat document:", error);
       toast({
           title: "Deletion Failed",
           description: `Could not delete the chat document: ${error instanceof Error ? error.message : 'Unknown error'}`,
           variant: "destructive",
       });
     } finally {
       setDeletingChatId(null);
     }
   };

   // --- Create Chat ---
    const handleCreateChat = async () => {
        if (!user || !isDbAvailable || isCreatingChat) {
            if (!isDbAvailable) toast({ title: "Error", description: "Database service unavailable.", variant: "destructive" });
            if (isCreatingChat) toast({ title: "Please wait", description: "Chat creation in progress." });
            return;
        }

        setIsCreatingChat(true);
        setErrorChats(null); // Clear list errors

        try {
            const chatsRef = collection(db!, 'users', user.uid, 'chats');
            const newChatDoc = await addDoc(chatsRef, {
                title: "New Chat", // Initial title
                createdAt: serverTimestamp(),
                lastMessageTimestamp: serverTimestamp(), // Set initial timestamp
            });
            console.log(`[ChatSidebar] New chat created with ID: ${newChatDoc.id}`);
            toast({ title: "Chat Created", description: "New chat session started." });
            router.push(`/chat/${newChatDoc.id}`); // Navigate to the new chat
        } catch (error) {
            console.error("[ChatSidebar] Error creating new chat:", error);
            setErrorChats(`Failed to create chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
            toast({ title: "Creation Failed", description: "Could not create a new chat.", variant: "destructive" });
        } finally {
            setIsCreatingChat(false);
        }
    };


  // Determine if a chat link is active
  const isActive = (chatId: string) => pathname === `/chat/${chatId}`;

  return (
    // Using ShadCN Sidebar structure but simplified for this context
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col h-screen shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg md:text-xl font-semibold text-primary">
          <TrendingUp className="h-6 w-6 md:h-7 md:w-7 shrink-0" /> {/* Changed Icon */}
        <span className="whitespace-nowrap">TradeChat</span> {/* Updated Name */}
        </Link>
        {/* Maybe add a collapse/expand button later if needed */}
      </div>

      {/* New Chat Button */}
      <div className="p-2 border-b border-sidebar-border">
        <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground p-2 text-sm"
            onClick={handleCreateChat}
            disabled={!user || authError || !isDbAvailable || isCreatingChat}
        >
            {isCreatingChat ? (
                <Loader2 className="h-4 w-4 md:h-5 md:w-5 shrink-0 animate-spin" />
            ) : (
                <MessageSquarePlus className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
            )}
            <span>{isCreatingChat ? 'Creating...' : 'New Chat'}</span>
        </Button>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto p-1 md:p-2 space-y-1">
          <h3 className="flex items-center gap-2 px-2 text-xs md:text-sm font-medium text-sidebar-foreground/70 mb-1">
             <History size={14} /> History
          </h3>

          {/* Loading Skeletons */}
          {loadingChats && (
             <div className="space-y-1 px-1">
                <Skeleton className="h-8 w-full rounded-md" />
                <Skeleton className="h-8 w-full rounded-md" />
                <Skeleton className="h-8 w-full rounded-md" />
             </div>
          )}

          {/* Error Display */}
          {errorChats && !loadingChats && (
             <div className="p-1 md:p-2 text-destructive flex items-center gap-2 text-xs md:text-sm bg-destructive/10 rounded-md mx-1">
                 <AlertTriangle size={14} />
                 <span className="whitespace-normal">{errorChats}</span>
             </div>
          )}

          {/* No Chats Message */}
          {!loadingChats && !errorChats && chats.length === 0 && user && (
             <p className="p-1 md:p-2 text-muted-foreground text-xs md:text-sm text-center italic">
               No chat history yet.
             </p>
          )}

          {/* Chat List Items */}
          {!loadingChats && !errorChats && chats.map((chat) => (
             <div key={chat.id} className="group relative rounded-md hover:bg-sidebar-accent">
                 <TooltipProvider delayDuration={100}>
                     <Tooltip>
                         <TooltipTrigger asChild>
                             <Link
                                 href={`/chat/${chat.id}`}
                                 className={cn(
                                     "flex w-full items-center justify-between gap-2 overflow-hidden rounded-md p-2 text-left text-sm transition-colors",
                                     isActive(chat.id)
                                         ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                                         : 'text-sidebar-foreground hover:text-sidebar-accent-foreground'
                                 )}
                             >
                                 <span className="truncate flex-1">{chat.title}</span>
                             </Link>
                         </TooltipTrigger>
                         <TooltipContent side="right" className="max-w-[200px] truncate bg-background text-foreground border border-border shadow-lg">
                             {chat.title}
                         </TooltipContent>
                     </Tooltip>
                 </TooltipProvider>

                  {/* Delete Button */}
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button
                              variant="ghost"
                              size="icon"
                              disabled={deletingChatId === chat.id || !isDbAvailable}
                              className={cn(
                                 "absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity",
                                 "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                                 "disabled:opacity-50 disabled:pointer-events-none"
                              )}
                              aria-label={`Delete chat: ${chat.title}`}
                              onClick={(e) => e.stopPropagation()} // Prevent navigation
                         >
                             {deletingChatId === chat.id ? (
                                 <Loader2 size={12} className="animate-spin" />
                             ) : (
                                 <Trash2 size={12} />
                             )}
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                             <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                             <AlertDialogDescription>
                               This action cannot be undone. This will permanently delete the chat
                               session titled "<span className="font-medium">{chat.title}</span>".
                               <br/>
                              <strong className="text-destructive">(Note: Full deletion may require backend setup in production)</strong>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => handleDeleteChat(chat.id, e)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={deletingChatId === chat.id || !isDbAvailable}
                             >
                              {deletingChatId === chat.id ? 'Deleting...' : 'Delete Chat'}
                             </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
             </div>
          ))}
      </div>


      {/* Footer Section */}
      <div className="mt-auto p-1 md:p-2 border-t border-sidebar-border">
         {/* Show Footer only if user is logged in and no auth error */}
         {user && !authError && (
             <div className="space-y-1">
                 {/* Subscription Dialog */}
                 <Dialog>
                     <DialogTrigger asChild>
                         <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground p-2 text-sm">
                             <Crown size={16}/>
                             <span>Subscription</span>
                         </Button>
                     </DialogTrigger>
                     <DialogContent className="sm:max-w-3xl">
                         <DialogHeader>
                             <DialogTitle className="text-2xl md:text-3xl font-serif font-bold text-primary flex items-center gap-2">
                                 <Crown className="h-7 w-7"/> Subscription Plans
                             </DialogTitle>
                             <DialogDescription className="text-base">Choose the plan that best suits your needs.</DialogDescription>
                         </DialogHeader>
                         <SubscriptionDialogContent />
                     </DialogContent>
                 </Dialog>

                 {/* Settings Dialog */}
                 <Dialog>
                     <DialogTrigger asChild>
                         <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground p-2 text-sm">
                             <Settings size={16} />
                             <span>Settings</span>
                         </Button>
                     </DialogTrigger>
                     <DialogContent className="sm:max-w-lg">
                         <DialogHeader>
                             <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                                 <Settings size={16} className="text-primary"/> Account Settings
                             </DialogTitle>
                             <DialogDescription>Manage your account preferences.</DialogDescription>
                         </DialogHeader>
                         <SettingsDialogContent />
                     </DialogContent>
                 </Dialog>

                 {/* Logout Button */}
                 <Button
                     variant="ghost"
                     onClick={handleLogout}
                     disabled={!auth}
                     className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground p-2 text-sm"
                 >
                     <LogOut size={16} />
                     <span>Logout</span>
                 </Button>

                 {/* User Info */}
                 <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground border-t border-sidebar-border pt-2 mt-1">
                     <Avatar className="h-6 w-6">
                        {user.photoURL ? (
                           <AvatarImage src={user.photoURL} alt={user.displayName || user.email || 'User'} />
                        ) : null}
                         <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-accent-foreground">
                             {user.email ? user.email[0].toUpperCase() : '?'}
                         </AvatarFallback>
                     </Avatar>
                     <span className="truncate">{user.email}</span>
                 </div>
             </div>
         )}
          {/* Auth Error in Footer */}
           {authError && (
             <div className="px-2 py-1 text-xs text-destructive flex items-center gap-1 bg-destructive/10 rounded-md">
               <AlertTriangle size={12}/> Auth Error
             </div>
           )}
            {/* Show loading indicator for auth check */}
           {authLoading && (
             <div className="flex items-center justify-center px-2 py-1 text-xs text-muted-foreground">
                 <Loader2 size={14} className="animate-spin mr-1"/> Loading user...
             </div>
           )}
      </div>
    </aside>
  );
}
