
"use client";

import { useAuth } from '@/hooks/useAuth';
// Removed Dialog component imports from here: DialogContent, DialogHeader, DialogTitle, DialogDescription
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings as SettingsIcon, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Export the inner content as a separate component
export function SettingsDialogContent() {
   const { user, loading, authError } = useAuth();

   if (loading) {
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

    // Display error if auth service failed
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
     // Should ideally not happen if sidebar button is disabled, but good practice
     return (
        <p className="text-muted-foreground py-4 text-center">You must be logged in to view settings.</p>
     );
   }

  // Return only the inner content, DialogHeader/Title/Description will be handled in Sidebar.tsx
  return (
     <>
         <div className="space-y-6 py-4">
             <div className="space-y-2">
                 <Label htmlFor="email" className="font-serif">Email</Label>
                 <Input id="email" type="email" value={user.email || ''} disabled className="bg-muted" />
             </div>

             {/* Placeholder for other settings */}
             <div className="space-y-2">
                <Label htmlFor="displayName" className="font-serif">Display Name (Optional)</Label>
                <Input id="displayName" placeholder="Your Name" />
             </div>

             <div className="flex items-center justify-between space-x-2 pt-4 border-t border-border">
                <Label htmlFor="dark-mode" className="font-serif flex flex-col space-y-1">
                    <span>Dark Mode</span>
                    <span className="font-normal leading-snug text-muted-foreground text-sm">
                    Toggle the application's theme. (Requires implementation)
                    </span>
                </Label>
                <Switch id="dark-mode" aria-label="Toggle dark mode" disabled />
            </div>

            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-serif" disabled>
                Save Changes (Disabled)
            </Button>
         </div>
           <p className="text-center text-muted-foreground text-xs pt-4 border-t">
             More settings coming soon. This is a placeholder UI.
           </p>
     </>
  );
}
