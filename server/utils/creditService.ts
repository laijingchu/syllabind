import { storage } from '../storage';

// Credit costs for AI features
export const CREDIT_COSTS = {
  per_week: 10,        // Generation cost = durationWeeks * 10
  improve_writing: 1,
  auto_fill: 0,        // Free for all
} as const;

// Plan limits
export const FREE_TIER_CREDITS = 100;
export const PRO_CYCLE_CREDITS = 130;
export const FREE_ENROLLMENT_LIMIT = 1;
export const FREE_MANUAL_BINDER_LIMIT = 3;
export const FREE_MAX_WEEKS = 4;
export const PRO_MAX_WEEKS = 6;

// Credit transaction types
export type CreditTransactionType =
  | 'signup_grant'
  | 'subscription_grant'
  | 'package_purchase'
  | 'generation'
  | 'week_regen'
  | 'improve_writing'
  | 'admin_adjustment'
  | 'refund';

// Credit packages available for Pro users
export const CREDIT_PACKAGES = {
  credits_100: { credits: 100, price: 4.99 },
  credits_250: { credits: 250, price: 9.99 },
  credits_550: { credits: 550, price: 19.99 },
} as const;

/**
 * Reserve credits atomically before an API call.
 * Uses SELECT FOR UPDATE via the storage atomic deduction.
 * Returns transactionId for potential refund on failure.
 */
export async function reserveCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  description: string,
  metadata?: string
): Promise<{ success: true; transactionId: number; newBalance: number } | { success: false; error: string }> {
  if (amount <= 0) {
    return { success: true, transactionId: 0, newBalance: 0 };
  }
  try {
    const result = await storage.deductCredits(userId, amount, type, description, metadata);
    return { success: true, transactionId: result.transactionId, newBalance: result.newBalance };
  } catch (err: any) {
    if (err.message === 'INSUFFICIENT_CREDITS') {
      return { success: false, error: 'INSUFFICIENT_CREDITS' };
    }
    throw err;
  }
}

/**
 * Refund credits on failure/cancellation.
 * Logs a positive 'refund' transaction linked to the original.
 */
export async function refundCredits(
  userId: string,
  amount: number,
  originalTransactionId: number,
  reason: string
): Promise<{ newBalance: number }> {
  const result = await storage.grantCredits(
    userId,
    amount,
    'refund',
    reason,
    `refund_of:${originalTransactionId}`
  );
  return { newBalance: result.newBalance };
}

/**
 * Check if user can afford a credit cost (non-blocking check).
 */
export async function canAfford(userId: string, cost: number): Promise<boolean> {
  if (cost <= 0) return true;
  const balance = await storage.getCreditBalance(userId);
  return balance >= cost;
}

/**
 * Grant subscription credits with deduplication.
 * Only grants if creditsGrantedAt is older than the current billing cycle.
 */
export async function grantSubscriptionCredits(userId: string): Promise<{ granted: boolean; newBalance?: number }> {
  const user = await storage.getUser(userId);
  if (!user) return { granted: false };

  // Lifetime users don't get monthly grants (they got 5,000 upfront)
  if (user.subscriptionTier === 'lifetime') {
    return { granted: false };
  }

  // Only pro_monthly and pro_annual get grants
  if (user.subscriptionTier !== 'pro_monthly' && user.subscriptionTier !== 'pro_annual') {
    return { granted: false };
  }

  // Deduplication: check if already granted this month
  const now = new Date();
  if (user.creditsGrantedAt) {
    const lastGrant = new Date(user.creditsGrantedAt);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    if (lastGrant >= monthStart) {
      return { granted: false };
    }
  }

  // Reset to PRO_CYCLE_CREDITS (no rollover of unused monthly credits)
  const result = await storage.resetCreditsTo(
    userId,
    PRO_CYCLE_CREDITS,
    'subscription_grant',
    `Monthly ${PRO_CYCLE_CREDITS} credit reset (no rollover)`
  );

  // Update creditsGrantedAt timestamp
  await storage.updateUser(userId, { creditsGrantedAt: now } as any);

  return { granted: true, newBalance: result.newBalance };
}

/**
 * Grant signup credits to a new free user.
 */
export async function grantSignupCredits(userId: string): Promise<{ newBalance: number }> {
  const result = await storage.grantCredits(
    userId,
    FREE_TIER_CREDITS,
    'signup_grant',
    `Welcome! ${FREE_TIER_CREDITS} free credits`
  );
  return { newBalance: result.newBalance };
}

/**
 * Calculate generation cost based on duration weeks.
 */
export function getGenerationCost(durationWeeks: number): number {
  return durationWeeks * CREDIT_COSTS.per_week;
}

/**
 * Get the max weeks allowed for a user's tier.
 */
export function getMaxWeeks(subscriptionTier: string, isAdmin: boolean): number {
  if (isAdmin) return PRO_MAX_WEEKS;
  return subscriptionTier === 'free' ? FREE_MAX_WEEKS : PRO_MAX_WEEKS;
}

/**
 * Check if user is on a Pro plan (any tier).
 */
export function isProTier(subscriptionTier: string): boolean {
  return ['pro_monthly', 'pro_annual', 'lifetime'].includes(subscriptionTier);
}
