'use client';

import type { FormEvent } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, Timestamp, updateDoc, doc, getDocs, limit, getDoc } from 'firebase/firestore'; // Added getDoc, limit
import { db, auth, initializationError } from '@/lib/firebase/config'; // Import auth and initError
import { generateGeminiChatMessage } from '@/app/actions/chatActions'; // Use the direct Gemini action
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SendHorizonal, Loader2, BrainCircuit, User, AlertTriangle, DatabaseZap } from 'lucide-react';
import ChatMessage from './ChatMessage'; // Separate component for message rendering
import type { MessageData, SimpleHistoryMessage } from '@/lib/types'; // Shared message type
import { cn } from '@/lib/utils';
import { Avatar as UIAvatar, AvatarFallback } from '@/components/ui/avatar'; // Renamed import

interface ChatAreaProps {
  chatId: string;
}


export default function ChatArea({ chatId }: ChatAreaProps) {
  const { user, authError: contextAuthError } = useAuth(); // Get auth context error
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Combined loading state for Firestore and AI
  const [input, setInput] = useState('');
  // Combine initialization error with context auth error and db/auth status
  const isDbAvailable = !!db;
  const isAuthAvailable = !!auth;
  const combinedError = initializationError || contextAuthError || (!isDbAvailable ? "Database service unavailable." : null) || (!isAuthAvailable ? "Authentication service unavailable." : null);
  const [error, setError] = useState<string | null>(combinedError); // Initial error state
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null); // Ref for the scroll area viewport
  const isMounted = useRef(false); // Track mount state

  // --- Scrolling ---
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
      const viewport = scrollAreaViewportRef.current;
      if (viewport) {
          // Use requestAnimationFrame for smoother scrolling after state updates
          requestAnimationFrame(() => {
             viewport.scrollTo({ top: viewport.scrollHeight, behavior });
          });
      }
  }, []); // Empty dependency array as the ref itself doesn't change

  // --- Track Mount State ---
   useEffect(() => {
       isMounted.current = true;
       return () => { isMounted.current = false; }; // Cleanup on unmount
   }, []);

  // --- Firestore Listener & Initial Load ---
  useEffect(() => {
    // Check all prerequisites first
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
        setError(null); // Not an error if user is just not logged in yet
        setIsLoading(false);
        setMessages([]);
        console.log("[ChatArea Listener] No user logged in, listener stopped.");
        return;
    }
     if (!chatId) {
        setError("Chat ID missing.");
        setIsLoading(false); setMessages([]);
        console.error("[ChatArea Listener] Chat ID is missing.");
        return;
     }

    console.log(`[ChatArea Listener] Setting up for chatId: ${chatId}, User: ${user.uid}`);
    setError(null); // Clear previous errors if prerequisites met
    setIsLoading(true); // Indicate loading messages initially

    if (!db) {
        console.error('[ChatArea] Firestore instance is null');
        setError('Database connection error');
        setIsLoading(false);
        return;
    }

    const messagesRef = collection(db, 'users', user.uid, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    let initialLoad = true; // Flag for initial data load

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!isMounted.current) return; // Prevent updates if unmounted

      console.log(`[ChatArea Listener] Snapshot received with ${querySnapshot.docs.length} docs for chatId: ${chatId}`);
      const loadedMessages: MessageData[] = querySnapshot.docs
        .map((docSnap) => { // Renamed variable
          const data = docSnap.data();
          // Validate data shape - basic check
          if (data && (data.role === 'user' || data.role === 'model' || data.role === 'system') && Array.isArray(data.content) && data.content.every(c => typeof c.text === 'string') && (data.timestamp instanceof Timestamp || data.timestamp === null) ) { // Allow null timestamp
              return {
                id: docSnap.id,
                role: data.role,
                content: data.content,
                // Ensure timestamp is either a Timestamp or null
                timestamp: data.timestamp instanceof Timestamp ? data.timestamp : null,
              };
          } else {
              console.warn(`[ChatArea Listener] Skipping invalid message data for doc ${docSnap.id}:`, data);
              return null; // Filter out invalid messages
          }
        })
        .filter((msg): msg is MessageData => msg !== null); // Type guard to remove nulls

      setMessages(loadedMessages);
      setError(null); // Clear errors on successful load
      setIsLoading(false); // Stop loading indicator (Firestore load done)

      // Scroll on initial load only
      if (initialLoad) {
         // Use timeout to ensure DOM is updated
         setTimeout(() => scrollToBottom('auto'), 50);
         initialLoad = false; // Prevent auto scroll on subsequent updates from listener
      }

    }, (snapshotError) => {
      if (!isMounted.current) return; // Prevent updates if unmounted
      console.error(`[ChatArea Listener] Error fetching messages for chatId ${chatId}:`, snapshotError);
      setError(`Failed to load messages: ${snapshotError.message}`);
      setMessages([]);
      setIsLoading(false);
    });

    // --- Initial Title Update (only if title is "New Chat") ---
     const checkAndUpdateTitle = async () => {
         if (!isMounted.current || !db || !user || !chatId) return; // Check mount and prerequisites

         const chatDocRef = doc(db, 'users', user.uid, 'chats', chatId);
         const messagesColRef = collection(db, 'users', user.uid, 'chats', chatId, 'messages');
         try {
             const chatDocSnap = await getDoc(chatDocRef);
             if (chatDocSnap.exists() && chatDocSnap.data().title === "New Chat") {
                 // Fetch first message only if needed (rely on listener to populate 'messages' state)
                 const firstMessageQuery = query(messagesColRef, orderBy('timestamp', 'asc'), limit(1));
                 const firstMessageSnapshot = await getDocs(firstMessageQuery);
                 const firstUserMessage = firstMessageSnapshot.docs.find(doc => doc.data().role === 'user');
                 const firstMessageText = firstUserMessage?.data()?.content?.[0]?.text;


                 if (firstMessageText) {
                     const newTitle = firstMessageText.length > 30 ? firstMessageText.substring(0, 27) + '...' : firstMessageText;
                     console.log(`[ChatArea] Updating initial chat title via fetch to: "${newTitle}" for chatId ${chatId}`);
                     await updateDoc(chatDocRef, { title: newTitle, lastMessageTimestamp: serverTimestamp() });
                 } else {
                     console.log(`[ChatArea] No user messages found yet to update title for chatId ${chatId}.`);
                 }
             }
         } catch (titleError) {
             console.error(`[ChatArea] Error checking/updating chat title for ${chatId}:`, titleError);
         }
     };

     // Delay title check slightly to allow listener to potentially populate messages first
     const titleCheckTimeout = setTimeout(checkAndUpdateTitle, 1500);


    return () => {
        console.log(`[ChatArea Listener] Unsubscribing for chatId: ${chatId}`);
        unsubscribe();
        clearTimeout(titleCheckTimeout); // Clear the timeout on unmount
    };
    // Include all dependencies checked at the start
  }, [user, chatId, isDbAvailable, isAuthAvailable, contextAuthError, initializationError, scrollToBottom]); // Added scrollToBottom

   // Scroll to bottom when messages array length increases (new message added)
   useEffect(() => {
       // Only scroll smoothly if messages are added, not on initial load
       if (messages.length > 0 && isMounted.current) { // Check isMounted
           scrollToBottom('smooth');
       }
   }, [messages.length, scrollToBottom]); // Trigger only when the number of messages changes


  // --- Message Sending Logic ---
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const currentInput = input.trim();

    // Check all prerequisites before sending
    if (initializationError || contextAuthError || !isDbAvailable || !isAuthAvailable || !user || !chatId) {
        setError(combinedError || "Cannot send message due to configuration or auth issue.");
        console.warn('[ChatArea Send] Prerequisites failed:', { combinedError, user: !!user, chatId });
        return;
    }
    if (!currentInput || isLoading) {
        console.warn('[ChatArea Send] Send prevented:', { currentInput, isLoading });
        return; // Don't send empty messages or while AI is responding
    }

    setInput(''); // Clear input immediately
    setIsLoading(true); // Set loading for AI response generation
    setError(null); // Clear previous send errors

    // Optimistic UI update for user message (no timestamp needed here)
    const optimisticUserMessage: Omit<MessageData, 'timestamp' | 'id'> = {
      role: 'user',
      content: [{ text: currentInput }],
    };

    // --- Create SimpleHistoryMessage array *before* adding the optimistic message ---
    const historyForAI: SimpleHistoryMessage[] = messages
       .filter(msg => msg.role === 'user' || msg.role === 'model') // Filter only user/model roles
       .map(msg => ({
           role: msg.role as 'user' | 'model',
           content: Array.isArray(msg.content) ? msg.content.map(part => ({ text: part.text || '' })) : [{ text: String(msg.content) }],
       }));


    // Temporarily add optimistic message to state for immediate display
     const tempUserMessageId = `temp-user-${Date.now()}`;
     setMessages(prev => [...prev, { ...optimisticUserMessage, id: tempUserMessageId, timestamp: null }]);
     scrollToBottom('smooth'); // Scroll after adding optimistic message

    // Add user message to Firestore
    let userDocRefId: string | null = null;
    try {
        // Double-check db and user again just before the write
        if (!db || !user) throw new Error("Database or user context lost before sending.");

        const messagesRef = collection(db, 'users', user.uid, 'chats', chatId, 'messages');
        const userMessagePayload = {
            ...optimisticUserMessage, // Use the structure from optimistic message
            timestamp: serverTimestamp(),
        };
        const docRef = await addDoc(messagesRef, userMessagePayload);
        userDocRefId = docRef.id; // Store the actual ID
        console.log(`[ChatArea] User message added to Firestore (ID: ${userDocRefId}) for chatId ${chatId}`);

         // Remove the temporary optimistic message now that the real one is in Firestore
         // (The listener will add the real message back)
         setMessages(prev => prev.filter(msg => msg.id !== tempUserMessageId));

        // Update chat metadata (last message timestamp and maybe title)
        const chatDocRef = doc(db, 'users', user.uid, 'chats', chatId);

        // Check if title needs update (is "New Chat")
         const chatSnap = await getDoc(chatDocRef);
         let titleUpdate = {};
         if (chatSnap.exists() && chatSnap.data().title === "New Chat") {
             const newTitle = currentInput.length > 30 ? currentInput.substring(0, 27) + '...' : currentInput;
             titleUpdate = { title: newTitle };
             console.log(`[ChatArea] Updating chat title to: "${newTitle}" on first message send.`);
         }

        await updateDoc(chatDocRef, {
             lastMessageTimestamp: serverTimestamp(),
             ...titleUpdate // Include title update if applicable
        });
        console.log(`[ChatArea] Updated chat metadata for chatId ${chatId}.`);


        // Call Gemini AI action with simplified history
        console.log('[ChatArea] Calling Gemini AI action...');
        const aiInput = { prompt: currentInput, history: historyForAI };
        const aiOutput = await generateGeminiChatMessage(aiInput); // Use direct Gemini action

        // Handle AI response or error
        if (aiOutput.response) {
             // Add AI response to Firestore
            const aiMessagePayload = {
                role: 'model', // Use 'model' for AI role
                content: [{ text: aiOutput.response }], // Ensure content is stored as array
                timestamp: serverTimestamp(),
            };
            // Firestore listener will pick this up and update the state
            await addDoc(messagesRef, aiMessagePayload);
            console.log('[ChatArea] AI response added to Firestore.');
             // Update last message timestamp again after AI response
            await updateDoc(chatDocRef, { lastMessageTimestamp: serverTimestamp() });
            setError(null); // Clear any previous errors

        } else {
             // Handle AI error response or empty response
             const aiErrorMsg = aiOutput.error || "AI failed to generate a valid response.";
             console.warn('[ChatArea] AI response was empty or an error message:', {aiErrorMsg});
             setError(aiErrorMsg); // Show error to the user
             // Optionally add a system error message to Firestore if needed
             // const systemErrorPayload = { role: 'system', content: [{ text: `Error: ${aiErrorMsg}`}], timestamp: serverTimestamp() };
             // await addDoc(messagesRef, systemErrorPayload);
        }

    } catch (err) {
        console.error('[ChatArea] Error sending message or getting AI response:', err);
        const errorMsg = `Failed to process message: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setError(errorMsg);
         // Ensure temp message is removed on any error during processing
         setMessages(prev => prev.filter(msg => msg.id !== tempUserMessageId));
         // Restore input if sending failed completely
         if (!userDocRefId) {
             setInput(currentInput);
         }
    } finally {
        setIsLoading(false); // Stop AI loading indicator
        // Scroll handled by useEffect watching messages.length
    }
  };

  // --- Render ---

  const inputDisabled = isLoading || !!combinedError; // Disable if loading or any setup error

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-secondary/5 to-background">
      {/* Sticky Error/Status Area */}
      <div className="sticky top-0 z-10 p-2 bg-background/90 backdrop-blur-sm border-b border-border/50">
        {error && (
          <Alert variant="destructive" className="text-xs p-2 rounded-md border-x-0 border-t-0">
             <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-semibold">Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Scrollable Message Area */}
      <ScrollArea className="flex-1 overflow-y-auto" viewportRef={scrollAreaViewportRef}>
        <div className="p-4 space-y-4">
             {messages.length === 0 && isLoading && !error && ( // Show loading state only if no error
                  <div className="flex justify-center items-center h-full py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Loading messages...</p>
                  </div>
             )}
             {messages.length === 0 && !isLoading && !error && ( // Show prompt only if no error and not loading
                 <p className="text-center text-muted-foreground italic text-sm py-10">
                    Start the conversation!
                 </p>
             )}
             {messages.map((message) => (
                <ChatMessage key={message.id} message={message} currentUser={user} />
             ))}
             {/* Show thinking indicator only while waiting for AI */}
             {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && !error && (
                 <div className="flex justify-start items-start gap-3">
                     <UIAvatar className="h-7 w-7 md:h-8 md:w-8 border-2 border-primary shadow-md flex-shrink-0">
                        <AvatarFallback className="bg-primary/10">
                            <BrainCircuit className="h-4 w-4 md:h-5 md:w-5 text-primary animate-pulse" />
                        </AvatarFallback>
                     </UIAvatar>
                     <div className="bg-card text-card-foreground p-2 md:p-3 rounded-lg rounded-bl-none shadow-md max-w-[80%] animate-pulse">
                         <div className="space-y-1">
                            <div className="h-3 bg-muted rounded w-20"></div>
                            <div className="h-3 bg-muted rounded w-16"></div>
                         </div>
                         <p className="text-xs mt-2 text-muted-foreground">TradeChat is thinking...</p>
                     </div>
                 </div>
             )}
        </div>
      </ScrollArea>

      {/* Input Form Area */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3 border-t p-2 md:p-4 border-border mt-auto bg-background">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={inputDisabled ? "Chat unavailable..." : "Ask TradeChat anything..."}
          className="flex-1 bg-background focus:ring-2 focus:ring-accent focus:ring-offset-0 disabled:cursor-not-allowed text-sm md:text-base"
          disabled={inputDisabled}
          aria-label="Chat input"
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-md relative shrink-0 h-9 w-9 md:h-10 md:w-10"
          disabled={inputDisabled || !input.trim()} // Disable if input empty or errors/loading
          aria-label="Send message"
        >
          {isLoading ? ( // Show spinner only during AI response loading
             <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </Button>
      </form>
    </div>
  );
}
