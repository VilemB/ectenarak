import mongoose from "mongoose";

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
});

const BookSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Author",
  },
  notes: [NoteSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a compound index on userId, title, and author to prevent duplicates
BookSchema.index({ userId: 1, title: 1, author: 1 }, { unique: true });

// Update the updatedAt field on save
BookSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Book || mongoose.model("Book", BookSchema);
