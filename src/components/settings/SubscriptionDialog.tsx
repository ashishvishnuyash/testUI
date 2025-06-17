"use client";

import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Crown, AlertTriangle, Clock, Star, Calendar, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  saveUserSubscription, 
  savePaymentRecord,
} from '@/lib/firebase/subscriptions';

// Updated subscription plans with the requested tiers

// RAZORPAY_KEY_ID = "rzp_test_732qsLZ7cVKYCW";
const plans = [
  { 
    id: 'free_tier',
    name: 'Free Tier', 
    price: '$0/mo', 
    priceInCents: 0,
    features: [
      'Limited to 4 chats', 
      'Maximum 10 questions per chat', 
      '5,000 token response limit'
    ], 
  },
  { 
    id: 'gold_tier',
    name: 'Gold Tier', 
    price: '$30/mo', 
    priceInCents: 3000,
    features: [
      'Up to 100 chats', 
      'Unlimited questions per chat', 
      '2 million token response limit',
      'Priority support'
    ], 
  },
  { 
    id: 'diamond_tier',
    name: 'Diamond Tier', 
    price: '$49/mo', 
    priceInCents: 4900,
    features: [
      'Unlimited chats', 
      'Unlimited questions', 
      'Unlimited token responses',
      'Premium support',
      'Early access to new features'
    ], 
  },
];

// Razorpay configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_live_KVYm7fTg5kCUlQ'; // Replace with your actual Razorpay key ID 

