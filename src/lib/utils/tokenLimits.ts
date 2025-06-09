export const TOKEN_LIMITS = {
  free: 1000,
  premium: 10000,
  pro: 50000,
} as const;

export type PlanType = keyof typeof TOKEN_LIMITS;

export function getTokenLimit(planId: string | null | undefined): number {
  const plan = (planId as PlanType) || 'free';
  return TOKEN_LIMITS[plan] || TOKEN_LIMITS.free;
}