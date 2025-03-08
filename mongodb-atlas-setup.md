# MongoDB Atlas Setup Guide

Follow these steps to create a new MongoDB Atlas cluster and fix your connection issues:

## 1. Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account or log in if you already have one

## 2. Create a New Cluster

1. Click "Build a Database"
2. Choose the "FREE" tier
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region close to your location
5. Click "Create Cluster" (this may take a few minutes)

## 3. Set Up Database Access

1. In the left sidebar, click "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter a username and password (save these for later)
5. Set privileges to "Read and write to any database"
6. Click "Add User"

## 4. Set Up Network Access

1. In the left sidebar, click "Network Access"
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (for development only)
4. Click "Confirm"

## 5. Get Your Connection String

1. Go back to your cluster by clicking "Database" in the left sidebar
2. Click "Connect"
3. Choose "Connect your application"
4. Select "Node.js" and the latest version
5. Copy the connection string

## 6. Update Your .env.local File

Replace your current MongoDB connection string with the new one:

```
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>?retryWrites=true&w=majority"
```

Make sure to replace:

- `<username>` with your database username
- `<password>` with your database password
- `<cluster-name>` with your cluster name
- `<database-name>` with "ctenarsky-denik"

## 7. Restart Your Application

After updating your connection string, restart your application:

```
npm run dev
```

This should resolve your MongoDB connection issues.
