// Simple script to test MongoDB connection
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const uri = process.env.MONGODB_URI;
console.log(
  "Connection string (partially masked):",
  uri
    ? uri.replace(
        /mongodb:\/\/([^:]+):([^@]+)@/,
        "mongodb://[username]:[password]@"
      )
    : "MONGODB_URI not found"
);

async function testConnection() {
  if (!uri) {
    console.error("MONGODB_URI environment variable is not set");
    return false;
  }

  console.log("Attempting to connect to MongoDB...");

  const client = new MongoClient(uri, {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 10000,
    family: 4,
  });

  try {
    await client.connect();
    console.log("Successfully connected to MongoDB!");

    // List databases to verify connection
    const adminDb = client.db("admin");
    const result = await adminDb.command({ listDatabases: 1 });
    console.log("Available databases:");
    result.databases.forEach((db) => {
      console.log(`- ${db.name}`);
    });

    await client.close();
    console.log("Connection closed.");
    return true;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    return false;
  }
}

testConnection()
  .then((success) => {
    if (!success) {
      console.log("\nTroubleshooting tips:");
      console.log("1. Check if your MongoDB Atlas cluster is running");
      console.log("2. Verify your connection string is correct");
      console.log("3. Make sure your IP is whitelisted in MongoDB Atlas");
      console.log(
        "4. Check if your MongoDB Atlas user has the correct permissions"
      );
      console.log("5. Try using a different network connection");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });
