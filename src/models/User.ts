import mongoose from "mongoose";

/**
 * Schema for users
 * Each user can have multiple books in their library
 */
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: false, // Not required for OAuth users
  },
  // Authentication information
  auth: {
    provider: {
      type: String,
      enum: ["local", "google", "facebook", "apple"],
      default: "local",
    },
    providerId: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
  // Array to store references to the user's books
  books: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Book",
    default: [], // Explicitly default to an empty array
  },
  // Subscription information
  subscription: {
    tier: {
      type: String,
      enum: ["free", "basic", "premium"],
      default: "free",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    isYearly: {
      type: Boolean,
      default: false,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    aiCreditsTotal: {
      type: Number,
      default: 3, // Default for free tier
    },
    aiCreditsRemaining: {
      type: Number,
      default: 3, // Default for free tier
    },
    lastRenewalDate: {
      type: Date,
      default: Date.now,
    },
    nextRenewalDate: {
      type: Date,
      default: function () {
        const now = new Date();
        return new Date(now.setMonth(now.getMonth() + 1));
      },
    },
  },
});

// Create indexes for common queries
// UserSchema.index({ email: 1 }); // Removed redundant index (unique: true is used in schema)
UserSchema.index({ "auth.provider": 1, "auth.providerId": 1 });

// Update the updatedAt field on save
UserSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

/* // Removed conflicting virtual field definition
// Virtual for getting all books by this user
// This is a reverse reference - not stored in the database
UserSchema.virtual("books", {
  ref: "Book",
  localField: "_id",
  foreignField: "userId",
  justOne: false,
});
*/

// Method to update last login time
UserSchema.methods.updateLastLogin = async function () {
  this.lastLoginAt = new Date();
  await this.save();
};

// Method to check if user has access to a specific feature
UserSchema.methods.hasAccess = function (feature: string) {
  const SUBSCRIPTION_LIMITS = {
    free: {
      maxBooks: 5,
      aiCreditsPerMonth: 3,
      exportToPdf: false,
      advancedNoteFormat: false,
      aiAuthorSummary: true,
      aiCustomization: false,
      detailedAuthorInfo: false,
      extendedAiSummary: false,
    },
    basic: {
      maxBooks: 100,
      aiCreditsPerMonth: 50,
      exportToPdf: true,
      advancedNoteFormat: true,
      aiAuthorSummary: true,
      aiCustomization: false,
      detailedAuthorInfo: true,
      extendedAiSummary: false,
    },
    premium: {
      maxBooks: 1000,
      aiCreditsPerMonth: 100,
      exportToPdf: true,
      advancedNoteFormat: true,
      aiAuthorSummary: true,
      aiCustomization: true,
      detailedAuthorInfo: true,
      extendedAiSummary: true,
    },
  };

  // Define feature type for TypeScript
  type FeatureKey = keyof typeof SUBSCRIPTION_LIMITS.free;

  const { tier } = this.subscription || { tier: "free" };
  return Boolean(
    SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS][
      feature as FeatureKey
    ]
  );
};

// Method to check if user has reached their book limit
UserSchema.methods.hasReachedBookLimit = async function () {
  const bookCount = await mongoose
    .model("Book")
    .countDocuments({ userId: this._id });
  const SUBSCRIPTION_LIMITS = {
    free: { maxBooks: 5 },
    basic: { maxBooks: 50 },
    premium: { maxBooks: Infinity },
  };

  const { tier } = this.subscription || { tier: "free" };
  return (
    bookCount >=
    SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS].maxBooks
  );
};

// Method to check if user has remaining AI credits
UserSchema.methods.hasRemainingAiCredits = function () {
  return (this.subscription?.aiCreditsRemaining || 0) > 0;
};

// Method to use an AI credit
UserSchema.methods.useAiCredit = async function () {
  if (!this.hasRemainingAiCredits()) {
    throw new Error("No AI credits remaining");
  }

  this.subscription.aiCreditsRemaining -= 1;
  await this.save();
  return this.subscription.aiCreditsRemaining;
};

// Method to renew AI credits
UserSchema.methods.renewAiCredits = async function (): Promise<{
  tier: string;
  aiCreditsTotal: number;
  aiCreditsRemaining: number;
  lastRenewalDate: Date;
  nextRenewalDate: Date;
}> {
  const SUBSCRIPTION_LIMITS = {
    free: { aiCreditsPerMonth: 3 },
    basic: { aiCreditsPerMonth: 50 },
    premium: { aiCreditsPerMonth: 100 },
  };

  const { tier } = this.subscription || { tier: "free" };
  const tierType = tier as keyof typeof SUBSCRIPTION_LIMITS;

  this.subscription.aiCreditsTotal =
    SUBSCRIPTION_LIMITS[tierType].aiCreditsPerMonth;
  this.subscription.aiCreditsRemaining =
    SUBSCRIPTION_LIMITS[tierType].aiCreditsPerMonth;
  this.subscription.lastRenewalDate = new Date();

  // Set next renewal date to 1 month from now
  const nextRenewal = new Date();
  nextRenewal.setMonth(nextRenewal.getMonth() + 1);
  this.subscription.nextRenewalDate = nextRenewal;

  await this.save();
  return this.subscription;
};

// Configure the model to include virtuals when converted to JSON
UserSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    // delete ret.books; // Optionally remove the populated virtual if keeping the real one
    // Don't expose password in JSON
    delete ret.password;
    delete ret.auth.resetPasswordToken;
    delete ret.auth.resetPasswordExpires;
    return ret;
  },
});

// Define interface for TypeScript type checking
interface IUser {
  email: string;
  name: string;
  password?: string;
  books?: mongoose.Types.ObjectId[]; // Add the real books array to the interface
  auth?: {
    provider: "local" | "google" | "facebook" | "apple";
    providerId?: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
  };
  subscription?: {
    tier: "free" | "basic" | "premium";
    startDate: Date;
    endDate?: Date;
    isYearly: boolean;
    autoRenew: boolean;
    aiCreditsTotal: number;
    aiCreditsRemaining: number;
    lastRenewalDate: Date;
    nextRenewalDate: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  updateLastLogin(): Promise<void>;
  hasAccess(feature: string): boolean;
  hasReachedBookLimit(): Promise<boolean>;
  hasRemainingAiCredits(): boolean;
  useAiCredit(): Promise<number>;
  renewAiCredits(): Promise<{
    tier: string;
    aiCreditsTotal: number;
    aiCreditsRemaining: number;
    lastRenewalDate: Date;
    nextRenewalDate: Date;
  }>;
}

// Create and export the User model
const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
