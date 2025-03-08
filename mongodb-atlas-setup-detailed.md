# Detailed MongoDB Atlas Setup Guide

This guide will walk you through setting up a new MongoDB Atlas cluster for your Čtenářský deník application.

## Step 1: Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account or log in if you already have one

## Step 2: Create a New Cluster

1. After logging in, click "Build a Database"
2. Choose the "FREE" tier (M0)
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region close to your location
5. Scroll down and name your cluster (e.g., "ctenarsky-denik-cluster")
6. Click "Create Cluster" (this may take a few minutes)

## Step 3: Set Up Database Access

1. While your cluster is being created, click "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter a username (e.g., "ctenarsky-denik-user")
5. Enter a secure password (e.g., "YourSecurePassword123") - make sure to save this!
6. Set privileges to "Read and write to any database"
7. Click "Add User"

## Step 4: Set Up Network Access

1. Click "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (select 0.0.0.0/0)
4. Click "Confirm"

## Step 5: Get Your Connection String

1. Go back to your cluster by clicking "Database" in the left sidebar
2. Wait for your cluster to finish deploying (if it's still in progress)
3. Click "Connect"
4. Choose "Connect your application"
5. Select "Node.js" and the latest version
6. Copy the connection string that looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Update Your .env.local File

1. Open your `.env.local` file
2. Replace the current MongoDB connection string with your new one:
   ```
   MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/ctenarsky-denik?retryWrites=true&w=majority"
   ```
3. Make sure to:
   - Replace `<username>` with the database username you created
   - Replace `<password>` with the database password you created
   - Replace `<cluster-name>` with your cluster name
   - Add `/ctenarsky-denik` after `.mongodb.net` to specify the database name

## Step 7: Restart Your Application

After updating your connection string, restart your application:

```
npm run dev
```

## Troubleshooting

If you still encounter connection issues:

1. **Check your username and password**: Make sure they are correctly entered in the connection string
2. **Verify network access**: Ensure you've allowed access from anywhere (0.0.0.0/0)
3. **Check cluster status**: Make sure your cluster is fully deployed and running
4. **Test the connection**: Use the MongoDB Compass tool to test your connection string

## Next Steps

Once your application is connected to MongoDB Atlas:

1. Your data will be stored in the cloud
2. You can access your database from anywhere
3. You can scale your database as your application grows
