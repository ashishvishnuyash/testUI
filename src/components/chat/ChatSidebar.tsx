'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { collection, addDoc, deleteDoc, doc, getDocs, query, orderBy, onSnapshot, Timestamp, serverTimestamp } from 'firebase/firestore';

import { MessageSquarePlus, LogOut, Crown, Settings, TrendingUp, History, Loader2, Trash2, AlertTriangle, Lock, Clock, Calendar, RefreshCw, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SettingsDialogContent } from '@/components/settings/SettingsDialog';
import { SubscriptionDialogContent } from '@/components/settings/SubscriptionDialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface ChatListItem {
  id: string;
  title: string;
  lastMessageTimestamp: Timestamp | null;
}

async function deleteChatMessages(userId: string, chatId:string) {
  if (!db) {
    console.error("Firestore service is not available for deleting messages.");
    toast({ title: "Error", description: "Database service unavailable.", variant: "destructive"});
    return false;
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
    return true;
  } catch (error) {
    console.error(`Error deleting subcollection messages for chat ${chatId}:`, error);
    toast({ title: "Deletion Error", description: "Could not delete chat messages.", variant: "destructive" });
    return false;
  }
}

interface ChatSidebarProps {
  onNavigate?: () => void;
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function ChatSidebar({ onNavigate, isMobileOpen, setMobileOpen }: ChatSidebarProps) {
  const { user, loading: authLoading, authError } = useAuth();
  const { 
    limits, 
    loading: subLoading, 
    error: subError,
    subscription,
    daysUntilExpiration,
    isExpiringSoon,
    isExpired,
    effectivePlan,
    wasDowngraded,
    lastChecked,
    originalPlan,
    originalPlanName,
    forceCheckExpiration
  } = useSubscription();
  
  const router = useRouter();
  const pathname = usePathname();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [errorChats, setErrorChats] = useState<string | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isRefreshingSubscription, setIsRefreshingSubscription] = useState(false);

  const isDbAvailable = !!db;
  const combinedError = authError || errorChats;

  const hasReachedChatLimit = limits.maxChats !== -1 && chats.length >= limits.maxChats;
  
  const shouldBlockChatCreation = isExpired || hasReachedChatLimit || (wasDowngraded && effectivePlan === 'free_tier');

  const handleRefreshSubscription = async () => {
    setIsRefreshingSubscription(true);
    try {
      await forceCheckExpiration();
      toast({
        title: "Subscription Refreshed",
        description: "Subscription status has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh subscription status.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingSubscription(false);
    }
  };

  const handleLogout = async () => {
     if (!auth) {
        console.error("Logout Error: Firebase Auth service is not initialized.");
        toast({ title: "Logout Error", description: "Authentication service unavailable.", variant: "destructive" });
        return;
      }
    try {
      await signOut(auth);
      router.push('/login');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
      console.error('Logout Error:', error);
      toast({ title: "Logout Error", description: "Failed to log out. Please try again.", variant: "destructive" });
    }
  };

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

    const chatsRef = collection(db!, 'users', user.uid, 'chats');
    const q = query(chatsRef, orderBy('lastMessageTimestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const loadedChats: ChatListItem[] = querySnapshot.docs.map((docSnapshot) => {
         const data = docSnapshot.data();
         if (data && typeof data.title === 'string' && (data.lastMessageTimestamp === null || data.lastMessageTimestamp instanceof Timestamp)) {
            return {
                id: docSnapshot.id,
                title: data.title || 'Untitled Chat',
                lastMessageTimestamp: data.lastMessageTimestamp || null,
            };
         } else {
             console.warn(`[ChatSidebar] Skipping invalid chat document data for doc ${docSnapshot.id}:`, data);
             return null;
         }
      }).filter((chat): chat is ChatListItem => chat !== null);

      setChats(loadedChats);
      setErrorChats(null);
      setLoadingChats(false);
    }, (error) => {
      console.error("[ChatSidebar] Error fetching chats collection: ", error);
      setErrorChats(`Failed to load chats: ${error.message}`);
      setLoadingChats(false);
    });

