'use client';

import type { FormEvent } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, Timestamp, updateDoc, doc, getDocs, limit, getDoc } from 'firebase/firestore';
import { db, auth, initializationError } from '@/lib/firebase/config';
import { generateGeminiChatMessage } from '@/app/actions/chatActions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SendHorizonal, Loader2, BrainCircuit, User, AlertTriangle, DatabaseZap, Crown, Zap, Paperclip, X } from 'lucide-react';
import ChatMessage from './ChatMessage';
import type { MessageData, SimpleHistoryMessage, MessageContentPart } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar as UIAvatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  addTokenUsage, 
  checkTokenLimit, 
  canUserUseTokens, 
  getTokenUsageSummary, 
  estimateTokens,
  initializeUserTokenUsage 
} from '@/lib/firebase/tokenUsage';
import { useSubscription } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';

interface ChatAreaProps {
  chatId: string;
}

interface TokenLimitInfo {
  canProceed: boolean;
  remainingTokens: number;
  currentUsage: number;
  limit: number;
  percentage: number;
  isUnlimited: boolean;
  effectivePlan: string;
}

export default function ChatArea({ chatId }: ChatAreaProps) {
  const { user, authError: contextAuthError } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<{ file: File; url: string; type: string } | null>(null);
  const [tokenLimitInfo, setTokenLimitInfo] = useState<TokenLimitInfo | null>(null);
  const [tokenLimitError, setTokenLimitError] = useState<string | null>(null);
  
  const isDbAvailable = !!db;
  const isAuthAvailable = !!auth;
  const combinedError = initializationError || contextAuthError || (!isDbAvailable ? "Database service unavailable." : null) || (!isAuthAvailable ? "Authentication service unavailable." : null);
  const [error, setError] = useState<string | null>(combinedError);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(false);

  // --- Scrolling ---
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const viewport = scrollAreaViewportRef.current;
    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior });
      });
    }
  }, []);

  // --- Track Mount State ---
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // --- Token Limit Check Effect ---
  useEffect(() => {
    const checkUserTokenLimit = async () => {
      if (!user || subscriptionLoading) return;

      try {
        setTokenLimitError(null);
        
        const tokenSummary = await getTokenUsageSummary(user.uid, subscription);
        
        setTokenLimitInfo({
          canProceed: tokenSummary.isUnlimited || tokenSummary.remaining > 0,
          remainingTokens: tokenSummary.remaining,
          currentUsage: tokenSummary.currentUsage,
          limit: tokenSummary.limit,
          percentage: tokenSummary.percentage,
          isUnlimited: tokenSummary.isUnlimited,
          effectivePlan: tokenSummary.effectivePlan,
        });
      } catch (error) {
        console.error('Error checking token limit:', error);
        setTokenLimitError('Failed to check token usage limits');
      }
    };

    checkUserTokenLimit();
  }, [user, subscription, subscriptionLoading]);

  // --- File Handling ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are currently supported.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File size cannot exceed 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUrl = loadEvent.target?.result as string;
        setAttachment({
          file: file,
          url: dataUrl,
          type: file.type,
        });
        setError(null);
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
      };
      reader.readAsDataURL(file);
    }
    // Reset file input to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
  };

  // --- Firestore Listener & Initial Load ---
  useEffect(() => {
    if (initializationError) {
      setError(`Initialization failed: ${initializationError}`);
      setIsLoading(false); setMessages([]); return;
    }
    if (contextAuthError) {
      setError(`Auth error: ${contextAuthError}`);
      setIsLoading(false); setMessages([]); return;
    }
    if (!isDbAvailable) {
      setError("Database service unavailable.");
      setIsLoading(false); setMessages([]); return;
    }
    if (!isAuthAvailable) {
      setError("Authentication service unavailable.");
      setIsLoading(false); setMessages([]); return;
    }
    if (!user) {
      setError(null);
      setIsLoading(false);
      setMessages([]);
      // console.log("[ChatArea Listener] No user logged in, listener stopped.");
      return;
    }
    if (!chatId) {
      setError("Chat ID missing.");
      setIsLoading(false); setMessages([]);
      console.error("[ChatArea Listener] Chat ID is missing.");
      return;
    }

    // console.log(`[ChatArea Listener] Setting up for chatId: ${chatId}, User: ${user.uid}`);
    setError(null);
    setIsLoading(true);

    if (!db) {
      console.error('[ChatArea] Firestore instance is null');
      setError('Database connection error');
      setIsLoading(false);
      return;
    }

    const messagesRef = collection(db, 'users', user.uid, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    let initialLoad = true;

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!isMounted.current) return;
      
      // console.log(`[ChatArea Listener] Snapshot received with ${querySnapshot.docs.length} docs for chatId: ${chatId }`);
      const loadedMessages: MessageData[] = querySnapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          if (data && (data.role === 'user' || data.role === 'model' || data.role === 'system') && Array.isArray(data.content) && (data.timestamp instanceof Timestamp || data.timestamp === null) ) {
            // Basic validation for content parts
            const isValidContent = data.content.every((c: any) => (typeof c.text === 'string' || typeof c.text === 'undefined') && (typeof c.imageUrl === 'string' || typeof c.imageUrl === 'undefined'));
            if (isValidContent) {
              return {
                id: docSnap.id,
                role: data.role,
                content: data.content,
                timestamp: data.timestamp instanceof Timestamp ? data.timestamp : null,
              };
            }
          }
          console.warn(`[ChatArea Listener] Skipping invalid message data for doc ${docSnap.id}:`, data);
          return null;
        })
        .filter((msg): msg is MessageData => msg !== null);

      setMessages(loadedMessages);
      setError(null);
      setIsLoading(false);

      if (initialLoad) {
        setTimeout(() => scrollToBottom('auto'), 50);
        initialLoad = false;
      }

    }, (snapshotError) => {
      if (!isMounted.current) return;
      console.error(`[ChatArea Listener] Error fetching messages for chatId ${chatId}:`, snapshotError);
      setError(`Failed to load messages: ${snapshotError.message}`);
      setMessages([]);
      setIsLoading(false);
    });

    const checkAndUpdateTitle = async () => {
      if (!isMounted.current || !db || !user || !chatId) return;

      const chatDocRef = doc(db, 'users', user.uid, 'chats', chatId);
      const messagesColRef = collection(db, 'users', user.uid, 'chats', chatId, 'messages');
      try {
        const chatDocSnap = await getDoc(chatDocRef);
        if (chatDocSnap.exists() && chatDocSnap.data().title === "New Chat") {
          const firstMessageQuery = query(messagesColRef, orderBy('timestamp', 'asc'), limit(1));
          const firstMessageSnapshot = await getDocs(firstMessageQuery);
          const firstUserMessage = firstMessageSnapshot.docs.find(doc => doc.data().role === 'user');
          const firstMessageText = firstUserMessage?.data()?.content?.[0]?.text;

          if (firstMessageText) {
            const newTitle = firstMessageText.length > 30 ? firstMessageText.substring(0, 27) + '...' : firstMessageText;
            // console.log(`[ChatArea] Updating initial chat title via fetch to: "${newTitle}" for chatId ${chatId}`);
            await updateDoc(chatDocRef, { title: newTitle, lastMessageTimestamp: serverTimestamp() });
          } else {
            console.log(`[ChatArea] No user messages found yet to update title for chatId ${chatId}.`);
          }
        }
      } catch (titleError) {
        console.error(`[ChatArea] Error checking/updating chat title for ${chatId}:`, titleError);
      }
    };

    const titleCheckTimeout = setTimeout(checkAndUpdateTitle, 1500);

    return () => {
      // console.log(`[ChatArea Listener] Unsubscribing for chatId: ${chatId}`);
      unsubscribe();
      clearTimeout(titleCheckTimeout);
    };
  }, [user, chatId, isDbAvailable, isAuthAvailable, contextAuthError, initializationError, scrollToBottom]);

  useEffect(() => {
    if (messages.length > 0 && isMounted.current) {
      scrollToBottom('smooth');
    }
  }, [messages.length, scrollToBottom]);

  // --- Message Sending Logic ---
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const currentInput = input.trim();
    
    if (initializationError || contextAuthError || !isDbAvailable || !isAuthAvailable || !user || !chatId) {
      setError(combinedError || "Cannot send message due to configuration or auth issue.");
      console.warn('[ChatArea Send] Prerequisites failed:', { combinedError, user: !!user, chatId });
      return;
    }
    if (!currentInput || isLoading) {
      console.warn('[ChatArea Send] Send prevented:', { currentInput, isLoading });
      return;
    }
    // A prompt is required even with an attachment
    if (!currentInput.trim() && attachment) {
      setError("Please provide a prompt to go with your attachment.");
      return;
    }

    if (!tokenLimitInfo?.isUnlimited && tokenLimitInfo && !tokenLimitInfo.canProceed) {
      setError(`Token limit reached. You've used ${tokenLimitInfo.currentUsage}/${tokenLimitInfo.limit} tokens this month. Please upgrade your subscription to continue.`);
      return;
    }

    const estimatedTokens = estimateTokens(currentInput);
    if (!tokenLimitInfo?.isUnlimited && tokenLimitInfo && tokenLimitInfo.remainingTokens < estimatedTokens) {
      setError(`Not enough tokens remaining. This message requires ~${estimatedTokens} tokens, but you only have ${tokenLimitInfo.remainingTokens} remaining.`);
      return;
    }

    setInput('');
    setIsLoading(true);
    setIsAnalyzing(true); // Set analyzing state
    setError(null);
    setAttachment(null); // Clear attachment immediately when sending

    const optimisticUserMessageContent: MessageContentPart[] = [{ text: currentInput }];
    if (attachment) {
      optimisticUserMessageContent.push({ imageUrl: attachment.url });
    }

    const optimisticUserMessage: Omit<MessageData, 'timestamp' | 'id'> = {
      role: 'user',
      content: optimisticUserMessageContent,
    };

    const historyForAI: SimpleHistoryMessage[] = messages
      .filter(msg => msg.role === 'user' || msg.role === 'model')
      .map(msg => ({
        role: msg.role as 'user' | 'model',
        content: msg.content
          .filter(part => typeof part.text === 'string') // Only include text parts in history
          .map(part => ({ text: part.text! })),
      }));

    const tempUserMessageId = `temp-user-${Date.now()}`;
    setMessages(prev => [...prev, { ...optimisticUserMessage, id: tempUserMessageId, timestamp: null }]);
    scrollToBottom('smooth');

    let userDocRefId: string | null = null;
    try {
      if (!db || !user) throw new Error("Database or user context lost before sending.");

      const messagesRef = collection(db, 'users', user.uid, 'chats', chatId, 'messages');
      const userMessagePayload = {
        ...optimisticUserMessage,
        timestamp: serverTimestamp(),
      };
      const docRef = await addDoc(messagesRef, userMessagePayload);
      userDocRefId = docRef.id;
      // console.log(`[ChatArea] User message added to Firestore (ID: ${userDocRefId}) for chatId ${chatId}`);

      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessageId));

      const chatDocRef = doc(db, 'users', user.uid, 'chats', chatId);

      const chatSnap = await getDoc(chatDocRef);
      let titleUpdate = {};
      if (chatSnap.exists() && chatSnap.data().title === "New Chat") {
        const newTitle = currentInput.length > 30 ? currentInput.substring(0, 27) + '...' : currentInput;
        titleUpdate = { title: newTitle };
        // console.log(`[ChatArea] Updating chat title to: "${newTitle}" on first message send.`);
      }

      await updateDoc(chatDocRef, {
        lastMessageTimestamp: serverTimestamp(),
        ...titleUpdate
      });
      // console.log(`[ChatArea] Updated chat metadata for chatId ${chatId}.`);

      // Add analyzing message temporarily
      const tempAnalyzingMessageId = `temp-analyzing-${Date.now()}`;
      const analyzingMessage: MessageData = {
        id: tempAnalyzingMessageId,
        role: 'model',
        content: [{ text: '' }], // Empty content for analyzing state
        timestamp: null,
      };
      setMessages(prev => [...prev, analyzingMessage]);
      scrollToBottom('smooth');

      // console.log('[ChatArea] Calling Gemini AI action...');
      const aiInput = { 
        prompt: currentInput, 
        history: historyForAI,
        attachment: attachment ? { base64Data: attachment.url, mimeType: attachment.type } : undefined,
      };
      const aiOutput = await generateGeminiChatMessage(aiInput);

      // Remove analyzing message
      setMessages(prev => prev.filter(msg => msg.id !== tempAnalyzingMessageId));
      setIsAnalyzing(false);

      if (aiOutput.response) {
        const aiMessagePayload = {
          role: 'model',
          content: [{ text: aiOutput.response }],
          timestamp: serverTimestamp(),
        };
        await addDoc(messagesRef, aiMessagePayload);
        // console.log('[ChatArea] AI response added to Firestore.');
        
        await updateDoc(chatDocRef, { lastMessageTimestamp: serverTimestamp() });
        
        const actualTokensUsed = aiOutput.tokenCount || estimatedTokens;
        const tokenResult = await addTokenUsage(
          user.uid, 
          actualTokensUsed, 
          chatId, 
          subscription, 
          currentInput
        );
        
        if (tokenResult.success) {
          // console.log(`[ChatArea] Token usage tracked: ${actualTokensUsed} tokens`);
          const updatedSummary = await getTokenUsageSummary(user.uid, subscription);
          setTokenLimitInfo({
            canProceed: updatedSummary.isUnlimited || updatedSummary.remaining > 0,
            remainingTokens: updatedSummary.remaining,
            currentUsage: updatedSummary.currentUsage,
            limit: updatedSummary.limit,
            percentage: updatedSummary.percentage,
            isUnlimited: updatedSummary.isUnlimited,
            effectivePlan: updatedSummary.effectivePlan,
          });
        } else {
          console.warn('[ChatArea] Failed to track token usage:', tokenResult.error);
        }
        
        setError(null);

      } else {
        const aiErrorMsg = aiOutput.error || "AI failed to generate a valid response.";
        console.warn('[ChatArea] AI response was empty or an error message:', {aiErrorMsg});
        setError(aiErrorMsg);
      }

    } catch (err) {
      console.error('[ChatArea] Error sending message or getting AI response:', err);
      const errorMsg = `Failed to process message: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessageId || msg.id.startsWith('temp-analyzing')));
      if (!userDocRefId) {
        setInput(currentInput);
      }
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  };

  // --- Token Usage Display Component ---
  const TokenUsageDisplay = () => {
    if (!tokenLimitInfo || tokenLimitInfo.isUnlimited) return null;

    const isNearLimit = tokenLimitInfo.percentage > 80;
    const isAtLimit = !tokenLimitInfo.canProceed;

    return (
      <div className="px-3 lg:px-4 py-2 lg:py-3 bg-muted/30 border-b border-border/50">
        <div className="flex items-center justify-between text-xs lg:text-sm">
          <div className="flex items-center gap-2">
            <Badge 
              variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "outline"}
              className="text-xs px-2 py-1"
            >
              <Zap className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">
                {tokenLimitInfo.effectivePlan.replace('_', ' ').toUpperCase()}
              </span>
              <span className="sm:hidden">
                {tokenLimitInfo.effectivePlan.split('_')[0].toUpperCase()}
              </span>
            </Badge>
            <span className="text-muted-foreground hidden sm:inline">
              {tokenLimitInfo.currentUsage.toLocaleString()} / {tokenLimitInfo.limit.toLocaleString()} tokens
            </span>
            <span className="text-muted-foreground sm:hidden text-xs">
              {Math.round(tokenLimitInfo.currentUsage / 1000)}k / {Math.round(tokenLimitInfo.limit / 1000)}k
            </span>
          </div>
          <span className={cn(
            "font-medium text-xs lg:text-sm",
            isAtLimit ? "text-destructive" : isNearLimit ? "text-orange-500" : "text-muted-foreground"
          )}>
            <span className="hidden sm:inline">{tokenLimitInfo.remainingTokens.toLocaleString()} remaining</span>
            <span className="sm:hidden">{Math.round(tokenLimitInfo.remainingTokens / 1000)}k left</span>
          </span>
        </div>
        <Progress 
          value={tokenLimitInfo.percentage} 
          className={cn(
            "mt-2 h-1.5 lg:h-2",
            isAtLimit ? "bg-destructive/20" : isNearLimit ? "bg-orange-500/20" : ""
          )}
        />
        {isAtLimit && (
          <p className="text-xs text-destructive mt-2">
            <span className="hidden sm:inline">Token limit reached. Upgrade your subscription to continue chatting.</span>
            <span className="sm:hidden">Token limit reached. Upgrade to continue.</span>
          </p>
        )}
      </div>
    );
  };

  // --- Render ---
  const inputDisabled = Boolean(isLoading || !!combinedError || (tokenLimitInfo && !tokenLimitInfo.canProceed && !tokenLimitInfo.isUnlimited));
  const placeholderText = tokenLimitInfo && !tokenLimitInfo.canProceed && !tokenLimitInfo.isUnlimited 
    ? "Token limit reached - upgrade to continue..." 
    : inputDisabled 
    ? "Chat unavailable..." 
    : attachment 
    ? "Add a prompt for your image..."
    : "Ask StockWhisperer AI anything...";

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-secondary/5 to-background">
      {/* Sticky Error/Status Area */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border/50">
        {error && (
          <div className="p-3 lg:p-4">
            <Alert variant="destructive" className="text-sm p-3 lg:p-4 rounded-md border-x-0 border-t-0">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-semibold text-sm lg:text-base">Error</AlertTitle>
              <AlertDescription className="text-xs lg:text-sm mt-1">{error}</AlertDescription>
            </Alert>
          </div>
        )}
        
        {tokenLimitError && (
          <div className="p-3 lg:p-4">
            <Alert variant="destructive" className="text-sm p-3 lg:p-4 rounded-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-semibold text-sm lg:text-base">Token Usage Error</AlertTitle>
              <AlertDescription className="text-xs lg:text-sm mt-1">{tokenLimitError}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Token Usage Display */}
        <TokenUsageDisplay />
      </div>

      {/* Scrollable Message Area */}
      <ScrollArea className="flex-1 overflow-y-auto" viewportRef={scrollAreaViewportRef}>
        <div className="p-2 sm:p-3 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6 pb-safe">
          {messages.length === 0 && isLoading && !error && (
            <div className="flex justify-center items-center h-full py-12 lg:py-20">
              <Loader2 className="h-6 w-6 lg:h-8 lg:w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground text-sm lg:text-base">Loading messages...</p>
            </div>
          )}
          {messages.length === 0 && !isLoading && !error && (
            <div className="text-center py-12 lg:py-20 space-y-4 lg:space-y-6">
              <p className="text-muted-foreground italic text-sm lg:text-base">
                Start the conversation!
              </p>
              {tokenLimitInfo && !tokenLimitInfo.isUnlimited && (
                <div className="text-xs lg:text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 lg:p-6 max-w-md mx-auto">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Crown className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span className="font-medium">Token Usage</span>
                  </div>
                  <p className="text-center">
                    You have <span className="font-medium text-foreground">{tokenLimitInfo.remainingTokens.toLocaleString()}</span> tokens 
                    remaining on your <span className="font-medium">{tokenLimitInfo.effectivePlan.replace('_', ' ')}</span> plan.
                  </p>
                </div>
              )}
            </div>
          )}
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              currentUser={user} 
              isAnalyzing={isAnalyzing && message.id.startsWith('temp-analyzing')}
            />
          ))}
          {/* Show analyzing indicator when AI is processing */}
          {isAnalyzing && messages.length > 0 && messages[messages.length - 1].role === 'user' && !error && (
            <div className="flex justify-start items-start gap-3 lg:gap-4">
              <UIAvatar className="h-8 w-8 lg:h-10 lg:w-10 border-2 border-primary shadow-md flex-shrink-0">
                <AvatarFallback className="bg-primary/10">
                  <BrainCircuit className="h-4 w-4 lg:h-5 lg:w-5 text-primary animate-pulse" />
                </AvatarFallback>
              </UIAvatar>
              <div className="bg-card text-card-foreground p-3 lg:p-4 rounded-lg rounded-bl-none shadow-md max-w-[85%] lg:max-w-[80%] animate-pulse">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-primary font-medium text-sm lg:text-base">Analyzing...</span>
                  </div>
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    StockWhisperer AI is processing your request and gathering insights...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Form Area */}
      <div className="border-t p-2 sm:p-3 lg:p-4 border-border mt-auto bg-background pb-safe sticky bottom-0 z-20">
        {attachment && (
          <div className="relative w-24 h-24 mb-2 border rounded-md p-1">
            <Image src={attachment.url} alt="Attachment preview" layout="fill" objectFit="cover" className="rounded-md" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 h-6 w-6 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={() => setAttachment(null)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove attachment</span>
            </Button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-end gap-2 lg:gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 h-11 w-11 lg:h-12 lg:w-12"
            onClick={() => fileInputRef.current?.click()}
            disabled={!!inputDisabled}
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5 lg:h-6 lg:w-6" />
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            disabled={!!inputDisabled}
          />
          <div className="flex-1 min-w-0">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholderText}
              className={cn(
                "w-full bg-background focus:ring-2 focus:ring-accent focus:ring-offset-0 disabled:cursor-not-allowed text-sm lg:text-base min-h-[44px] lg:min-h-[48px] px-3 lg:px-4",
                inputDisabled && "opacity-60"
              )}
              disabled={Boolean(inputDisabled)}
              aria-label="Chat input"
              autoComplete="off"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            className={cn(
              "bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-md relative shrink-0 h-11 w-11 lg:h-12 lg:w-12",
              inputDisabled && "opacity-60 cursor-not-allowed"
            )}
            disabled={inputDisabled || (!input.trim() && !attachment)}
            aria-label="Send message"
          >
            {isLoading ? (
             <Loader2 className="h-5 w-5 lg:h-6 lg:w-6 animate-spin" />
            ) : (
              <SendHorizonal className="h-5 w-5 lg:h-6 lg:w-6" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
