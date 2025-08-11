
"use client";

import type { ReactNode } from 'react';
import { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, initializationError as firebaseInitError } from '@/lib/firebase/config'; // Import init error
import { createOrUpdateUserProfile } from '@/lib/firebase/users';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null; // Add state for auth errors
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Use firebaseInitError as the initial auth error if it exists
  const [authError, setAuthError] = useState<string | null>(firebaseInitError);

  useEffect(() => {
    // If there was an initialization error, don't try to use auth
    if (firebaseInitError) {
      setLoading(false);
      return;
    }

    // Check if auth object exists before subscribing (double check)
    if (!auth) {
      console.error("[AuthProvider] Firebase Auth service is still not available even after initial check passed. This shouldn't normally happen.");
      setAuthError("Firebase Auth service became unavailable.");
      setLoading(false);
      return; // Exit early if auth is null
    }

    console.log("[AuthProvider] Setting up Firebase Auth listener...");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // console.log("[AuthProvider] Auth state changed. User:", user ? user.uid : null);
      
      // Create or update user profile when user signs in
      if (user) {
        try {
          await createOrUpdateUserProfile(user);
        } catch (error) {
          console.error('Error creating/updating user profile:', error);
          // Don't block auth flow for profile creation errors
        }
      }
      
      setUser(user);
      setLoading(false);
      setAuthError(null); // Clear any previous auth error on successful state change
    }, (error) => {
       // Handle errors during auth state observation
       console.error("Error observing Firebase Auth state:", error);
       setAuthError(`Failed to monitor authentication state: ${error.message}`);
       setUser(null); // Ensure user is null if auth state fails
       setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
        // console.log("[AuthProvider] Cleaning up Firebase Auth listener.");
        unsubscribe();
    }
  }, []); // Dependency array is empty as `auth` and `firebaseInitError` are imported and their reference shouldn't change unless the module reloads

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="ml-4 space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    )
  }

   // Display error prominently if Auth service failed (initialization or listener error)
   if (authError && !loading) {
     return (
       <div className="flex items-center justify-center h-screen p-4">
          <Alert variant="destructive" className="max-w-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              {authError} Please check the console for more details, verify your Firebase setup and environment variables, or contact support.
            </AlertDescription>
          </Alert>
       </div>
     );
   }

  return (
    <AuthContext.Provider value={{ user, loading, authError }}>
      {children}
    </AuthContext.Provider>
  );
}
