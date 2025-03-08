import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ctenarsky-denik";

// Check if we're using a mock connection
const isMockConnection = MONGODB_URI.includes("ctenarsky-denik-mock");

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */

// Define types for mongoose connection cache
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend NodeJS global interface
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Mock data for development
const mockData = {
  books: [
    {
      _id: new mongoose.Types.ObjectId("67cc3f7b980f51ed5989e187"),
      title: "Válka s mloky",
      author: "Karel Čapek",
      authorId: new mongoose.Types.ObjectId(),
      authorSummary:
        "Karel Čapek byl významný český spisovatel, novinář a překladatel. Narodil se v roce 1890 a zemřel v roce 1938.",
      createdAt: new Date(),
      userId: "mock-user-id",
      notes: [
        {
          _id: new mongoose.Types.ObjectId(),
          content: "Toto je ukázková poznámka ke knize.",
          createdAt: new Date(),
          isAISummary: false,
        },
      ],
    },
    {
      _id: new mongoose.Types.ObjectId("67cc3f7b980f51ed5989e18a"),
      title: "R.U.R.",
      author: "Karel Čapek",
      authorId: new mongoose.Types.ObjectId(),
      authorSummary: null,
      createdAt: new Date(),
      userId: "mock-user-id",
      notes: [],
    },
  ],
};

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  // If we're using a mock connection, return a mock connection
  if (isMockConnection) {
    console.log("Using mock MongoDB connection for development");

    // Create a mock connection
    if (!cached.promise) {
      cached.promise = Promise.resolve(mongoose);
    }

    cached.conn = await cached.promise;
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      connectTimeoutMS: 30000, // Increased timeout for initial connection
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 30000, // Increased timeout for server selection
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      retryReads: true,
    };

    console.log("Connecting to MongoDB...");
    console.log(
      "Connection string (partially masked):",
      MONGODB_URI.includes("mongodb://localhost")
        ? MONGODB_URI
        : MONGODB_URI.replace(
            /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
            "mongodb$1://[username]:[password]@"
          )
    );

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("MongoDB connected successfully");
        return mongoose;
      })
      .catch((error) => {
        console.error("MongoDB connection error:", error);

        // Check if this is an IP whitelist error
        if (
          error.message &&
          error.message.includes("IP that isn't whitelisted")
        ) {
          console.error(
            "\n\n======================================================="
          );
          console.error("MONGODB IP WHITELIST ERROR");
          console.error(
            "======================================================="
          );
          console.error(
            "Your current IP address is not whitelisted in MongoDB Atlas."
          );
          console.error("Please go to: https://cloud.mongodb.com");
          console.error(
            "Then navigate to: Security → Network Access → Add IP Address"
          );
          console.error(
            "Add your current IP address or use 0.0.0.0/0 for temporary access"
          );
          console.error(
            "=======================================================\n\n"
          );
        }

        // Check if this is a DNS resolution error
        if (
          error.message &&
          (error.message.includes("ENOTFOUND") ||
            error.message.includes("querySrv EREFUSED") ||
            error.message.includes("getaddrinfo"))
        ) {
          console.error(
            "\n\n======================================================="
          );
          console.error("MONGODB DNS RESOLUTION ERROR");
          console.error(
            "======================================================="
          );
          console.error("Unable to resolve the MongoDB Atlas hostname.");
          console.error("This could be due to:");
          console.error(
            "1. The MongoDB Atlas cluster has been deleted or renamed"
          );
          console.error("2. DNS resolution issues on your network");
          console.error("3. Network connectivity problems");
          console.error("");
          console.error(
            "Please follow the instructions in mongodb-atlas-setup-detailed.md"
          );
          console.error("to create a new MongoDB Atlas cluster.");
          console.error(
            "=======================================================\n\n"
          );
        }

        // Check if this is an authentication error
        if (error.message && error.message.includes("Authentication failed")) {
          console.error(
            "\n\n======================================================="
          );
          console.error("MONGODB AUTHENTICATION ERROR");
          console.error(
            "======================================================="
          );
          console.error(
            "Invalid username or password in your connection string."
          );
          console.error("Please check your MONGODB_URI in .env.local");
          console.error(
            "=======================================================\n\n"
          );
        }

        // Clear the promise so we can retry
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    // Reset the promise to allow for retry on next request
    cached.promise = null;
    throw error;
  }
}

// Export mock data for use in API routes
export { mockData, isMockConnection };
export default dbConnect;