export function SubscriptionDialogContent() {
  const { user, loading: authLoading, authError } = useAuth();
  const { 
    currentPlan, 
    loading: subLoading, 
    refreshSubscription, 
    error: subError,
    subscription,
    daysUntilExpiration,
    isExpiringSoon,
    isExpired,
    effectivePlan,
    wasDowngraded,
    originalPlan,
    originalPlanName,
    forceCheckExpiration
  } = useSubscription();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Cleanup
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Force refresh subscription status
  const handleRefreshSubscription = async () => {
    setIsRefreshing(true);
    try {
      await forceCheckExpiration();
      await refreshSubscription(true);
      toast({
        title: "Subscription Refreshed",
        description: "Subscription status has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh subscription status.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePayment = async (planId: string, amount: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // For free tier, just update the database without payment
    if (planId === 'free_tier') {
      try {
        await saveUserSubscription(user.uid, planId, 'Free Tier', {
          paymentId: 'free_tier_activation',
          razorpayPaymentId: 'free_tier_activation',
          amount: 0,
          currency: 'USD',
        });

        await refreshSubscription(true);
        toast({
          title: "Success!",
          description: "You've been switched to the Free Tier.",
        });
      } catch (error) {
        console.error('Error activating free tier:', error);
        toast({
          title: "Error",
          description: "Failed to activate free tier. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Create Razorpay order options
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: amount, // Amount is already in cents
      currency: "USD",
      name: "StockWhisperer AI",
      description: `Subscription to ${plans.find(p => p.id === planId)?.name}`,
      image: "/logo.png",
      handler: async function(response: any) {
        try {
          // Save subscription to database
          const planName = plans.find(p => p.id === planId)?.name || planId;
          
          await saveUserSubscription(user.uid, planId, planName, {
            paymentId: response.razorpay_payment_id,
            razorpayPaymentId: response.razorpay_payment_id,
            amount: amount,
            currency: 'USD',
          });

          // Save payment record
          await savePaymentRecord(user.uid, planId, {
            paymentId: response.razorpay_payment_id,
            razorpayPaymentId: response.razorpay_payment_id,
            amount: amount,
            currency: 'USD',
            paymentMethod: 'razorpay',
          });

          // Refresh subscription data
          await refreshSubscription(true);
          
          toast({
            title: "Payment Successful!",
            description: `You've successfully subscribed to ${planName}. Welcome to premium!`,
          });

          // console.log("Payment successful", response);
        } catch (error) {
          console.error('Error saving subscription:', error);
          toast({
            title: "Payment Processed, But...",
            description: "Payment was successful but there was an error updating your account. Please contact support.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      },
      prefill: {
        name: user.displayName || "",
        email: user.email || "",
      },
      theme: {
        color: "#50C878", // Using the emerald green accent color
      },
      modal: {
        ondismiss: function() {
          setIsProcessing(false);
          toast({
            title: "Payment Cancelled",
            description: "Payment was cancelled. Your subscription remains unchanged.",
          });
        }
      }
    };

    try {
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Razorpay initialization failed", error);
      setIsProcessing(false);
      toast({
        title: "Payment Error",
        description: "Payment initialization failed. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (authLoading || subLoading) {
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

  // Show auth error
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

  // Show subscription error
  if (subError) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Subscription Error</AlertTitle>
        <AlertDescription>
          {subError} Please try refreshing the page or contact support.
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={handleRefreshSubscription}
            disabled={isRefreshing}
          >
            {isRefreshing ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Refresh"}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show login required message
  if (!user) {
    return (
      <p className="text-muted-foreground py-4 text-center">You must be logged in to view subscription plans.</p>
    );
  }

  // Return the subscription plans
  return (
    <>
      {/* Subscription Status Header */}
      {subscription && (
        <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">Current Subscription Status</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefreshSubscription}
              disabled={isRefreshing}
              className="text-xs"
            >
              {isRefreshing ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Refresh
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Active Plan:</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "font-medium",
                  effectivePlan === 'free_tier' && wasDowngraded ? "text-destructive" : "text-foreground"
                )}>
                  {plans.find(p => p.id === effectivePlan)?.name || effectivePlan}
                </span>
                {wasDowngraded && (
                  <Badge variant="destructive" className="text-xs">
                    Downgraded
                  </Badge>
                )}
                {isExpired && (
                  <Badge variant="destructive" className="text-xs">
                    Expired
                  </Badge>
                )}
                {isExpiringSoon && !isExpired && (
                  <Badge variant="secondary" className="text-xs">
                    Expiring Soon
                  </Badge>
                )}
              </div>
              {wasDowngraded && originalPlanName && (
                <div className="text-xs text-muted-foreground mt-1">
                  Previously: {originalPlanName}
                </div>
              )}
            </div>
            
            {subscription.endDate && (
              <div>
                <span className="font-medium">
                  {isExpired ? 'Expired:' : 'Expires:'}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    isExpired ? "text-destructive" : 
                    isExpiringSoon ? "text-yellow-600" : "text-foreground"
                  )}>
                    {new Date(subscription.endDate.seconds * 1000).toLocaleDateString()}
                  </span>
                  {daysUntilExpiration > 0 && (
                    <Badge variant={isExpiringSoon ? "destructive" : "secondary"} className="text-xs">
                      {daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''} left
                    </Badge>
                  )}
                  {isExpired && (
                    <Badge variant="destructive" className="text-xs">
                      Expired
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Expiration Warnings */}
          {isExpired && (
            <Alert variant="destructive" className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Subscription Expired:</strong> Your subscription has expired and you've been automatically moved to the Free Tier. 
                Upgrade now to restore full access.
              </AlertDescription>
            </Alert>
          )}

          {isExpiringSoon && !isExpired && (
            <Alert className="mt-3 border-yellow-500/50 bg-yellow-500/10">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm">
                <strong>Expiring Soon:</strong> Your subscription expires in {daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''}. 
                Renew now to avoid service interruption.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
        {plans.map((plan) => {
          // Current plan logic with expiration handling
          const isStoredPlan = plan.id === subscription?.planId;
          const isEffectivePlan = plan.id === effectivePlan;
          const isCurrent = isEffectivePlan && !isExpired;
          const isRecommended = (isExpired || wasDowngraded) && plan.id !== 'free_tier';
          const isRenewal = isStoredPlan && isExpired;
          
          return (
            <Card 
              key={plan.id} 
              className={cn(
                "shadow-md flex flex-col relative",
                isCurrent ? 'border-2 border-primary ring-2 ring-primary/20' : 'border-border',
                isRecommended && 'border-2 border-yellow-500 ring-2 ring-yellow-500/20'
              )}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-yellow-500 text-yellow-900 px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-serif flex items-center justify-center gap-2">
                  {plan.name}
                  {isCurrent && !isExpired && (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  )}
                  {isStoredPlan && isExpired && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                </CardTitle>
                <CardDescription className="text-2xl font-semibold text-primary my-1">
                  {plan.price}
                </CardDescription>
                {isStoredPlan && isExpired && (
                  <Badge variant="destructive" className="text-xs">
                    Expired Plan
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="flex-1 space-y-2 px-4 pb-4">
                <ul className="space-y-1.5">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <div className="p-4 pt-0 mt-auto">
                <Button
                  className={cn(
                    "w-full font-serif text-sm h-9",
                    isCurrent && !isExpired
                      ? 'bg-muted text-muted-foreground cursor-default' 
                      : isRecommended
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-yellow-900'
                        : isRenewal
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                          : 'bg-accent hover:bg-accent/90 text-accent-foreground'
                  )}
                  disabled={(isCurrent && !isExpired) || isProcessing}
                  onClick={() => handlePayment(plan.id, plan.priceInCents)}
                >
                  {isProcessing 
                    ? 'Processing...' 
                    : isCurrent && !isExpired
                      ? 'Current Plan' 
                      : isRenewal
                        ? 'Renew Subscription'
                        : plan.priceInCents === 0 
                          ? (effectivePlan === 'free_tier' ? 'Current Plan' : 'Switch to Free')
                          : isRecommended
                            ? 'Upgrade Now'
                            : 'Subscribe'
                  }
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Additional Information */}
      <div className="space-y-4 pt-4 border-t">
        {/* Benefits of upgrading */}
        {(isExpired || wasDowngraded || effectivePlan === 'free_tier') && (
          <Alert className="border-emerald-500/50 bg-emerald-500/10">
            <Star className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="text-emerald-800">Why Upgrade?</AlertTitle>
            <AlertDescription className="text-emerald-700">
              <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                <li>Create unlimited or more chat sessions</li>
                <li>Ask unlimited questions per chat</li>
                <li>Get longer, more detailed AI responses</li>
                <li>Priority support and faster response times</li>
                {effectivePlan !== 'diamond_tier' && <li>Early access to new features (Diamond Tier)</li>}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Renewal reminder */}
        {isExpiringSoon && !isExpired && (
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Calendar className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Renewal Reminder</AlertTitle>
            <AlertDescription className="text-blue-700">
              Your subscription expires in {daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''}. 
              Renew now to avoid any interruption to your service. All your chat history will be preserved.
            </AlertDescription>
          </Alert>
        )}

        {/* Downgrade explanation */}
        {wasDowngraded && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Subscription Expired</AlertTitle>
            <AlertDescription>
              Your {originalPlanName || originalPlan} subscription expired and you've been automatically moved to the Free Tier. 
              Your chat history is preserved, but you now have limited access. Upgrade to restore full functionality.
            </AlertDescription>
          </Alert>
        )}

        {/* Payment security notice */}
        <p className="text-center text-muted-foreground text-xs pt-4 border-t">
          <span className="flex items-center justify-center gap-2">
            <Crown className="h-3 w-3" />
            Subscription management powered by Razorpay. Your payment information is securely processed.
          </span>
        </p>

        {/* Auto-renewal notice */}
        {subscription && subscription.planId !== 'free_tier' && !isExpired && (
          <p className="text-center text-muted-foreground text-xs">
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="h-3 w-3" />
              Auto-renewal is {subscription.autoRenew ? 'enabled' : 'disabled'}. 
              {subscription.autoRenew 
                ? ' Your subscription will automatically renew before expiration.'
                : ' You will need to manually renew before expiration.'
              }
            </span>
          </p>
        )}
      </div>
    </>
  );
}
