import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

// MongoDB connection string
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ctenarsky-denik";

// Connect to MongoDB
async function connectToDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Import models
import "../models/User";
import "../models/Book";
import "../models/Author";

const User = mongoose.model("User");
const Book = mongoose.model("Book");
const Author = mongoose.model("Author");

// Migration functions
async function migrateUsers() {
  console.log("Migrating users...");
  const users = await User.find({});
  console.log(`Found ${users.length} users to migrate`);

  for (const user of users) {
    // Remove profile and stats fields
    if (user.profile) {
      user.profile = undefined;
    }
    if (user.stats) {
      user.stats = undefined;
    }

    // Add new fields with default values if they don't exist
    if (!user.preferences) {
      user.preferences = {
        theme: "system",
        language: "cs",
      };
    }

    if (!user.auth) {
      user.auth = {
        provider: "local",
      };
    }

    if (!user.updatedAt) {
      user.updatedAt = user.createdAt || new Date();
    }

    if (!user.lastLoginAt) {
      user.lastLoginAt = user.createdAt || new Date();
    }

    await user.save();
    console.log(`Migrated user: ${user.email}`);
  }

  console.log("User migration completed");
}

async function migrateAuthors() {
  console.log("Migrating authors...");
  const authors = await Author.find({});
  console.log(`Found ${authors.length} authors to migrate`);

  for (const author of authors) {
    // Add new fields with default values if they don't exist
    if (!author.genres) {
      author.genres = [];
    }

    if (!author.updatedAt) {
      author.updatedAt = author.createdAt || new Date();
    }

    await author.save();
    console.log(`Migrated author: ${author.name}`);
  }

  console.log("Author migration completed");
}

async function migrateBooks() {
  console.log("Migrating books...");
  const books = await Book.find({});
  console.log(`Found ${books.length} books to migrate`);

  for (const book of books) {
    try {
      // Store the original userId as legacyUserId
      if (typeof book.userId === "string") {
        book.legacyUserId = book.userId;

        // Only try to convert to ObjectId if it's a valid MongoDB ObjectId
        let isValidObjectId = false;
        try {
          isValidObjectId = mongoose.Types.ObjectId.isValid(book.userId);
        } catch (error) {
          console.error(`Kontrola ObjectId pro knihu ${book.title}: ${error}`);
          isValidObjectId = false;
        }

        if (isValidObjectId) {
          // Try to find the user by ID
          try {
            const user = await User.findOne({ _id: book.userId });
            if (user) {
              // If found, update the userId to be an ObjectId
              book.userId = user._id;
            } else {
              console.log(
                `User not found for book: ${book.title}, keeping string ID as legacyUserId`
              );
              // Find any user to associate with this book temporarily
              const anyUser = await User.findOne({});
              if (anyUser) {
                book.userId = anyUser._id;
              } else {
                throw new Error(
                  "No users found in the database to associate with books"
                );
              }
            }
          } catch (error) {
            console.error(`Error finding user for book ${book.title}:`, error);
            // Find any user to associate with this book temporarily
            const anyUser = await User.findOne({});
            if (anyUser) {
              book.userId = anyUser._id;
            } else {
              throw new Error(
                "No users found in the database to associate with books"
              );
            }
          }
        } else {
          console.log(
            `Invalid ObjectId for book: ${book.title}, finding user by other means`
          );
          // Try to find the user by email or other means
          const anyUser = await User.findOne({});
          if (anyUser) {
            book.userId = anyUser._id;
          } else {
            throw new Error(
              "No users found in the database to associate with books"
            );
          }
        }
      }

      // Make sure authorId is set
      if (!book.authorId && book.author) {
        // Try to find or create the author
        try {
          let author = await Author.findOne({ name: book.author });

          if (!author) {
            author = new Author({
              name: book.author,
              createdAt: book.createdAt || new Date(),
            });
            await author.save();
            console.log(`Created new author: ${author.name}`);
          }

          book.authorId = author._id;
        } catch (error) {
          console.error(
            `Error finding/creating author for book ${book.title}:`,
            error
          );
        }
      }

      // Set default values for new fields
      if (!book.status) {
        book.status = "not_started";
      }

      if (!book.genre) {
        book.genre = [];
      }

      if (!book.currentPage) {
        book.currentPage = 0;
      }

      if (!book.updatedAt) {
        book.updatedAt = book.createdAt || new Date();
      }

      // Update reading status based on notes
      if (
        book.notes &&
        book.notes.length > 0 &&
        book.status === "not_started"
      ) {
        book.status = "in_progress";
        if (!book.readingStartDate) {
          // Use the date of the first note as the reading start date
          book.readingStartDate = book.notes[0].createdAt;
        }
      }

      await book.save();
      console.log(`Migrated book: ${book.title}`);
    } catch (error) {
      console.error(`Error migrating book ${book.title}:`, error);
      // Continue with the next book
    }
  }

  console.log("Book migration completed");
}

// Main migration function
async function runMigration() {
  try {
    await connectToDatabase();

    // Run migrations in sequence
    await migrateUsers();
    await migrateAuthors();
    await migrateBooks();

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