    return () => {
       unsubscribe();
   };
  }, [user, isDbAvailable, authError]);

  const handleDeleteChat = async (chatIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user || deletingChatId === chatIdToDelete || !isDbAvailable) {
        if(!isDbAvailable) toast({ title: "Error", description: "Database service unavailable.", variant: "destructive"});
        return;
    };

    setDeletingChatId(chatIdToDelete);

    try {
      const messagesDeleted = await deleteChatMessages(user.uid, chatIdToDelete);

      if (messagesDeleted) {
          const chatDocRef = doc(db!, 'users', user.uid, 'chats', chatIdToDelete);
          await deleteDoc(chatDocRef);

          toast({
            title: "Chat Deleted",
            description: "The chat session has been removed.",
          });

          if (pathname === `/chat/${chatIdToDelete}`) {
            router.push('/chat');
          }
      } else {
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

   const handleCreateChat = async () => {
       if (!user || !isDbAvailable || isCreatingChat) {
           if (!isDbAvailable) toast({ title: "Error", description: "Database service unavailable.", variant: "destructive" });
           if (isCreatingChat) toast({ title: "Please wait", description: "Chat creation in progress." });
           return;
       }

       if (shouldBlockChatCreation) {
           setShowUpgradeDialog(true);
             
           if (isExpired) {
               toast({ 
                   title: "Subscription Expired", 
                   description: `Your subscription has expired. You're now on the Free Tier with limited features.`,
                   variant: "destructive"
               });
           } else if (wasDowngraded) {
               toast({ 
                   title: "Subscription Expired", 
                   description: `Your ${originalPlanName || originalPlan} subscription expired. Upgrade to restore full access.`,
                   variant: "destructive"
               });
           } else if (hasReachedChatLimit) {
               toast({ 
                   title: "Chat Limit Reached", 
                   description: `You've reached the maximum of ${limits.maxChats} chats for your ${getPlanDisplayName(effectivePlan)} plan.`,
                   variant: "destructive"
               });
           }
           return;
       }

       setIsCreatingChat(true);
       setErrorChats(null);

       try {
           const chatsRef = collection(db!, 'users', user.uid, 'chats');
           const newChatDoc = await addDoc(chatsRef, {
               title: "New Chat",
               createdAt: serverTimestamp(),
               lastMessageTimestamp: serverTimestamp(),
           });
           toast({ title: "Chat Created", description: "New chat session started." });
           router.push(`/chat/${newChatDoc.id}`);
           if (onNavigate) onNavigate();
       } catch (error) {
           console.error("[ChatSidebar] Error creating new chat:", error);
           setErrorChats(`Failed to create chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
           toast({ title: "Creation Failed", description: "Could not create a new chat.", variant: "destructive" });
       } finally {
           setIsCreatingChat(false);
       }
   };

  const isActive = (chatId: string) => pathname === `/chat/${chatId}`;

  const getPlanDisplayName = (planId: string) => {
    const planNames: Record<string, string> = {
      'free_tier': 'Free Tier',
      'gold_tier': 'Gold Tier',
      'diamond_tier': 'Diamond Tier'
    };
    return planNames[planId] || planId;
  };

  const getExpirationInfo = () => {
    if (!subscription?.endDate) return null;
      
    if (isExpired) {
      return { text: "Expired", variant: "destructive" as const, icon: AlertTriangle };
    }
      
    if (isExpiringSoon) {
      return { 
        text: `${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''} left`, 
        variant: "destructive" as const, 
        icon: Clock 
      };
    }
      
    if (daysUntilExpiration > 7) {
      return { 
        text: `${daysUntilExpiration} days left`, 
        variant: "secondary" as const, 
        icon: Calendar 
      };
    }
      
    return null;
  };

  const expirationInfo = getExpirationInfo();

  const getBlockReason = () => {
    if (isExpired || wasDowngraded) {
      return {
        title: "Subscription Expired",
        description: wasDowngraded 
          ? `Your ${originalPlanName || originalPlan} subscription expired. You're now on Free Tier.`
          : "Your subscription has expired. You're now on the Free Tier.",
        icon: AlertTriangle,
        variant: "destructive" as const
      };
    }
    if (hasReachedChatLimit) {
      return {
        title: "Chat Limit Reached",
        description: `Maximum ${limits.maxChats} chats for ${getPlanDisplayName(effectivePlan)}`,
        icon: Lock,
        variant: "destructive" as const
      };
    }
    return null;
  };

  const blockReason = getBlockReason();

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={cn(
        "w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col h-screen shadow-lg",
        "fixed inset-y-0 left-0 lg:static lg:translate-x-0 z-40 transition-transform duration-300 ease-in-out",
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-sidebar-border">
          <Link href="/chat" className="flex items-center gap-2 font-serif text-lg md:text-xl font-semibold text-primary">
            <TrendingUp className="h-6 w-6 md:h-7 md:w-7 shrink-0" />
            <span className="whitespace-nowrap">StockWhisperer AI</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-2 border-b border-sidebar-border">
            <Button
                variant="ghost"
                className={cn(
                    "w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground p-2 text-sm",
                    shouldBlockChatCreation && "opacity-50 cursor-not-allowed"
                )}
                onClick={handleCreateChat}
                disabled={Boolean(!user || !!combinedError || !isDbAvailable || isCreatingChat || !auth || shouldBlockChatCreation)}
            >
                {isCreatingChat ? (
                    <Loader2 className="h-4 w-4 md:h-5 md:w-5 shrink-0 animate-spin" />
                ) : shouldBlockChatCreation ? (
                    <Lock className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
                ) : (
                    <MessageSquarePlus className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
                )}
                <span>
                    {isCreatingChat ? 'Creating...' : 
                     shouldBlockChatCreation ? 'Upgrade Required' : 'New Discussion'}
                </span>
            </Button>

            {user && !subLoading && (
                <div className="px-2 py-1 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span>Chats:</span>
                        <span className={cn(
                            "font-medium",
                            hasReachedChatLimit ? "text-destructive" : "text-foreground"
                        )}>
                            {chats.length}{limits.maxChats !== -1 ? `/${limits.maxChats}` : ''}
                        </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                            {getPlanDisplayName(effectivePlan)}
                            {(isExpired || wasDowngraded) && subscription?.planId !== 'free_tier' && (
                                <span className="text-destructive">(Expired)</span>
                            )}
                            {lastChecked && (
                                <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <RefreshCw 
                                            className={cn(
                                                "h-2 w-2 cursor-pointer hover:text-primary",
                                                isRefreshingSubscription && "animate-spin"
                                            )}
                                            onClick={handleRefreshSubscription}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs">
                                            Last checked: {lastChecked.toLocaleTimeString()}
                                            <br />Click to refresh
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                                </TooltipProvider>
                            )}
                        </span>
                        {expirationInfo && !isExpired && (
                            <Badge variant={expirationInfo.variant} className="text-xs px-1 py-0 h-4">
                                <expirationInfo.icon className="h-2 w-2 mr-1" />
                                {expirationInfo.text}
                            </Badge>
                        )}
                    </div>
                </div>
            )}

            {blockReason && (
                <Alert className={cn(
                    "mt-2 border-destructive/20 bg-destructive/5",
                    blockReason.variant === "destructive" && "border-destructive/50"
                )}>
                    <blockReason.icon className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                        <div className="font-medium">{blockReason.title}</div>
                        <div className="text-muted-foreground">{blockReason.description}</div>
                    </AlertDescription>
                </Alert>
            )}

            {isExpiringSoon && !isExpired && !hasReachedChatLimit && (
                <Alert className="mt-2 border-yellow-500/20 bg-yellow-500/5">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-xs">
                        <div className="font-medium text-yellow-800">Subscription Expiring</div>
                        <div className="text-yellow-700">Renew in {daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''}</div>
                    </AlertDescription>
                </Alert>
            )}

            {wasDowngraded && (
                <Alert className="mt-2 border-orange-500/20 bg-orange-500/5">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-xs">
                        <div className="font-medium text-orange-800">Plan Downgraded</div>
                        <div className="text-orange-700">
                            Your {originalPlanName || originalPlan} expired. 
                            <button 
                                onClick={() => setShowUpgradeDialog(true)}
                                className="underline ml-1 hover:text-orange-900"
                            >
                                Upgrade now
                            </button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}
        </div>

        <div className="flex-1 overflow-y-auto p-1 md:p-2 space-y-1">
            <h3 className="flex items-center gap-2 px-2 text-xs md:text-sm font-medium text-sidebar-foreground/70 mb-1">
                <History size={14} /> History
            </h3>

            {(loadingChats || subLoading) && (
                <div className="space-y-1 px-1">
                <Skeleton className="h-8 w-full rounded-md" />
                <Skeleton className="h-8 w-full rounded-md" />
                <Skeleton className="h-8 w-full rounded-md" />
                </div>
            )}

            {(errorChats || subError) && !loadingChats && !subLoading && (
                <div className="p-1 md:p-2 text-destructive flex items-center gap-2 text-xs md:text-sm bg-destructive/10 rounded-md mx-1">
                    <AlertTriangle size={14} />
                    <span className="whitespace-normal">{errorChats || subError}</span>
                </div>
            )}

            {!loadingChats && !subLoading && !errorChats && !subError && chats.length === 0 && user && (
                <p className="p-1 md:p-2 text-muted-foreground text-xs md:text-sm text-center italic">
                No chat history yet.
                </p>
            )}

            {!loadingChats && !subLoading && !errorChats && !subError && chats.map((chat) => (
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
                                    onClick={() => { if (onNavigate) onNavigate(); }}
                                >
                                    <span className="truncate flex-1">{chat.title}</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[200px] truncate bg-background text-foreground border border-border shadow-lg">
                                {chat.title}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={Boolean(deletingChatId)}
                                className={cn(
                                    "absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity",
                                    "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                                    "disabled:opacity-50 disabled:pointer-events-none"
                                )}
                                aria-label={`Delete chat: ${chat.title}`}
                                onClick={(e) => e.stopPropagation()}
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

                                disabled={Boolean(deletingChatId === chat.id || !isDbAvailable)}
                                >
                                {deletingChatId === chat.id ? 'Deleting...' : 'Delete Chat'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            ))}
        </div>

        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
            <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle className="text-2xl md:text-3xl font-serif font-bold text-primary flex items-center gap-2">
                <Crown className="h-7 w-7"/> 
                {isExpired || wasDowngraded ? 'Subscription Expired' : 'Upgrade Required'}
                </DialogTitle>
                <DialogDescription className="text-base">
                {isExpired || wasDowngraded 
                    ? `Your ${originalPlanName || originalPlan || 'premium'} subscription has expired. Upgrade to restore full access and create new discussions.`
                    : "You've reached your chat limit. Upgrade to continue creating new discussions."
                }
                </DialogDescription>
            </DialogHeader>
            <SubscriptionDialogContent  />
            </DialogContent>
        </Dialog>

        <div className="mt-auto p-1 md:p-2 border-t border-sidebar-border">
            {user && !authError && (
                <div className="space-y-1">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground p-2 text-sm">
                                <Crown size={16}/>
                                <span className="flex-1 text-left">Subscription</span>
                                {(isExpired || wasDowngraded) && (
                                    <Badge variant="destructive" className="text-xs px-1 py-0 h-4">
                                        Expired
                                    </Badge>
                                )}
                                {isExpiringSoon && !isExpired && (
                                    <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                                        {daysUntilExpiration}d
                                    </Badge>
                                )}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-3xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl md:text-3xl font-serif font-bold text-primary flex items-center gap-2">
                                    <Crown className="h-7 w-7"/> Subscription Plans
                                </DialogTitle>
                                <DialogDescription className="text-base">Choose the plan that best suits your needs.</DialogDescription>
                            </DialogHeader>
                            <SubscriptionDialogContent  />
                        </DialogContent>
                    </Dialog>

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

                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        disabled={!auth}
                        className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground p-2 text-sm"
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </Button>

                    <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground border-t border-sidebar-border pt-2 mt-1">
                        <Avatar className="h-6 w-6">
                        {user.photoURL ? (
                            <AvatarImage src={user.photoURL} alt={user.displayName || user.email || 'User'} />
                        ) : null}
                            <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-accent-foreground">
                                {user.email ? user.email[0].toUpperCase() : '?'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 truncate">
                            <div className="truncate">{user.email}</div>
                            {subscription && (
                                <div className="text-xs text-muted-foreground/70 flex items-center gap-1">
                                    <span>{getPlanDisplayName(effectivePlan)}</span>
                                    {(isExpired || wasDowngraded) && (
                                        <Badge variant="destructive" className="text-xs px-1 py-0 h-3">
                                            Expired
                                        </Badge>
                                    )}
                                    {isExpiringSoon && !isExpired && (
                                        <Badge variant="secondary" className="text-xs px-1 py-0 h-3">
                                            {daysUntilExpiration}d left
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {authError && (
                <div className="px-2 py-1 text-xs text-destructive flex items-center gap-1 bg-destructive/10 rounded-md">
                <AlertTriangle size={12}/> Auth Error
                </div>
            )}
            {authLoading && (
                <div className="flex items-center justify-center px-2 py-1 text-xs text-muted-foreground">
                    <Loader2 size={14} className="animate-spin mr-1"/> Loading user...
                </div>
            )}
        </div>
      </aside>
    </>
  );
}
