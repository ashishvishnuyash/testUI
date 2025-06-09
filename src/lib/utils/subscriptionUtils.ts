import { UserSubscription } from '@/lib/firebase/subscriptions';

export interface SubscriptionStatus {
  isActive: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiration: number;
  effectivePlan: string;
  wasDowngraded: boolean;
  needsAttention: boolean;
  originalPlanName?: string | null;
  currentPlanName?: string | null;
}
export function analyzeSubscriptionStatus(subscription: UserSubscription | null): SubscriptionStatus {
  if (!subscription) {
    return {
      isActive: false,
      isExpired: false,
      isExpiringSoon: false,
      daysUntilExpiration: -1,
      effectivePlan: 'free_tier',
      wasDowngraded: false,
      needsAttention: false,
    };
  }

  const now = new Date();
  const endDate = subscription.endDate ? new Date(subscription.endDate.seconds * 1000) : null;
  
  const isExpired = endDate ? endDate < now : false;
  const daysUntilExpiration = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : -1;
  const isExpiringSoon = daysUntilExpiration > 0 && daysUntilExpiration <= 7;
  
  const wasDowngraded = Boolean(
    subscription.originalPlanId && 
    subscription.originalPlanId !== 'free_tier' && 
    subscription.planId === 'free_tier'
  );
  
  const effectivePlan = isExpired && subscription.planId !== 'free_tier' ? 'free_tier' : subscription.planId;
  const isActive = subscription.status === 'active' && !isExpired;
  
  const needsAttention = isExpired || isExpiringSoon || wasDowngraded;

  return {
    isActive,
    isExpired,
    isExpiringSoon,
    daysUntilExpiration,
    effectivePlan,
    wasDowngraded,
    needsAttention,
  };
}

export function getSubscriptionDisplayInfo(subscription: UserSubscription | null) {
  const status = analyzeSubscriptionStatus(subscription);
  
  const planNames: Record<string, string> = {
    'free_tier': 'Free Tier',
    'gold_tier': 'Gold Tier',
    'diamond_tier': 'Diamond Tier'
  };

  return {
    ...status,
    currentPlanName: planNames[status.effectivePlan] || status.effectivePlan,
    originalPlanName: subscription?.originalPlanName || planNames[subscription?.originalPlanId || ''] || null,
    statusText: status.isExpired ? 'Expired' : 
                status.isExpiringSoon ? `${status.daysUntilExpiration} days left` :
                status.isActive ? 'Active' : 'Inactive',
    statusVariant: status.isExpired ? 'destructive' as const :
                   status.isExpiringSoon ? 'secondary' as const :
                   status.isActive ? 'default' as const : 'outline' as const,
  };
}

export function shouldShowUpgradePrompt(subscription: UserSubscription | null, chatCount: number, maxChats: number): boolean {
  const status = analyzeSubscriptionStatus(subscription);
  
  // Show upgrade prompt if:
  // 1. Subscription expired or was downgraded
  // 2. Reached chat limit
  // 3. Expiring soon and on a paid plan
  
  return (
    status.isExpired ||
    status.wasDowngraded ||
    (maxChats !== -1 && chatCount >= maxChats) ||
    (status.isExpiringSoon && status.effectivePlan !== 'free_tier')
  );
}

export function getUpgradePromptMessage(subscription: UserSubscription | null, chatCount: number, maxChats: number): string {
  const status = analyzeSubscriptionStatus(subscription);
  
  if (status.isExpired) {
    return `Your subscription has expired. You're now on the Free Tier with limited features.`;
  }
  
  if (status.wasDowngraded) {
    return `Your ${status.originalPlanName || 'premium'} subscription expired. Upgrade to restore full access.`;
  }
  
  if (maxChats !== -1 && chatCount >= maxChats) {
    return `You've reached the maximum of ${maxChats} chats for your ${status.currentPlanName} plan.`;
  }
  
  if (status.isExpiringSoon) {
    return `Your subscription expires in ${status.daysUntilExpiration} day${status.daysUntilExpiration !== 1 ? 's' : ''}. Renew now to avoid interruption.`;
  }
  
  return 'Upgrade to unlock more features and capabilities.';
}