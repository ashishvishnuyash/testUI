'use client';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth, db, initializationError } from '@/lib/firebase/config'; // Import initializationError
import { useAuth } from '@/hooks/useAuth';
import { collection, addDoc, deleteDoc, doc, getDocs, query, orderBy, onSnapshot, where, limit, Timestamp, serverTimestamp } from 'firebase/firestore';
import { MessageSquarePlus, LogOut, Crown, Settings, History, Loader2, Trash2, AlertTriangle, PanelLeft, TrendingUp, X } from 'lucide-react'; // Added TrendingUp, X
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"; // Use Sheet for mobile
import { SettingsDialogContent } from '@/components/settings/SettingsDialog';
import { SubscriptionDialogContent } from '@/components/settings/SubscriptionDialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
// Removed VisuallyHidden import - using sr-only class instead
interface ChatListItem {
    id: string;
    title: string;
    lastMessageTimestamp: Timestamp | null;
}

// Helper function to delete subcollection (requires Cloud Function for production)
async function deleteChatMessages(userId: string, chatId: string) {
    // Check db availability directly inside the helper too
    if (!db) {
        console.error("Firestore service is not available for deleting messages.");
        toast({ title: "Error", description: "Database service unavailable.", variant: "destructive" });
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
        console.log(`[ChatSidebar] Subcollection 'messages' for chat ${chatId} deleted (client-side attempt).`);
        return true; // Indicate success
    } catch (error) {
        console.error(`Error deleting subcollection messages for chat ${chatId}:`, error);
        toast({ title: "Deletion Error", description: "Could not delete chat messages.", variant: "destructive" });
        return false; // Indicate failure
    }
}


