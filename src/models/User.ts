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
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  updateStats(): Promise<void>;
  updateLastLogin(): Promise<void>;
}

// Create and export the User model
const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
