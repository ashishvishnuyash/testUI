"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { 
  getTokenUsageSummary, 
  canUserUseTokens, 
  PlanId 
} from '@/lib/firebase/tokenUsage';

interface TokenUsageSummary {
  currentUsage: number;
  limit: number;
  remaining: number;
  percentage: number;
  isUnlimited: boolean;
  resetDate: Date | null;
}

interface TokenCheck {
  canUse: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
}

export function useTokenUsage() {
  const { user } = useAuth();
  const { effectivePlan } = useSubscription();
  const [tokenSummary, setTokenSummary] = useState<TokenUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenUsage = useCallback(async () => {
    if (!user || !effectivePlan) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const summary = await getTokenUsageSummary(user.uid, effectivePlan as PlanId);
      setTokenSummary(summary);
    } catch (err) {
      console.error('Error fetching token usage:', err);
      setError('Failed to load token usage data');
    } finally {
      setLoading(false);
    }
  }, [user, effectivePlan]);

  const checkTokenUsage = useCallback(async (requestedTokens: number = 0): Promise<TokenCheck | null> => {
    if (!user || !effectivePlan) return null;

    try {
      const check = await canUserUseTokens(user.uid, effectivePlan as PlanId, requestedTokens);
      return check;
    } catch (err) {
      console.error('Error checking token usage:', err);
      return null;
    }
  }, [user, effectivePlan]);

  const refreshTokenUsage = useCallback(() => {
    setLoading(true);
    fetchTokenUsage();
  }, [fetchTokenUsage]);

  useEffect(() => {
    fetchTokenUsage();
  }, [fetchTokenUsage]);

  return {
    tokenSummary,
    loading,
    error,
    refreshTokenUsage,
    checkTokenUsage,
    canUseTokens: tokenSummary ? (tokenSummary.isUnlimited || tokenSummary.remaining > 0) : false,
    isNearLimit: tokenSummary ? (!tokenSummary.isUnlimited && tokenSummary.percentage >= 75) : false,
    isAtLimit: tokenSummary ? (!tokenSummary.isUnlimited && tokenSummary.remaining <= 0) : false,
    isUnlimited: tokenSummary?.isUnlimited || false,
  };
}