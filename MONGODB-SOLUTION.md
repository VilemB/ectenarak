# MongoDB Connection Solution

We've identified that your application is having trouble connecting to MongoDB. Here are the solutions:

## The Problem

Your application is encountering one of these errors:

1. `querySrv EREFUSED _mongodb._tcp.ctenarsky-denik-cluster.9ckyq.mongodb.net` - DNS resolution issue
2. `connect ECONNREFUSED 127.0.0.1:27017` - No local MongoDB server running

## Solution 1: Create a New MongoDB Atlas Cluster (Recommended)

The original MongoDB Atlas cluster appears to be unavailable or deleted. The best solution is to create a new one:

1. Follow the detailed instructions in [mongodb-atlas-setup-detailed.md](mongodb-atlas-setup-detailed.md)
2. Update your `.env.local` file with your new connection string
3. Restart your application

This is the recommended solution because:

- Your data will be stored in the cloud
- You can access your database from anywhere
- MongoDB Atlas provides backups and security features

## Solution 2: Set Up a Local MongoDB Instance

If you prefer to develop locally:

1. Follow the instructions in [local-mongodb-setup.md](local-mongodb-setup.md)
2. Update your `.env.local` file to use `mongodb://localhost:27017/ctenarsky-denik`
3. Restart your application

This solution is good for development but has limitations for production use.

## Testing Your Connection

After implementing either solution, test your connection:

```bash
node test-mongodb-connection.js
```

This script will:

- Connect to your MongoDB database
- Create a test document
- Verify that everything is working correctly

## Next Steps

Once your MongoDB connection is working:

1. Your application should run without database errors
2. You can start adding books and notes
3. All data will be properly stored in your database

If you continue to experience issues, please check:

- Network connectivity
- Firewall settings
- DNS configuration
- MongoDB Atlas account status

## Need More Help?

If you're still having trouble, consider:

1. Checking the MongoDB Atlas status page
2. Reviewing the MongoDB connection documentation
3. Contacting MongoDB Atlas support
