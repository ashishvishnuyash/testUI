import { db } from './config';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { analyzeSubscriptionStatus } from '@/lib/utils/subscriptionUtils';
import { UserSubscription } from '@/lib/firebase/subscriptions';

export interface TokenUsage {
  userId: string;
  totalTokensUsed: number;
  monthlyTokensUsed: number;
  lastResetDate: Date;
  currentMonth: string; // Format: YYYY-MM
  lastUpdated: Date;
}

export interface TokenUsageRecord {
  userId: string;
  chatId: string;
  tokensUsed: number;
  timestamp: Date;
  planId: string;
  messageContent?: string;
}

// Token limits by subscription tier
export const TOKEN_LIMITS = {
  free_tier: 5000,
  gold_tier: 2000000, // 2 million
  diamond_tier: -1, // Unlimited (-1 indicates unlimited)
} as const;

export type PlanId = keyof typeof TOKEN_LIMITS;

// Helper function to get effective plan from subscription
function getEffectivePlan(subscription: UserSubscription | null): PlanId {
  const status = analyzeSubscriptionStatus(subscription);
  return status.effectivePlan as PlanId;
}

// Helper function to get token limit for a plan
function getTokenLimitForPlan(planId: PlanId): number {
  return TOKEN_LIMITS[planId];
}

// Get current month string
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Check if we need to reset monthly usage
function shouldResetMonthlyUsage(lastResetDate: Date | null, currentMonth: string): boolean {
  if (!lastResetDate) return true;
  
  const lastResetMonth = `${lastResetDate.getFullYear()}-${String(lastResetDate.getMonth() + 1).padStart(2, '0')}`;
  return lastResetMonth !== currentMonth;
}

