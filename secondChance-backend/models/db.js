// db.js
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient

// MongoDB connection URL with authentication options
const url = `${process.env.MONGO_URL}`

let dbInstance = null
const dbName = `${process.env.MONGO_DB}`

async function connectToDatabase () {
  if (dbInstance) {
    return dbInstance
  };

  const client = new MongoClient(url)

  // Task 1: Connect to MongoDB
  await client.connect() // Establishes a connection to the MongoDB server

  // Task 2: Connect to database giftDB and store in variable dbInstance
  dbInstance = client.db(dbName) // Gets the database instance from the client

  // Task 3: Return database instance
  return dbInstance // Returns the database instance for use in the application
}

module.exports = connectToDatabase
