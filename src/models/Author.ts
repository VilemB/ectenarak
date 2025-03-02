import mongoose from "mongoose";

const AuthorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  summary: {
    type: String,
    default: null,
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

// Update the updatedAt field on save
AuthorSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Author || mongoose.model("Author", AuthorSchema);
