'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MessageData } from '@/lib/types'; // Use shared type
import { BrainCircuit, User as UserIcon } from 'lucide-react'; // Use different name for User icon
import type { User } from 'firebase/auth'; // Import Firebase User type
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm for GitHub Flavored Markdown support

interface ChatMessageProps {
  message: MessageData;
  currentUser: User | null; // Pass current user for potential avatar logic
}

export default function ChatMessage({ message, currentUser }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isModel = message.role === 'model'; // Explicitly check for model
  const isOptimistic = message.id.startsWith('temp-'); // Check for optimistic messages

  // Combine text parts into a single string for display
  // Assumes content structure is [{ text: "..." }, ...]
  const messageText = message.content.map(part => part.text).join('\n');

  // Determine alignment and styling based on sender
  const alignmentClass = isUser ? 'justify-end' : 'justify-start';
  const cardClasses = cn(
    "max-w-[80%] sm:max-w-[75%] shadow-md rounded-xl",
    isUser
      ? 'bg-accent text-accent-foreground rounded-br-none'
      : 'bg-card text-card-foreground rounded-bl-none',
    isOptimistic ? 'opacity-70' : '',
  );

  return (
    <div className={cn("flex items-start gap-2 md:gap-3", alignmentClass)}>
      {/* AI Avatar */}
      {isModel && (
        <Avatar className="h-7 w-7 md:h-8 md:w-8 border-2 border-primary shadow-md flex-shrink-0">
          <AvatarFallback className="bg-primary/10">
            <BrainCircuit className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Card */}
      <Card className={cardClasses}>
        <CardContent className="p-2 md:p-3 text-xs md:text-sm">
          {isModel ? (
             // Render AI response as Markdown
             <ReactMarkdown
                remarkPlugins={[remarkGfm]} // Enable GFM features
                className="prose prose-sm dark:prose-invert max-w-none" // Basic prose styling
                components={{
                  // Customize rendering if needed, e.g., link target
                  a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                }}
             >
                {messageText}
             </ReactMarkdown>
          ) : (
             // Render user message as plain text (or pre-wrap for newlines)
             <p className="whitespace-pre-wrap">{messageText}</p>
          )}
          {/* Timestamp */}
          <p className={cn(
            "text-xs mt-1",
            isUser ? 'text-accent-foreground/70 text-right' : 'text-muted-foreground text-left',
            isOptimistic && 'italic'
          )}>
            {isOptimistic ? 'Sending...' : message.timestamp ? message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
          </p>
        </CardContent>
      </Card>

      {/* User Avatar */}
      {isUser && (
        <Avatar className="h-7 w-7 md:h-8 md:w-8 border-2 border-accent shadow-md flex-shrink-0">
          {currentUser?.photoURL ? (
            <AvatarImage src={currentUser.photoURL} alt={currentUser.displayName || currentUser.email || 'User'} />
          ) : null }
          <AvatarFallback className="bg-accent/10">
            <UserIcon className="h-4 w-4 md:h-5 md:w-5 text-accent" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
