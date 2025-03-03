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
  // User ID from authentication provider (Google, etc.)
  userId: {
    type: String,
    required: true,
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
  },
  // Embedded notes array
  notes: [NoteSchema],
  // Optional author summary that can be generated via AI
  authorSummary: {
    type: String,
    default: null,
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

// Update the updatedAt field on save
BookSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for getting the note count
BookSchema.virtual("noteCount").get(function () {
  return this.notes ? this.notes.length : 0;
});

// Define interfaces for TypeScript type checking
interface INote {
  _id?: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  isAISummary: boolean;
}

interface IBook {
  userId: string;
  title: string;
  author: string;
  authorSummary?: string;
  authorId?: mongoose.Types.ObjectId;
  notes: INote[];
  createdAt: Date;
  updatedAt: Date;
  addNote(content: string, isAISummary?: boolean): Promise<void>;
  removeNote(noteId: string): Promise<void>;
}

/**
 * Method to add a note to a book
 * @param {string} content - The content of the note
 * @param {boolean} isAISummary - Whether the note is an AI-generated summary
 * @returns {Promise<void>}
 */
BookSchema.methods.addNote = async function (
  content: string,
  isAISummary: boolean = false
): Promise<void> {
  const note: INote = {
    content,
    createdAt: new Date(),
    isAISummary,
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
