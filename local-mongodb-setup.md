# Setting Up Local MongoDB

If you're having trouble connecting to MongoDB Atlas, you can set up a local MongoDB instance for development. Here's how:

## Option 1: Install MongoDB Community Edition

### Windows

1. Download the MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the installation wizard
3. Choose "Complete" installation
4. Check the box to install MongoDB Compass (a GUI for MongoDB)
5. Complete the installation

### Start MongoDB Service

1. Open Command Prompt as Administrator
2. Create a data directory:
   ```
   mkdir C:\data\db
   ```
3. Start MongoDB:
   ```
   "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath="C:\data\db"
   ```
   (Adjust the path if your MongoDB version is different)

## Option 2: Use MongoDB with Docker

If you have Docker installed, this is the easiest way to run MongoDB locally:

1. Open Command Prompt or PowerShell
2. Run:
   ```
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```
3. MongoDB will be available at `mongodb://localhost:27017`

## Update Your .env.local File

After setting up local MongoDB, update your `.env.local` file:

```
MONGODB_URI="mongodb://localhost:27017/ctenarsky-denik"
```

## Testing the Connection

1. Start your local MongoDB server
2. Run the test script:
   ```
   node test-mongodb-connection.js
   ```
3. If successful, you should see a message confirming the connection

## Using MongoDB Compass

MongoDB Compass is a GUI tool that makes it easier to work with MongoDB:

1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. You can now browse and manage your databases visually

## Limitations of Local MongoDB

Using a local MongoDB instance has some limitations:

1. Data is only stored on your local machine
2. You can't access the database from other devices
3. You need to back up your data manually

For production use, it's recommended to use MongoDB Atlas once you've resolved the connection issues.