export default function AppSidebar() {
    const { user, loading: authLoading, authError: contextAuthError } = useAuth(); // Get auth context error
    const router = useRouter();
    const pathname = usePathname();
    const [chats, setChats] = useState<ChatListItem[]>([]);
    const [loadingChats, setLoadingChats] = useState(true);
    // Combine initialization error with context auth error and db status
    const combinedError = initializationError || contextAuthError;
    const isDbAvailable = !!db; // Check if db is initialized
    const [errorChats, setErrorChats] = useState<string | null>(!isDbAvailable ? "Database service unavailable." : combinedError); // Initial error state
    const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile sheet

    // --- Logout ---
    const handleLogout = async () => {
        // Check auth availability
        if (!auth) {
            const errMsg = initializationError || "Authentication service unavailable.";
            console.error("Logout Error: Firebase Auth service is not initialized.", { initializationError });
            toast({ title: "Logout Error", description: errMsg, variant: "destructive" });
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
        // Prioritize initializationError, then authError, then db status
        if (initializationError) {
            setErrorChats(`Initialization failed: ${initializationError}`);
            setLoadingChats(false);
            setChats([]);
            return;
        }
        if (contextAuthError) {
            setErrorChats(`Auth error: ${contextAuthError}`);
            setLoadingChats(false);
            setChats([]);
            return;
        }
        if (!isDbAvailable) {
            setErrorChats("Database service unavailable.");
            setLoadingChats(false);
            setChats([]);
            return;
        }
        if (!user) {
            setErrorChats(null); // No error if user just not logged in yet
            setLoadingChats(false); // Not loading if no user
            setChats([]);
            return;
        }

        setLoadingChats(true);
        setErrorChats(null); // Clear previous errors if prerequisites met
        console.log("[ChatSidebar] Setting up Firestore listener for chats...");
        const chatsRef = collection(db!, 'users', user.uid, 'chats');
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
            setErrorChats(null); // Clear errors on success
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
    }, [user, isDbAvailable, contextAuthError, initializationError]); // Re-run on user, db status, or error changes

    // --- Delete Chat ---
    const handleDeleteChat = async (chatIdToDelete: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent link navigation
        e.preventDefault();
        // Check prerequisites including db status
        if (!user || deletingChatId === chatIdToDelete || !isDbAvailable) {
            if (!isDbAvailable) toast({ title: "Error", description: "Database service unavailable.", variant: "destructive" });
            else if (!user) toast({ title: "Error", description: "User not logged in.", variant: "destructive" });
            return;
        };

        setDeletingChatId(chatIdToDelete);
        console.log(`Attempting to delete chat: ${chatIdToDelete}`);

        try {
            // Attempt to delete subcollection first (function already checks db)
            const messagesDeleted = await deleteChatMessages(user.uid, chatIdToDelete);

            if (messagesDeleted) {
                // Only delete the chat doc if messages were deleted or failure handled
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
        // Check prerequisites including db status and auth status
        if (!user || !isDbAvailable || isCreatingChat || !auth) {
            const errMsg = !auth ? initializationError || "Auth service unavailable." :
                !isDbAvailable ? "Database service unavailable." :
                    isCreatingChat ? "Chat creation in progress." :
                        !user ? "User not logged in." : "Cannot create chat.";
            toast({ title: "Error", description: errMsg, variant: "destructive" });
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
            setIsMobileMenuOpen(false); // Close mobile menu after creating chat
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

    // Render sidebar content (used for both desktop and mobile sheet)
    const sidebarContent = (
        <>
            {/* Header */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-sidebar-border">
                <Link href="/" className="flex items-center gap-2 font-serif text-lg md:text-xl font-semibold text-primary">
                    <TrendingUp className="h-6 w-6 md:h-7 md:w-7 shrink-0" /> {/* Changed Icon */}
                    <span className="whitespace-nowrap">StockWhisperer AI</span> {/* Updated Name */}
                </Link>
                {/* Mobile close button (only shown inside Sheet) */}
                <SheetClose asChild className="md:hidden">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/70">
                        <X size={18} /> {/* Use X icon for close */}
                        <span className="sr-only">Close Menu</span>
                    </Button>
                </SheetClose>
            </div>

            {/* New Chat Button */}
            <div className="p-2 border-b border-sidebar-border">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground p-2 text-sm"
                    onClick={handleCreateChat}
                    disabled={!user || !!combinedError || !isDbAvailable || isCreatingChat || !auth} // Check all relevant states
                >
                    {isCreatingChat ? (
                        <Loader2 className="h-4 w-4 md:h-5 md:w-5 shrink-0 animate-spin" />
                    ) : (
                        <MessageSquarePlus className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
                    )}
                    <span>{isCreatingChat ? 'Creating...' : 'New Discussion'}</span> {/* Updated Text */}
                </Button>
            </div>

            {/* Chat History List */}
            <div className="flex-1 overflow-y-auto p-1 md:p-2 space-y-1">
                <h3 className="flex items-center gap-2 px-2 text-xs md:text-sm font-medium text-sidebar-foreground/70 mb-1">
                    <History size={14} /> Discussion History {/* Updated Text */}
                </h3>

                {/* Loading Skeletons */}
                {loadingChats && !combinedError && ( // Only show loading if no error
                    <div className="space-y-1 px-1">
                        <Skeleton className="h-8 w-full rounded-md" />
                        <Skeleton className="h-8 w-full rounded-md" />
                        <Skeleton className="h-8 w-full rounded-md" />
                    </div>
                )}

                {/* Combined Error Display */}
                {errorChats && ( // Show any error (init, auth, db, fetch)
                    <div className="p-1 md:p-2 text-destructive flex items-center gap-2 text-xs md:text-sm bg-destructive/10 rounded-md mx-1">
                        <AlertTriangle size={14} />
                        <span className="whitespace-normal">{errorChats}</span>
                    </div>
                )}


                {/* No Chats Message */}
                {!loadingChats && !errorChats && chats.length === 0 && user && (
                    <p className="p-1 md:p-2 text-muted-foreground text-xs md:text-sm text-center italic">
                        No discussions yet. {/* Updated Text */}
                    </p>
                )}

                {/* Chat List Items */}
                {!loadingChats && !errorChats && chats.map((chatItem) => ( // Renamed variable
                    <div key={chatItem.id} className="group/menu-item relative rounded-md hover:bg-sidebar-accent">
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    {/* Removed legacyBehavior */}
                                    <Link
                                        href={`/chat/${chatItem.id}`}
                                        onClick={() => setIsMobileMenuOpen(false)} // Close menu on link click
                                        className={cn(
                                            "flex w-full items-center justify-between gap-2 overflow-hidden rounded-md p-2 text-left text-sm transition-colors",
                                            isActive(chatItem.id)
                                                ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                                                : 'text-sidebar-foreground hover:text-sidebar-accent-foreground'
                                        )}
                                    >
                                        <span className="truncate flex-1">{chatItem.title}</span>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-[200px] truncate bg-background text-foreground border border-border shadow-lg">
                                    {chatItem.title}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* Delete Button */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                {/* Ensure button type is button if not submitting form */}
                                <button
                                    type="button"
                                    disabled={deletingChatId === chatItem.id || !isDbAvailable} // Also disable if db is unavailable
                                    className={cn(
                                        "absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover/menu-item:opacity-100 focus:opacity-100 transition-opacity",
                                        "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                                        "disabled:opacity-50 disabled:pointer-events-none",
                                        "h-7 w-7 flex items-center justify-center" // Ensure consistent size
                                    )}
                                    aria-label={`Delete chat: ${chatItem.title}`}
                                    onClick={(e) => e.stopPropagation()} // Keep propagation stop
                                >
                                    {deletingChatId === chatItem.id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={14} />
                                    )}
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the discussion
                                        titled "<span className="font-medium">{chatItem.title}</span>". {/* Updated Text */}
                                        <br />
                                        <strong className="text-destructive">(Note: Full deletion may require backend setup in production)</strong>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={(e: React.MouseEvent) => handleDeleteChat(chatItem.id, e)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        disabled={deletingChatId === chatItem.id || !isDbAvailable}
                                    >
                                        {deletingChatId === chatItem.id ? 'Deleting...' : 'Delete Discussion'} {/* Updated Text */}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                ))}
            </div>


            {/* Footer Section */}
            <div className="mt-auto p-1 md:p-2 border-t border-sidebar-border">
                {/* Show Footer only if user is logged in and no combined error */}
                {user && !combinedError && (
                    <div className="space-y-1">
                        {/* Subscription Dialog */}
                        <Dialog onOpenChange={(open: boolean) => !open && setIsMobileMenuOpen(false)}> {/* Close mobile menu when dialog closes */}
                            <DialogTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground p-2 text-sm">
                                    <Crown size={16} />
                                    <span>Subscription</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl md:text-3xl font-serif font-bold text-primary flex items-center gap-2">
                                        <Crown className="h-7 w-7" /> Subscription Plans
                                    </DialogTitle>
                                    <DialogDescription className="text-base">Choose the plan that best suits your needs.</DialogDescription>
                                </DialogHeader>
                                <SubscriptionDialogContent />
                            </DialogContent>
                        </Dialog>

                        {/* Settings Dialog */}
                        <Dialog onOpenChange={(open: boolean) => !open && setIsMobileMenuOpen(false)}> {/* Close mobile menu when dialog closes */}
                            <DialogTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground p-2 text-sm">
                                    <Settings size={16} />
                                    <span>Settings</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                                        <Settings size={16} className="text-primary" /> Account Settings
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
                            disabled={!auth} // Disable if auth service itself is unavailable
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
                {/* Auth/Init Error in Footer */}
                {combinedError && !authLoading && ( // Show error only if not loading auth
                    <div className="px-2 py-1 text-xs text-destructive flex items-center gap-1 bg-destructive/10 rounded-md">
                        <AlertTriangle size={12} /> {combinedError.length > 30 ? 'Service Error' : combinedError}
                    </div>
                )}
                {/* Show loading indicator for auth check */}
                {authLoading && (
                    <div className="flex items-center justify-center px-2 py-1 text-xs text-muted-foreground">
                        <Loader2 size={14} className="animate-spin mr-1" /> Loading user...
                    </div>
                )}
            </div>
        </>
    );


    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex-col h-screen shadow-lg sticky top-0">
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar Trigger (visible only on mobile) */}
            <div className="md:hidden fixed top-3 left-3 z-50">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm border-border/50 h-9 w-9 p-0"> {/* Adjusted size */}
                            <PanelLeft size={18} />
                            <span className="sr-only">Open Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r border-sidebar-border">
                        <SheetTitle className="sr-only">Main Navigation</SheetTitle>
                        <SheetDescription className="sr-only">Sidebar menu for navigation and chat management.</SheetDescription>
                        <div className="flex flex-col h-full">
                            {sidebarContent}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
