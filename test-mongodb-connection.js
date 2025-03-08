// Simple script to test MongoDB Atlas connection
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, ".env.local") });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error(
    "Error: MONGODB_URI environment variable is not set in .env.local"
  );
  process.exit(1);
}

// Mask the password in the connection string for logging
const maskedUri = uri.replace(
  /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
  "mongodb$1://[username]:[password]@"
);
console.log("Testing connection to MongoDB Atlas with connection string:");
console.log(maskedUri);

async function testConnection() {
  const client = new MongoClient(uri, {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 10000,
  });

  try {
    console.log("Connecting to MongoDB Atlas...");
    await client.connect();
    console.log("✅ Successfully connected to MongoDB Atlas!");

    // Get database name from connection string or use default
    const dbName =
      (uri.includes("/") && uri.split("/")[3].split("?")[0]) ||
      "ctenarsky-denik";
    console.log(`Using database: ${dbName}`);

    // List collections in the database
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();

    if (collections.length === 0) {
      console.log("Database is empty (no collections found).");
      console.log("This is normal for a new database.");
    } else {
      console.log("Collections in the database:");
      collections.forEach((collection) => {
        console.log(`- ${collection.name}`);
      });
    }

    // Create a test document
    console.log("\nCreating a test document...");
    const testCollection = db.collection("connection_test");
    const result = await testCollection.insertOne({
      test: true,
      message: "MongoDB Atlas connection test",
      timestamp: new Date(),
    });

    console.log(`✅ Test document created with ID: ${result.insertedId}`);
    console.log("✅ Your MongoDB Atlas connection is working correctly!");

    // Clean up the test document
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log("Test document cleaned up.");

    await client.close();
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB Atlas:", error);

    if (error.message && error.message.includes("authentication failed")) {
      console.log(
        "\n🔑 Authentication Error: Your username or password is incorrect."
      );
      console.log("Please check your connection string in .env.local");
    }

    if (error.message && error.message.includes("ENOTFOUND")) {
      console.log(
        "\n🔍 DNS Error: Could not resolve the MongoDB Atlas hostname."
      );
      console.log("Please check your connection string in .env.local");
      console.log("Make sure your cluster name is correct.");
    }

    if (error.message && error.message.includes("timed out")) {
      console.log("\n⏱️ Timeout Error: Connection to MongoDB Atlas timed out.");
      console.log(
        "This could be due to network issues or firewall restrictions."
      );
    }

    console.log("\n📋 Next steps:");
    console.log(
      "1. Follow the instructions in mongodb-atlas-setup-detailed.md"
    );
    console.log(
      "2. Update your .env.local file with the correct connection string"
    );
    console.log("3. Run this test script again");

    await client.close();
    return false;
  }
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });
