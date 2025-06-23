'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { TrendingUp, MessageSquarePlus, Loader2, Menu } from "lucide-react";
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import { useSubscription } from '@/hooks/useSubscription';

export default function ChatIndexPage() {
  const { setSidebarOpen } = useMobileSidebar();
  const { user } = useAuth();
  const { limits, isExpired, wasDowngraded, effectivePlan } = useSubscription();
  const router = useRouter();
  
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  
  // This logic should be kept in sync with ChatSidebar's handleCreateChat
  const handleCreateChat = async () => {
    if (!user || !db || isCreatingChat) {
      if (!db) toast({ title: "Error", description: "Database service unavailable.", variant: "destructive" });
      return;
    }

    // This check is simplified. For full validation, a shared hook would be better.
    const chatsCollection = collection(db, 'users', user.uid, 'chats');
    const chatsSnapshot = await getDocs(chatsCollection);
    const hasReachedChatLimit = limits.maxChats !== -1 && chatsSnapshot.size >= limits.maxChats;
    const shouldBlockChatCreation = isExpired || hasReachedChatLimit || (wasDowngraded && effectivePlan === 'free_tier');

    if (shouldBlockChatCreation) {
      toast({
        title: "Upgrade Required",
        description: hasReachedChatLimit 
          ? `You have reached the chat limit for the ${effectivePlan} plan.` 
          : "Your subscription has expired or was downgraded.",
        variant: "destructive"
      });
      // In a real app, you might want to open the upgrade dialog here
      return;
    }

    setIsCreatingChat(true);
    try {
      const newChatDoc = await addDoc(chatsCollection, {
        title: "New Chat",
        createdAt: serverTimestamp(),
        lastMessageTimestamp: serverTimestamp(),
      });
      toast({ title: "Chat Created", description: "New chat session started." });
      router.push(`/chat/${newChatDoc.id}`);
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast({ title: "Creation Failed", description: "Could not create a new chat.", variant: "destructive" });
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center p-2 border-b border-border/50 bg-background/90 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open sidebar</span>
        </Button>
      </div>
      
      <div className="flex flex-1 items-center justify-center p-4 md:p-8 bg-gradient-to-br from-background via-secondary/30 to-background">
        <Card className="w-full max-w-md text-center shadow-lg border border-border/50">
          <CardHeader>
            <TrendingUp className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl font-serif text-primary">Welcome to StockWhisperer AI</CardTitle>
            <CardDescription className="text-muted-foreground">
              Select a discussion from the sidebar or start a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreateChat} disabled={isCreatingChat || !user}>
              {isCreatingChat ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MessageSquarePlus className="mr-2 h-4 w-4" />
              )}
              Start New Discussion
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
