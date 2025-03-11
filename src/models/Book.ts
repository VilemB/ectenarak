import mongoose from "mongoose";

/**
 * Schema for notes within a book
 * Each note belongs to a specific book and contains content and metadata
 */
const NoteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isAISummary: {
    type: Boolean,
    default: false,
  },
  // Optional field to track who created the note (for future collaborative features)
  createdBy: {
    type: String,
    default: null,
  },
});

/**
 * Schema for books
 * Each book belongs to a user and can have multiple notes
 */
const BookSchema = new mongoose.Schema({
  // User ID reference to User model
  userId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true,
    ref: "User",
  },
  // Legacy userId field for backward compatibility
  legacyUserId: {
    type: String,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
    trim: true,
  },
  // Reference to the Author model
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Author",
    required: true,
  },
  // Embedded notes array
  notes: [NoteSchema],
  // Optional author summary that can be generated via AI
  authorSummary: {
    type: String,
    default: null,
  },
  // Enhanced book metadata
  isbn: {
    type: String,
    trim: true,
  },
  publishedYear: {
    type: Number,
  },
  genre: {
    type: [String],
    default: [],
  },
  coverImage: {
    type: String,
  },
  description: {
    type: String,
  },
  // Enhanced reading progress tracking
  currentPage: {
    type: Number,
    default: 0,
  },
  totalPages: {
    type: Number,
  },
  readingStartDate: {
    type: Date,
  },
  readingCompletionDate: {
    type: Date,
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // Optional metadata for future features
  metadata: {
    type: Map,
    of: String,
    default: () => new Map(),
  },
  // Track reading status
  status: {
    type: String,
    enum: ["not_started", "in_progress", "completed"],
    default: "not_started",
  },
});

// Create a compound index on userId, title, and author to prevent duplicates
BookSchema.index({ userId: 1, title: 1, author: 1 }, { unique: true });

// Create an index on notes to improve query performance
BookSchema.index({ "notes.createdAt": -1 });

// Create an index on status for filtering books by status
BookSchema.index({ userId: 1, status: 1 });

// Create an index on genre for filtering books by genre
BookSchema.index({ userId: 1, genre: 1 });

// Update the updatedAt field on save
BookSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Update reading status based on progress
BookSchema.pre("save", function (next) {
  // If reading start date is set but status is not_started, update to in_progress
  if (this.readingStartDate && this.status === "not_started") {
    this.status = "in_progress";
  }

  // If reading completion date is set, update to completed
  if (this.readingCompletionDate) {
    this.status = "completed";
  }

  next();
});

// Virtual for getting the note count
BookSchema.virtual("noteCount").get(function () {
  return this.notes ? this.notes.length : 0;
});

// Virtual for calculating reading progress percentage
BookSchema.virtual("progressPercentage").get(function () {
  if (!this.totalPages || this.totalPages === 0) return 0;
  return Math.min(100, Math.round((this.currentPage / this.totalPages) * 100));
});

// Define interfaces for TypeScript type checking
interface INote {
  _id?: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  isAISummary: boolean;
  createdBy?: string;
}

interface IBook {
  userId: mongoose.Types.ObjectId | string;
  legacyUserId?: string;
  title: string;
  author: string;
  authorId: mongoose.Types.ObjectId;
  notes: INote[];
  authorSummary?: string;
  isbn?: string;
  publishedYear?: number;
  genre?: string[];
  coverImage?: string;
  description?: string;
  currentPage?: number;
  totalPages?: number;
  readingStartDate?: Date;
  readingCompletionDate?: Date;
  status: "not_started" | "in_progress" | "completed";
  createdAt: Date;
  updatedAt: Date;
  noteCount: number;
  progressPercentage: number;
  addNote(
    content: string,
    isAISummary?: boolean,
    createdBy?: string
  ): Promise<void>;
  removeNote(noteId: string): Promise<void>;
  updateReadingProgress(
    currentPage: number,
    totalPages?: number
  ): Promise<void>;
  startReading(): Promise<void>;
  completeReading(): Promise<void>;
}

/**
 * Method to add a note to a book
 * @param {string} content - The content of the note
 * @param {boolean} isAISummary - Whether the note is an AI-generated summary
 * @param {string} createdBy - Optional user identifier who created the note
 * @returns {Promise<void>}
 */
BookSchema.methods.addNote = async function (
  content: string,
  isAISummary: boolean = false,
  createdBy?: string
): Promise<void> {
  const note: INote = {
    content,
    createdAt: new Date(),
    isAISummary,
    createdBy,
  };

  this.notes.push(note);
  await this.save();
};

/**
 * Method to remove a note from a book
 * @param {string} noteId - The ID of the note to remove
 * @returns {Promise<void>}
 */
BookSchema.methods.removeNote = async function (noteId: string): Promise<void> {
  const noteIndex = this.notes.findIndex(
    (note: INote) => note._id && note._id.toString() === noteId
  );

  if (noteIndex === -1) {
    throw new Error("Note not found");
  }

  this.notes.splice(noteIndex, 1);
  await this.save();
};

/**
 * Method to update reading progress
 * @param {number} currentPage - The current page
 * @param {number} totalPages - Optional total pages (if not already set)
 * @returns {Promise<void>}
 */
BookSchema.methods.updateReadingProgress = async function (
  currentPage: number,
  totalPages?: number
): Promise<void> {
  this.currentPage = currentPage;

  if (totalPages && (!this.totalPages || this.totalPages === 0)) {
    this.totalPages = totalPages;
  }

  // If this is the first update and we don't have a start date, set it
  if (!this.readingStartDate && currentPage > 0) {
    this.readingStartDate = new Date();
    this.status = "in_progress";
  }

  // If we've reached the end, mark as completed
  if (this.totalPages && currentPage >= this.totalPages) {
    this.readingCompletionDate = new Date();
    this.status = "completed";
  }

  await this.save();
};

/**
 * Method to mark a book as started reading
 * @returns {Promise<void>}
 */
BookSchema.methods.startReading = async function (): Promise<void> {
  this.readingStartDate = new Date();
  this.status = "in_progress";
  await this.save();
};

/**
 * Method to mark a book as completed
 * @returns {Promise<void>}
 */
BookSchema.methods.completeReading = async function (): Promise<void> {
  this.readingCompletionDate = new Date();
  this.status = "completed";

  // If we don't have a start date, set it to now minus 1 day
  if (!this.readingStartDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    this.readingStartDate = yesterday;
  }

  await this.save();
};

// Configure the model to include virtuals when converted to JSON
BookSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Create and export the Book model
const Book = mongoose.models.Book || mongoose.model<IBook>("Book", BookSchema);

export default Book;
