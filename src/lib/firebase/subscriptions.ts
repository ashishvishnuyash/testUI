  import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
  import { db } from './config';

  export interface UserSubscription {
    userId: string;
    planId: string;
    planName: string;
    status: 'active' | 'inactive' | 'cancelled' | 'expired';
    startDate: any; // Firestore timestamp
    endDate: any; // Firestore timestamp
    paymentId?: string;
    razorpayPaymentId?: string;
    amount: number;
    currency: string;
    autoRenew: boolean;
    createdAt: any;
    updatedAt: any;
    // Add these optional fields to handle plan changes and downgrades
    originalPlanId?: string | null; // Allow null
    originalPlanName?: string | null; // Allow null
    expirationWarningShown?: boolean; // Add this missing property
  }
  export interface PaymentRecord {
    userId: string;
    planId: string;
    paymentId: string;
    razorpayPaymentId: string;
    amount: number;
    currency: string;
    status: 'success' | 'failed' | 'pending';
    paymentMethod: string;
    createdAt: any;
  }

  // Helper function to check if Firebase is initialized
  function checkFirebaseInitialization() {
    if (!db) {
      throw new Error('Firebase is not properly initialized. Please check your environment variables.');
    }
  }

  // Helper function to remove undefined values
  function removeUndefinedFields(obj: any): any {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  // Save user subscription to Firestore
  export async function saveUserSubscription(
    userId: string, 
    planId: string, 
    planName: string, 
    paymentDetails: {
      paymentId: string;
      razorpayPaymentId: string;
      amount: number;
      currency: string;
    }
  ): Promise<void> {
    try {
      checkFirebaseInitialization();
    
      const subscriptionRef = doc(db!, 'subscriptions', userId);
    
      // Get existing subscription to preserve original plan info
      const existingSubscription = await getDoc(subscriptionRef);
      const existingData = existingSubscription.exists() ? existingSubscription.data() as UserSubscription : null;
    
      // Calculate end date (30 days from now for paid plans)
      const startDate = new Date();
      const endDate = planId === 'free_tier' 
        ? null 
        : new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days

      const subscriptionData: UserSubscription = {
        userId,
        planId,
        planName,
        status: 'active',
        startDate: serverTimestamp(),
        endDate: endDate ? endDate : null,
        paymentId: paymentDetails.paymentId,
        razorpayPaymentId: paymentDetails.razorpayPaymentId,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        autoRenew: planId !== 'free_tier',
        createdAt: existingData?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Preserve or set original plan info
        originalPlanId: existingData?.originalPlanId || (existingData?.planId !== planId ? existingData?.planId : undefined),
        originalPlanName: existingData?.originalPlanName || (existingData?.planName !== planName ? existingData?.planName : undefined),
      };

      const cleanedData = removeUndefinedFields(subscriptionData);
      await setDoc(subscriptionRef, cleanedData);
      console.log('✅ Subscription saved successfully');
    } catch (error) {
      console.error('❌ Error saving subscription:', error);
      throw error;
    }
  }

  // Save payment record
  export async function savePaymentRecord(
    userId: string,
    planId: string,
    paymentDetails: {
      paymentId: string;
      razorpayPaymentId: string;
      amount: number;
      currency: string;
      paymentMethod: string;
    }
  ): Promise<void> {
    try {
      checkFirebaseInitialization();
    
      const paymentRef = doc(db!, 'payments', paymentDetails.razorpayPaymentId);
    
      const paymentData: PaymentRecord = {
        userId,
        planId,
        paymentId: paymentDetails.paymentId,
        razorpayPaymentId: paymentDetails.razorpayPaymentId,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        status: 'success',
        paymentMethod: paymentDetails.paymentMethod,
        createdAt: serverTimestamp(),
      };

      await setDoc(paymentRef, paymentData);
      console.log('✅ Payment record saved successfully');
    } catch (error) {
      console.error('❌ Error saving payment record:', error);
      throw error;
    }
  }

  // Get user's current subscription
  export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      checkFirebaseInitialization();
    
      const subscriptionRef = doc(db!, 'subscriptions', userId);
      const subscriptionSnap = await getDoc(subscriptionRef);
    
      if (subscriptionSnap.exists()) {
        return subscriptionSnap.data() as UserSubscription;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching user subscription:', error);
      throw error;
    }
  }

  // Update subscription status
  export async function updateSubscriptionStatus(
    userId: string, 
    status: 'active' | 'inactive' | 'cancelled' | 'expired'
  ): Promise<void> {
    try {
      checkFirebaseInitialization();
    
      const subscriptionRef = doc(db!, 'subscriptions', userId);
      await updateDoc(subscriptionRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Subscription status updated successfully');
    } catch (error) {
      console.error('❌ Error updating subscription status:', error);
      throw error;
    }
  }

  // Update subscription to expired and downgrade to free tier
  export async function expireSubscription(userId: string): Promise<void> {
    try {
      checkFirebaseInitialization();
    
      const subscriptionRef = doc(db!, 'subscriptions', userId);
      const subscriptionSnap = await getDoc(subscriptionRef);
    
      if (subscriptionSnap.exists()) {
        const currentData = subscriptionSnap.data() as UserSubscription;
      
        // Only update if not already on free tier
        if (currentData.planId !== 'free_tier') {
          await updateDoc(subscriptionRef, {
            // Store original plan info before downgrading
            originalPlanId: currentData.originalPlanId || currentData.planId,
            originalPlanName: currentData.originalPlanName || currentData.planName,
            // Downgrade to free tier
            planId: 'free_tier',
            planName: 'Free Tier',
            status: 'expired',
            autoRenew: false,
            updatedAt: serverTimestamp(),
          });
          console.log('✅ Subscription expired and downgraded to free tier');
        }
      }
    } catch (error) {
      console.error('❌ Error expiring subscription:', error);
      throw error;
    }
  }

  // Check if user has active subscription
  export async function hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await getUserSubscription(userId);
    
      if (!subscription) return false;
      if (subscription.status !== 'active') return false;
    
      // Check if subscription is expired
      if (subscription.endDate && subscription.endDate.toDate() < new Date()) {
        // Auto-expire the subscription
        await expireSubscription(userId);
        return false;
      }
    
      return true;
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      return false;
    }
  }

  // Get subscription limits based on plan
  export function getSubscriptionLimits(planId: string) {
    const limits = {
      free_tier: {
        maxChats: 4,
        maxQuestionsPerChat: 10,
        tokenLimit: 5000,
      },
      gold_tier: {
        maxChats: 100,
        maxQuestionsPerChat: -1, // unlimited
        tokenLimit: 2000000,
      },
      diamond_tier: {
        maxChats: -1, // unlimited
        maxQuestionsPerChat: -1, // unlimited
        tokenLimit: -1, // unlimited
      },
    };

    return limits[planId as keyof typeof limits] || limits.free_tier;
  }

  // Force check and handle subscription expiration
  export async function forceCheckExpiration(userId: string): Promise<boolean> {
    try {
      const subscription = await getUserSubscription(userId);
    
      if (!subscription || subscription.planId === 'free_tier') {
        return false; // No subscription to expire
      }
    
      // Check if subscription is expired
      if (subscription.endDate && subscription.endDate.toDate() < new Date()) {
        await expireSubscription(userId);
        return true; // Was expired and handled
      }
    
      return false; // Not expired
    } catch (error) {
      console.error('❌ Error force checking expiration:', error);
      return false;
    }
  }
    // Mark that expiration warning has been shown to user
    export async function markExpirationWarningShown(userId: string): Promise<void> {
      try {
        checkFirebaseInitialization();
      
        const subscriptionRef = doc(db!, 'subscriptions', userId);
        await updateDoc(subscriptionRef, {
          expirationWarningShown: true,
          updatedAt: serverTimestamp(),
        });
        console.log('✅ Expiration warning marked as shown');
      } catch (error) {
        console.error('❌ Error marking expiration warning as shown:', error);
        throw error;
      }
    }

    // Force refresh subscription status from database
    export async function forceRefreshSubscriptionStatus(userId: string): Promise<void> {
      try {
        checkFirebaseInitialization();
      
        // Force check expiration and update status
        const subscription = await getUserSubscription(userId);
      
        if (!subscription || subscription.planId === 'free_tier') {
          return; // No subscription to refresh
        }
      
        // Check if subscription is expired
        if (subscription.endDate && subscription.endDate.toDate() < new Date()) {
          await expireSubscription(userId);
        }
      
        console.log('✅ Subscription status refreshed');
      } catch (error) {
        console.error('❌ Error force refreshing subscription status:', error);
        throw error;
      }
    }

    // Helper function to calculate days until expiration (takes endDate directly)
    export function calculateDaysUntilExpiration(endDate: any): number {
      if (!endDate) {
        return -1; // No expiration date
      }

      const now = new Date();
      const expirationDate = endDate.toDate ? endDate.toDate() : new Date(endDate);
      const timeDiff = expirationDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      return daysDiff;
    }

    // Helper function to check if subscription is expiring soon (takes endDate directly)
    export function isSubscriptionExpiringSoon(endDate: any, warningDays: number = 7): boolean {
      const daysUntilExpiration = calculateDaysUntilExpiration(endDate);
      return daysUntilExpiration > 0 && daysUntilExpiration <= warningDays;
    }

    // Helper function to check if subscription is expired (takes endDate directly)
    export function isSubscriptionExpired(endDate: any): boolean {
      const daysUntilExpiration = calculateDaysUntilExpiration(endDate);
      return daysUntilExpiration <= 0 && daysUntilExpiration !== -1;
    }

    // Helper function to check if user was downgraded
    export function wasUserDowngraded(subscription: UserSubscription | null): boolean {
      return Boolean(
        subscription?.originalPlanId && 
        subscription.originalPlanId !== 'free_tier' && 
        subscription.planId === 'free_tier'
      );
    }
  // Get effective plan (considering expiration) - takes userId
  export async function getEffectivePlan(userId: string): Promise<string> {
    try {
      const subscription = await getUserSubscription(userId);
      
      if (!subscription) return 'free_tier';
      
      // If subscription is expired and not already on free tier, return free tier
      if (isSubscriptionExpired(subscription.endDate) && subscription.planId !== 'free_tier') {
        return 'free_tier';
      }
      
      return subscription.planId;
    } catch (error) {
      console.error('❌ Error getting effective plan:', error);
      return 'free_tier';
    }  }