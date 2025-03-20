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
  image: {
    type: String,
    required: false,
  },
  // User preferences
  preferences: {
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    language: {
      type: String,
      default: "cs",
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    privacySettings: {
      shareReadingActivity: {
        type: Boolean,
        default: false,
      },
      shareLibrary: {
        type: Boolean,
        default: false,
      },
    },
  },
  // User profile information
  profile: {
    bio: {
      type: String,
    },
    location: {
      type: String,
    },
    website: {
      type: String,
    },
    favoriteGenres: {
      type: [String],
      default: [],
    },
  },
  // Reading statistics
  stats: {
    booksRead: {
      type: Number,
      default: 0,
    },
    pagesRead: {
      type: Number,
      default: 0,
    },
    notesCreated: {
      type: Number,
      default: 0,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
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
    paymentHistory: [
      {
        amount: Number,
        currency: {
          type: String,
          default: "CZK",
        },
        date: {
          type: Date,
          default: Date.now,
        },
        paymentMethod: String,
        transactionId: String,
        status: {
          type: String,
          enum: ["pending", "completed", "failed", "refunded"],
          default: "completed",
        },
      },
    ],
  },
});

// Create indexes for common queries
UserSchema.index({ email: 1 });
UserSchema.index({ "auth.provider": 1, "auth.providerId": 1 });
UserSchema.index({ "profile.favoriteGenres": 1 });

// Update the updatedAt field on save
UserSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for getting all books by this user
// This is a reverse reference - not stored in the database
UserSchema.virtual("books", {
  ref: "Book",
  localField: "_id",
  foreignField: "userId",
  justOne: false,
});

// Method to update user statistics
UserSchema.methods.updateStats = async function () {
  // Get all books for this user
  const books = await mongoose.model("Book").find({ userId: this._id });

  // Calculate statistics
  const booksRead = books.filter((book) => book.status === "completed").length;
  const pagesRead = books.reduce((total, book) => {
    if (book.status === "completed" && book.totalPages) {
      return total + book.totalPages;
    }
    return total + (book.currentPage || 0);
  }, 0);

  const notesCreated = books.reduce((total, book) => {
    return total + (book.notes ? book.notes.length : 0);
  }, 0);

  // Update stats
  this.stats.booksRead = booksRead;
  this.stats.pagesRead = pagesRead;
  this.stats.notesCreated = notesCreated;
  this.stats.lastActiveAt = new Date();

  await this.save();
};

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
      maxBooks: 50,
      aiCreditsPerMonth: 50,
      exportToPdf: true,
      advancedNoteFormat: true,
      aiAuthorSummary: true,
      aiCustomization: true,
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
  image?: string;
  preferences?: {
    theme?: "light" | "dark" | "system";
    language?: string;
    emailNotifications?: boolean;
    privacySettings?: {
      shareReadingActivity?: boolean;
      shareLibrary?: boolean;
    };
  };
  profile?: {
    bio?: string;
    location?: string;
    website?: string;
    favoriteGenres?: string[];
  };
  stats?: {
    booksRead: number;
    pagesRead: number;
    notesCreated: number;
    lastActiveAt: Date;
  };
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
    paymentHistory?: Array<{
      amount: number;
      currency: string;
      date: Date;
      paymentMethod?: string;
      transactionId?: string;
      status: "pending" | "completed" | "failed" | "refunded";
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  updateStats(): Promise<void>;
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
