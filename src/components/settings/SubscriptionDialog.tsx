
"use client";

import { useAuth } from '@/hooks/useAuth';
// Removed Dialog component imports from here: DialogContent, DialogHeader, DialogTitle, DialogDescription
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Crown, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// TODO: Replace with actual subscription plans and logic (e.g., Stripe integration)
const plans = [
  { name: 'Free Tier', price: '$0/mo', features: ['Basic AI responses', 'Limited chat history', 'Standard support'], current: false },
  { name: 'Aether Plus', price: '$10/mo', features: ['Enhanced AI model', 'Unlimited chat history', 'Priority support', 'Early access to new features'], current: true }, // Example: User has this plan
  { name: 'Aether Pro', price: '$25/mo', features: ['Most advanced AI model', 'Unlimited history & exports', 'Dedicated support channel', 'API access (coming soon)'], current: false },
];

// Export the inner content as a separate component
export function SubscriptionDialogContent() {
   const { user, loading, authError } = useAuth();

   if (loading) {
     return (
        <>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-64 w-full rounded-lg" />
            </div>
             <Skeleton className="h-4 w-full mt-4" />
        </>
     );
   }

   if (authError) {
     return (
         <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
           <AlertTitle>Authentication Failed</AlertTitle>
           <AlertDescription>
             {authError} Cannot load subscription details. Please try again later or contact support.
           </AlertDescription>
         </Alert>
     );
   }

   if (!user) {
     return (
        <p className="text-muted-foreground py-4 text-center">You must be logged in to view subscription plans.</p>
     );
   }

  // Return only the inner content, DialogHeader/Title/Description will be handled in Sidebar.tsx
  return (
    <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
          {plans.map((plan, index) => (
            <Card key={index} className={`shadow-md flex flex-col ${plan.current ? 'border-2 border-primary ring-2 ring-primary/20' : 'border-border'}`}>
              <CardHeader className="text-center pb-4"> {/* Adjusted padding */}
                <CardTitle className="text-xl font-serif">{plan.name}</CardTitle>
                <CardDescription className="text-2xl font-semibold text-primary my-1">{plan.price}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 px-4 pb-4"> {/* Adjusted padding */}
                <ul className="space-y-1.5">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-4 pt-0 mt-auto"> {/* Use mt-auto to push button down */}
               <Button
                  className={`w-full font-serif text-sm h-9 ${plan.current ? 'bg-muted text-muted-foreground cursor-default' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`} // Adjusted styling for current
                  disabled={plan.current} // Disable button for the current plan
                >
                  {plan.current ? 'Current Plan' : 'Choose Plan'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
         <p className="text-center text-muted-foreground text-xs pt-4 border-t">
           Subscription management powered by a third-party service (e.g., Stripe). This is a placeholder UI.
         </p>
    </>
  );
}
