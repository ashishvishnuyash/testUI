"use client"
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { 
  getUserSubscription, 
  hasActiveSubscription, 
  getSubscriptionLimits,
  getEffectivePlan,
  isSubscriptionExpired,
  isSubscriptionExpiringSoon,
  calculateDaysUntilExpiration,
  markExpirationWarningShown,
  forceRefreshSubscriptionStatus,
  UserSubscription 
} from '@/lib/firebase/subscriptions';
import { useToast } from './use-toast';

export function useSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [effectivePlan, setEffectivePlan] = useState<string>('free_tier');
  const [hasShownExpirationWarning, setHasShownExpirationWarning] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Check subscription status and handle expiration
  const checkSubscriptionStatus = async (userId: string, showToasts: boolean = true) => {
    try {
      setLoading(true);
      setError(null);

      // Get subscription with automatic expiration handling
      const userSub = await getUserSubscription(userId);
      const activeStatus = await hasActiveSubscription(userId);
      const effectivePlanId = await getEffectivePlan(userId); // This is now async

      setSubscription(userSub);
      setIsActive(activeStatus);
      setEffectivePlan(effectivePlanId);
      setLastChecked(new Date());

      // Show expiration notifications if enabled and not shown before
      if (showToasts && userSub && userSub.endDate && !userSub.expirationWarningShown && !hasShownExpirationWarning) {
        const daysUntil = calculateDaysUntilExpiration(userSub.endDate); // Pass endDate directly
        const isExpiringSoon = isSubscriptionExpiringSoon(userSub.endDate); // Pass endDate directly
        const isExpired = isSubscriptionExpired(userSub.endDate); // Pass endDate directly

        if (isExpired && userSub.originalPlanId && userSub.originalPlanId !== 'free_tier') {
          toast({
            title: "Subscription Expired",
            description: `Your ${userSub.originalPlanName || userSub.originalPlanId} subscription has expired. You've been automatically moved to the Free Tier.`,
            variant: "destructive",
          });
          setHasShownExpirationWarning(true);
          await markExpirationWarningShown(userId);
        } else if (isExpiringSoon && daysUntil > 0) {
          toast({
            title: "Subscription Expiring Soon",
            description: `Your ${userSub.planName} subscription expires in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}. Renew now to avoid interruption.`,
            variant: "destructive",
          });
          setHasShownExpirationWarning(true);
          await markExpirationWarningShown(userId);
        }
      }

      return { userSub, activeStatus, effectivePlanId };
    } catch (err: any) {
      console.error('Error checking subscription status:', err);
      setError(err.message || 'Failed to fetch subscription');
      setSubscription(null);
      setIsActive(false);
      setEffectivePlan('free_tier');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setIsActive(false);
      setEffectivePlan('free_tier');
      setLoading(false);
      setLastChecked(null);
      return;
    }

    // Initial check
    checkSubscriptionStatus(user.uid, true);

    // Set up periodic checks every 5 minutes
    const interval = setInterval(() => {
      checkSubscriptionStatus(user.uid, false); // Don't show toasts for periodic checks
    }, 5 * 60 * 1000);

    // Set up daily check at midnight (more aggressive expiration checking)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      checkSubscriptionStatus(user.uid, true); // Show toasts for midnight checks
      
      // Set up daily interval after first midnight check
      const dailyInterval = setInterval(() => {
        checkSubscriptionStatus(user.uid, true);
      }, 24 * 60 * 60 * 1000);

      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);

    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimeout);
    };
  }, [user]);

  // Manual refresh function
  const refreshSubscription = async (forceRefresh: boolean = false) => {
    if (!user) return;

    try {
      if (forceRefresh) {
        // Force refresh from database with expiration check
        await forceRefreshSubscriptionStatus(user.uid);
      }
      
      await checkSubscriptionStatus(user.uid, true);
    } catch (err: any) {
      console.error('Error refreshing subscription:', err);
      setError(err.message || 'Failed to refresh subscription');
    }
  };

  // Force check expiration (useful for manual triggers)
  const forceCheckExpiration = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await forceRefreshSubscriptionStatus(user.uid);
      await checkSubscriptionStatus(user.uid, true);
    } catch (err: any) {
      console.error('Error force checking expiration:', err);
      setError(err.message || 'Failed to check expiration');
    }
  };

  // Get current plan limits based on effective plan
  const currentPlan = effectivePlan;
  const limits = getSubscriptionLimits(currentPlan);
  
  // Calculate expiration info
  const daysUntilExpiration = subscription?.endDate ? calculateDaysUntilExpiration(subscription.endDate) : -1;
  const isExpiringSoon = subscription?.endDate ? isSubscriptionExpiringSoon(subscription.endDate) : false;
  const isExpired = subscription?.endDate ? isSubscriptionExpired(subscription.endDate) : false;

  // Check if subscription was downgraded due to expiration
  const wasDowngraded = subscription?.originalPlanId && subscription.originalPlanId !== 'free_tier' && effectivePlan === 'free_tier';

  return {
    subscription,
    isActive,
    loading,
    error,
    currentPlan, // This is the effective plan
    limits, // These are based on the effective plan
    refreshSubscription,
    forceCheckExpiration,
    daysUntilExpiration,
    isExpiringSoon,
    isExpired,
    effectivePlan, // The actual enforced plan
    wasDowngraded, // Whether user was downgraded due to expiration
    lastChecked, // When subscription was last checked
    originalPlan: subscription?.originalPlanId || null, // Original plan before expiration
    originalPlanName: subscription?.originalPlanName || null, // Original plan name before expiration
  };
}