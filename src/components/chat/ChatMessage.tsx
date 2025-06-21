'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MessageData } from '@/lib/types';
import { BrainCircuit, User as UserIcon } from 'lucide-react';
import type { User } from 'firebase/auth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import Image from 'next/image';

interface ChatMessageProps {
  message: MessageData;
  currentUser: User | null;
  isAnalyzing?: boolean; // Add this prop
}

export default function ChatMessage({ message, currentUser, isAnalyzing = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isModel = message.role === 'model';
  const isOptimistic = message.id.startsWith('temp-');

  // Combine text parts into a single string for Markdown rendering for model messages
  const modelMessageText = isModel ? message.content.map(part => part.text).filter(Boolean).join('\n\n') : '';

  // Determine alignment and styling based on sender
  const alignmentClass = isUser ? 'justify-end' : 'justify-start';
  const cardClasses = cn(
    "max-w-[85%] sm:max-w-[80%] lg:max-w-[75%] shadow-md rounded-xl transition-all",
    isUser
      ? 'bg-accent text-accent-foreground rounded-br-none ml-auto'
      : 'bg-card text-card-foreground rounded-bl-none',
    isOptimistic || isAnalyzing ? 'opacity-70 animate-pulse' : '',
  );

  // Define custom components for ReactMarkdown
  const markdownComponents: Components = {
    // Customize rendering for better mobile experience
    a: ({ node, ...props }) => (
      <a 
        {...props} 
        target="_blank" 
        rel="noopener noreferrer"
        className="break-words"
      />
    ),
    code: ({ node, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match;
      
      return isInline ? (
        <code 
          className={cn(
            "break-words px-1 py-0.5 rounded bg-muted text-xs sm:text-sm",
            className
          )}
          {...props}
        >
          {children}
        </code>
      ) : (
        <code 
          className={cn(
            "block overflow-x-auto text-xs sm:text-sm",
            className
          )}
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ node, ...props }) => (
      <pre 
        {...props} 
        className={cn(
          "overflow-x-auto touch-pan-x p-3 sm:p-4 rounded-lg bg-muted text-xs sm:text-sm",
          props.className
        )}
      />
    ),
    // Make tables responsive
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto">
        <table {...props} className="min-w-full" />
      </div>
    ),
    // Handle long URLs and text
    p: ({ node, ...props }) => (
      <p {...props} className="break-words" />
    ),
  };

  return (
    <div className={cn("flex items-start gap-2 sm:gap-3 lg:gap-4 w-full", alignmentClass)}>
      {/* AI Avatar - Show on left for AI messages */}
      {isModel && (
        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 border-2 border-primary shadow-md flex-shrink-0 mt-1">
          <AvatarFallback className="bg-primary/10">
            <BrainCircuit className={cn(
              "h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary",
              isAnalyzing && "animate-pulse"
            )} />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Card */}
      <Card className={cardClasses}>
        <CardContent className="p-3 sm:p-4 lg:p-5 text-sm sm:text-base">
          {isModel ? (
            // Render AI response as Markdown or analyzing message
            isAnalyzing ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-primary font-medium">Analyzing...</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  StockWhisperer AI is processing your request and gathering insights...
                </p>
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className={cn(
                  "prose prose-sm sm:prose-base dark:prose-invert w-[100%]",
                  "prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground",
                  "prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground",
                  "prose-blockquote:text-muted-foreground prose-blockquote:border-border",
                  "prose-a:text-primary hover:prose-a:text-primary/80",
                  "prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground",
                  // Mobile-specific adjustments
                  "prose-headings:text-sm sm:prose-headings:text-base lg:prose-headings:text-lg",
                  "prose-p:text-sm sm:prose-p:text-base prose-p:leading-relaxed",
                  "prose-code:text-xs sm:prose-code:text-sm prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:bg-muted",
                  "prose-pre:text-xs sm:prose-pre:text-sm prose-pre:p-3 sm:prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto",
                  "prose-ul:text-sm sm:prose-ul:text-base prose-ol:text-sm sm:prose-ol:text-base",
                  "prose-li:text-sm sm:prose-li:text-base prose-li:my-1"
                )}
                components={markdownComponents}
              >
                {modelMessageText}
              </ReactMarkdown>
            )
          ) : (
            // Render user message, which can have text and an image
            <div className="space-y-2">
              {message.content.map((part, index) => (
                <div key={index}>
                  {part.text && (
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{part.text}</p>
                  )}
                  {part.imageUrl && (
                    <div className="relative mt-2 w-full max-w-xs h-auto aspect-[4/3] rounded-lg overflow-hidden border">
                      <Image
                        src={part.imageUrl}
                        alt="User upload"
                        layout="fill"
                        objectFit="cover"
                        className="transition-opacity duration-300"
                        onLoadingComplete={(img) => img.classList.remove('opacity-0')}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Timestamp */}
          {!isAnalyzing && (
            <p className={cn(
              "text-xs sm:text-sm mt-2 sm:mt-3 flex items-center gap-1",
              isUser ? 'text-accent-foreground/70 justify-end' : 'text-muted-foreground justify-start',
              isOptimistic && 'italic animate-pulse'
            )}>
              {isOptimistic ? (
                <>
                  <span className="inline-block w-1 h-1 bg-current rounded-full animate-ping"></span>
                  <span>Sending...</span>
                </>
              ) : message.timestamp ? (
                <span>
                  {message.timestamp.toDate().toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: typeof window !== 'undefined' ? window.innerWidth < 640 : false // Use 12-hour format on mobile, with SSR safety
                  })}
                </span>
              ) : (
                <span>...</span>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      {/* User Avatar - Show on right for user messages */}
      {isUser && (
        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 border-2 border-accent shadow-md flex-shrink-0 mt-1">
          {currentUser?.photoURL ? (
            <AvatarImage 
              src={currentUser.photoURL} 
              alt={currentUser.displayName || currentUser.email || 'User'}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-accent/10">
            <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-accent" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
