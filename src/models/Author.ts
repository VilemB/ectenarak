import mongoose from "mongoose";

/**
 * Schema for authors
 * Each author can be associated with multiple books
 */
const AuthorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  summary: {
    type: String,
    default: null,
  },
  birthDate: {
    type: Date,
  },
  deathDate: {
    type: Date,
  },
  nationality: {
    type: String,
    trim: true,
  },
  genres: {
    type: [String],
    default: [],
  },
  biography: {
    type: String,
  },
  photoUrl: {
    type: String,
  },
  // External identifiers for integration with other services
  externalIds: {
    goodreads: String,
    wikipedia: String,
    librarything: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for common queries
// AuthorSchema.index({ name: 1 }); // Removed duplicate index (unique: true used in schema)
AuthorSchema.index({ nationality: 1 });
AuthorSchema.index({ genres: 1 });

// Update the updatedAt field on save
AuthorSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for getting all books by this author
// This is a reverse reference - not stored in the database
AuthorSchema.virtual("books", {
  ref: "Book",
  localField: "_id",
  foreignField: "authorId",
  justOne: false,
});

// Configure the model to include virtuals when converted to JSON
AuthorSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Define interface for TypeScript type checking
interface IAuthor {
  name: string;
  summary?: string;
  birthDate?: Date;
  deathDate?: Date;
  nationality?: string;
  genres?: string[];
  biography?: string;
  photoUrl?: string;
  externalIds?: {
    goodreads?: string;
    wikipedia?: string;
    librarything?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Create and export the Author model
const Author =
  mongoose.models.Author || mongoose.model<IAuthor>("Author", AuthorSchema);

export default Author;
