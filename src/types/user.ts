export type SubscriptionTier = "free" | "basic" | "premium";

export type SubscriptionFeature =
  | "maxBooks"
  | "aiCreditsPerMonth"
  | "exportToPdf"
  | "advancedNoteFormat"
  | "aiAuthorSummary"
  | "aiCustomization"
  | "detailedAuthorInfo"
  | "extendedAiSummary";

export interface UserSubscription {
  tier: SubscriptionTier;
  startDate: Date;
  endDate?: Date;
  isYearly: boolean;
  aiCreditsRemaining: number;
  aiCreditsTotal: number;
  autoRenew: boolean;
  lastRenewalDate: Date;
  nextRenewalDate: Date;
  stripePriceId?: string | null;
  stripeSubscriptionId?: string | null;
  cancelAtPeriodEnd?: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  subscription: UserSubscription;
  createdAt: Date;
  updatedAt: Date;
}

// Define feature limits for each subscription tier
export const SUBSCRIPTION_LIMITS = {
  free: {
    maxBooks: 5,
    aiCreditsPerMonth: 3,
    exportToPdf: false,
    advancedNoteFormat: false,
    aiAuthorSummary: false,
    aiCustomization: false,
    detailedAuthorInfo: false,
    extendedAiSummary: false,
  },
  basic: {
    maxBooks: 50,
    aiCreditsPerMonth: 50,
    exportToPdf: true,
    advancedNoteFormat: true,
    aiAuthorSummary: true,
    aiCustomization: false,
    detailedAuthorInfo: false,
    extendedAiSummary: false,
  },
  premium: {
    maxBooks: Infinity,
    aiCreditsPerMonth: 100,
    exportToPdf: true,
    advancedNoteFormat: true,
    aiAuthorSummary: true,
    aiCustomization: true,
    detailedAuthorInfo: true,
    extendedAiSummary: true,
  },
};

// Define pricing for each subscription tier
export const SUBSCRIPTION_PRICING = {
  basic: {
    monthly: 49,
    yearly: 468, // 39 Kč per month when paid yearly
  },
  premium: {
    monthly: 79,
    yearly: 756, // 63 Kč per month when paid yearly
  },
};

/**
 * Check if a user has access to a specific feature
 */
export function hasAccess(user: User, feature: SubscriptionFeature): boolean {
  const { tier } = user.subscription;
  return Boolean(SUBSCRIPTION_LIMITS[tier][feature]);
}

/**
 * Check if a user has reached their book limit
 */
export function hasReachedBookLimit(
  user: User,
  currentBookCount: number
): boolean {
  const { tier } = user.subscription;
  const maxBooks = SUBSCRIPTION_LIMITS[tier].maxBooks;
  return currentBookCount >= maxBooks;
}

/**
 * Check if a user has remaining AI credits
 */
export function hasRemainingAiCredits(user: User): boolean {
  return user.subscription.aiCreditsRemaining > 0;
}