// Get user's current token usage
export async function getUserTokenUsage(userId: string): Promise<TokenUsage | null> {
  try {
    if (!db) throw new Error('Database not initialized');
    
    const tokenUsageRef = doc(db, 'tokenUsage', userId);
    const tokenUsageSnap = await getDoc(tokenUsageRef);
    
    if (!tokenUsageSnap.exists()) {
      return null;
    }
    
    const data = tokenUsageSnap.data();
    return {
      userId: data.userId,
      totalTokensUsed: data.totalTokensUsed || 0,
      monthlyTokensUsed: data.monthlyTokensUsed || 0,
      lastResetDate: data.lastResetDate?.toDate() || null,
      currentMonth: data.currentMonth || getCurrentMonth(),
      lastUpdated: data.lastUpdated?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting user token usage:', error);
    return null;
  }
}

// Initialize or reset user token usage
export async function initializeUserTokenUsage(userId: string): Promise<TokenUsage> {
  try {
    if (!db) throw new Error('Database not initialized');
    
    const currentMonth = getCurrentMonth();
    const now = new Date();
    
    const tokenUsage: TokenUsage = {
      userId,
      totalTokensUsed: 0,
      monthlyTokensUsed: 0,
      lastResetDate: now,
      currentMonth,
      lastUpdated: now,
    };
    
    const tokenUsageRef = doc(db, 'tokenUsage', userId);
    await setDoc(tokenUsageRef, {
      ...tokenUsage,
      lastResetDate: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });
    
    return tokenUsage;
  } catch (error) {
    console.error('Error initializing user token usage:', error);
    throw error;
  }
}

// Check if user can use tokens (within their limit) - Updated to use subscription
export async function canUserUseTokens(
  userId: string, 
  subscription: UserSubscription | null, 
  requestedTokens: number = 0
): Promise<{
  canUse: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  effectivePlan: string;
}> {
  try {
    const effectivePlan = getEffectivePlan(subscription);
    const limit = getTokenLimitForPlan(effectivePlan);
    const isUnlimited = limit === -1;
    
    if (isUnlimited) {
      return {
        canUse: true,
        currentUsage: 0,
        limit: -1,
        remaining: -1,
        isUnlimited: true,
        effectivePlan,
      };
    }
    
    let tokenUsage = await getUserTokenUsage(userId);
    const currentMonth = getCurrentMonth();
    
    // Initialize if doesn't exist
    if (!tokenUsage) {
      tokenUsage = await initializeUserTokenUsage(userId);
    }
    
    // Reset monthly usage if needed
    if (shouldResetMonthlyUsage(tokenUsage.lastResetDate, currentMonth)) {
      await resetMonthlyTokenUsage(userId);
      tokenUsage.monthlyTokensUsed = 0;
    }
    
    const currentUsage = tokenUsage.monthlyTokensUsed;
    const remaining = Math.max(0, limit - currentUsage);
    const canUse = currentUsage + requestedTokens <= limit;
    
    return {
      canUse,
      currentUsage,
      limit,
      remaining,
      isUnlimited: false,
      effectivePlan,
    };
  } catch (error) {
    console.error('Error checking token usage:', error);
    // Default to allowing usage in case of error
    const effectivePlan = getEffectivePlan(subscription);
    const limit = getTokenLimitForPlan(effectivePlan);
    return {
      canUse: true,
      currentUsage: 0,
      limit,
      remaining: limit,
      isUnlimited: limit === -1,
      effectivePlan,
    };
  }
}

// Add token usage for a user - Updated to use actual token tracking
export async function ensureTokenUsageDocument(userId: string) {
  if (!db) throw new Error('Firestore not initialized');
  
  const tokenUsageRef = doc(db, 'tokenUsage', userId);
  const docSnap = await getDoc(tokenUsageRef);
  
  if (!docSnap.exists()) {
    await setDoc(tokenUsageRef, {
      userId,
      totalTokensUsed: 0,
      monthlyTokensUsed: 0,
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // console.log(`[TokenUsage] Created token usage document for user: ${userId}`);
  }
}

export async function addTokenUsage(
  userId: string,
  tokensUsed: number,
  chatId: string,
  subscription: any,
  prompt: string
) {
  try {
    if (!db) throw new Error('Firestore not initialized');
    
    // Ensure the document exists before updating
    await ensureTokenUsageDocument(userId);
    
    const tokenUsageRef = doc(db, 'tokenUsage', userId);
    
    // Now safely update the document
    await updateDoc(tokenUsageRef, {
      totalTokensUsed: increment(tokensUsed),
      monthlyTokensUsed: increment(tokensUsed),
      updatedAt: serverTimestamp(),
      lastChatId: chatId,
      lastPrompt: prompt.substring(0, 100), // Store first 100 chars
    });
    
    return { success: true };
  } catch (error) {
    console.error('[TokenUsage] Error adding token usage:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Reset monthly token usage
export async function resetMonthlyTokenUsage(userId: string): Promise<void> {
  try {
    if (!db) throw new Error('Database not initialized');
    
    const tokenUsageRef = doc(db, 'tokenUsage', userId);
    const currentMonth = getCurrentMonth();
    
    await updateDoc(tokenUsageRef, {
      monthlyTokensUsed: 0,
      currentMonth,
      lastResetDate: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error resetting monthly token usage:', error);
    throw error;
  }
}

// Get user's token usage history
export async function getUserTokenHistory(userId: string, limitCount: number = 10): Promise<TokenUsageRecord[]> {
  try {
    if (!db) throw new Error('Database not initialized');
    
    const q = query(
      collection(db, 'tokenUsageRecords'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as TokenUsageRecord;
    });
  } catch (error) {
    console.error('Error getting user token history:', error);
    return [];
  }
}

// Estimate tokens in text (rough estimation)
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  // This is a simplified estimation, real tokenization would be more accurate
  return Math.ceil(text.length / 4);
}

// Get token usage summary for display - Updated to use subscription
export async function getTokenUsageSummary(
  userId: string, 
  subscription: UserSubscription | null
): Promise<{
  currentUsage: number;
  limit: number;
  remaining: number;
  percentage: number;
  isUnlimited: boolean;
  resetDate: Date | null;
  effectivePlan: string;
}> {
  try {
    const effectivePlan = getEffectivePlan(subscription);
    const limit = getTokenLimitForPlan(effectivePlan);
    const isUnlimited = limit === -1;
    
    if (isUnlimited) {
      return {
        currentUsage: 0,
        limit: -1,
        remaining: -1,
        percentage: 0,
        isUnlimited: true,
        resetDate: null,
        effectivePlan,
      };
    }
    
    const tokenUsage = await getUserTokenUsage(userId);
    const currentUsage = tokenUsage?.monthlyTokensUsed || 0;
    const remaining = Math.max(0, limit - currentUsage);
    const percentage = limit > 0 ? (currentUsage / limit) * 100 : 0;
    
    // Calculate next reset date (first day of next month)
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    return {
      currentUsage,
      limit,
      remaining,
      percentage,
      isUnlimited: false,
      resetDate: nextMonth,
      effectivePlan,
    };
  } catch (error) {
    console.error('Error getting token usage summary:', error);
    const effectivePlan = getEffectivePlan(subscription);
    const limit = getTokenLimitForPlan(effectivePlan);
    return {
      currentUsage: 0,
      limit,
      remaining: limit,
      percentage: 0,
      isUnlimited: limit === -1,
      resetDate: null,
      effectivePlan,
    };
  }
}

// Updated checkTokenLimit to use subscription
export async function checkTokenLimit(
  userId: string,
  subscription: UserSubscription | null
): Promise<{ canProceed: boolean; remainingTokens: number; error?: string; effectivePlan: string }> {
  if (!db || !userId) {
    return { canProceed: false, remainingTokens: 0, error: 'Invalid parameters', effectivePlan: 'free_tier' };
  }

  try {
    const effectivePlan = getEffectivePlan(subscription);
    const limit = getTokenLimitForPlan(effectivePlan);
    
    if (limit === -1) {
      return { canProceed: true, remainingTokens: -1, effectivePlan };
    }
    
    const tokenUsage = await getUserTokenUsage(userId);
    const currentUsage = tokenUsage?.monthlyTokensUsed || 0;
    const remainingTokens = Math.max(0, limit - currentUsage);
    const canProceed = remainingTokens > 0;

    return { canProceed, remainingTokens, effectivePlan };
  } catch (error) {
    console.error('Error checking token limit:', error);
    return { 
      canProceed: false, 
      remainingTokens: 0, 
      error: 'Failed to check token limit',
      effectivePlan: 'free_tier'
    };
  }
}