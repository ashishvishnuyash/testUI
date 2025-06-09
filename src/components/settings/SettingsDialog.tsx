"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings as SettingsIcon, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Export the inner content as a separate component
export function SettingsDialogContent() {
  const { user, loading, authError } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user settings on component mount
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user || !db) {
        setIsLoading(false);
        return;
      }

      try {
        // Set display name from auth
        setDisplayName(user.displayName || '');

        // Load theme preference from localStorage first
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
          const isDark = savedTheme === 'dark';
          setDarkMode(isDark);
          applyTheme(isDark);
        } else {
          // Try to load from Firestore
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const isDark = userData.darkMode || false;
              setDarkMode(isDark);
              applyTheme(isDark);
              localStorage.setItem('theme', isDark ? 'dark' : 'light');
            } else {
              // Use system preference as fallback
              const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              setDarkMode(systemDark);
              applyTheme(systemDark);
              localStorage.setItem('theme', systemDark ? 'dark' : 'light');
              
              // Create the user document
              await setDoc(userDocRef, {
                displayName: user.displayName || '',
                darkMode: systemDark,
                email: user.email,
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          } catch (firestoreError) {
            console.warn('Failed to load from Firestore, using system preference:', firestoreError);
            // Fallback to system preference
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setDarkMode(systemDark);
            applyTheme(systemDark);
            localStorage.setItem('theme', systemDark ? 'dark' : 'light');
          }
        }
      } catch (error) {
        console.error('Failed to load user settings:', error);
        // Fallback to system preference
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(systemDark);
        applyTheme(systemDark);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserSettings();
  }, [user]);

  // Apply theme to document
  const applyTheme = (isDark: boolean) => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  // Handle theme toggle - this is the key fix
  const handleThemeToggle = (checked: boolean) => {
    // console.log('Theme toggle clicked:', checked); // Debug log
    setDarkMode(checked);
    applyTheme(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', checked ? 'dark' : 'light');
    }
  };

  // Update user profile in Firebase Auth and Firestore
  const updateUserProfile = async (uid: string, data: { displayName: string; darkMode: boolean }) => {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      // Update Firebase Auth profile
      if (user && data.displayName !== user.displayName) {
        await updateProfile(user, {
          displayName: data.displayName
        });
      }

      // Update Firestore document
      const userDocRef = doc(db, 'users', uid);
      
      // Check if document exists first
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        // Update existing document
        await updateDoc(userDocRef, {
          displayName: data.displayName,
          darkMode: data.darkMode,
          updatedAt: new Date()
        });
      } else {
        // Create new document
        await setDoc(userDocRef, {
          displayName: data.displayName,
          darkMode: data.darkMode,
          email: user?.email || '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      
      await updateUserProfile(user.uid, {
        displayName,
        darkMode
      });

      // Ensure theme is applied
      applyTheme(darkMode);
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
      }

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        <Skeleton className="h-10 w-1/4 mt-4" />
      </div>
    );
  }

  if (authError) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Authentication Failed</AlertTitle>
        <AlertDescription>
          {authError} Cannot load settings. Please try again later or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  if (!user) {
    return (
      <p className="text-muted-foreground py-4 text-center">
        You must be logged in to view settings.
      </p>
    );
  }

  if (!db) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Database Error</AlertTitle>
        <AlertDescription>
          Database connection failed. Please check your Firebase configuration.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="font-serif">Email</Label>
          <Input 
            id="email" 
            type="email" 
            value={user.email || ''} 
            disabled 
            className="bg-muted" 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName" className="font-serif">Display Name (Optional)</Label>
          <Input 
            id="displayName" 
            placeholder="Your Name" 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between space-x-2 pt-4 border-t border-border">
          <div className="space-y-0.5">
            <Label htmlFor="dark-mode" className="font-serif cursor-pointer">
              Dark Mode
            </Label>
            <div className="text-sm text-muted-foreground">
              Toggle the application's theme
            </div>
          </div>
          <Switch 
            id="dark-mode" 
            checked={darkMode}
            onCheckedChange={handleThemeToggle}
            disabled={isSaving}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <Button 
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-serif"
          onClick={handleSaveChanges}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </>
  );
}