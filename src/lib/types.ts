import type { Timestamp } from 'firebase/firestore';

// Defines the structure for a single message within a chat
export interface MessageData {
  id: string; // Firestore document ID or temporary ID
  role: 'user' | 'model' | 'system'; // Sender role (user, AI model, or system message)
  content: Array<{ text: string; [key: string]: any }>; // Message content parts (currently just text)
  timestamp: Timestamp | null; // Firestore timestamp (null if pending server write)
}

// Simple message type for chat history
export interface SimpleHistoryMessage {
  role: 'user' | 'model';
  content: Array<{ text: string }>;
}

// Defines the structure for a chat listed in the sidebar
export interface ChatListItemData {
   id: string;
   title: string;
   createdAt: Timestamp | null;
   lastMessageTimestamp: Timestamp | null;
}
