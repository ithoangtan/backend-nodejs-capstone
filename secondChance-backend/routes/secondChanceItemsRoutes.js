const express = require('express')
const multer = require('multer')
const router = express.Router()
const connectToDatabase = require('../models/db')
const logger = require('../logger')

// Define the upload directory path
const directoryPath = 'public/images'

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath) // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // Use the original file name
  }
})

const upload = multer({ storage })

// Get all secondChanceItems
router.get('/', async (req, res, next) => {
  logger.info('/ called')
  try {
    // Task 1: Retrieve the database connection from db.js and store the connection to db constant
    const db = await connectToDatabase()

    // Task 2: Use the collection() method to retrieve the secondChanceItems collection
    const collection = db.collection('secondChanceItems')

    // Task 3: Fetch all secondChanceItems using the collection.find() method. Chain it with the toArray() method to convert to a JSON array
    const secondChanceItems = await collection.find({}).toArray()

    // Task 4: Return the secondChanceItems using the res.json() method
    res.json(secondChanceItems)
  } catch (e) {
    logger.error('oops something went wrong', e)
    next(e) // Pass the error to the next middleware (usually error handler)
  }
})

// Add a new item
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    // Step 3: task 1 - Connect to MongoDB
    const db = await connectToDatabase()

    // Step 3: task 2 - Use the collection() method
    const collection = db.collection('secondChanceItems')

    // Step 3: task 3 - Create a new secondChanceItem from the request body
    let secondChanceItem = req.body

    // Step 3: task 4 - Get the last id, increment it by 1, and set it to the new secondChanceItem
    const lastItemQuery = await collection.find().sort({ id: -1 }).limit(1)
    await lastItemQuery.forEach(item => {
      secondChanceItem.id = (parseInt(item.id) + 1).toString()
    })

    // Step 3: task 5 - Set the current date to the new item
    const dateAdded = Math.floor(new Date().getTime() / 1000)
    secondChanceItem.date_added = dateAdded

    // Step 3: task 6 - Add the secondChanceItem to the database
    secondChanceItem = await collection.insertOne(secondChanceItem)

    // Send back the inserted item as the response
    res.status(201).json(secondChanceItem)
  } catch (e) {
    next(e)
  }
})

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
  try {
    // Step 4: task 1 - Retrieve the database connection from db.js
    const db = await connectToDatabase()

    // Step 4: task 2 - Use the collection() method
    const collection = db.collection('secondChanceItems')

    // Step 4: task 3 - Find a specific secondChanceItem by its ID
    const id = req.params.id // or convert to the required type if needed, e.g., MongoDB ObjectId if using default _id
    const secondChanceItem = await collection.findOne({ id })

    // Step 4: task 4 - Return the secondChanceItem as a JSON object
    if (secondChanceItem) {
      res.json(secondChanceItem)
    } else {
      res.status(404).json({ message: 'Item not found' })
    }
  } catch (e) {
    next(e)
  }
})

// Update and existing item
router.put('/:id', async (req, res, next) => {
  try {
    // Task 1: Retrieve the database connection from db.js and store the connection to a db constant
    const db = await connectToDatabase()

    // Task 2: Use the collection() method to retrieve the secondChanceItems collection
    const collection = db.collection('secondChanceItems')

    // Task 3: Check if the secondChanceItem exists and send an appropriate message if it doesn't exist
    const id = req.params.id
    const secondChanceItem = await collection.findOne({ id })
    if (!secondChanceItem) {
      logger.error('secondChanceItem not found')
      return res.status(404).json({ error: 'secondChanceItem not found' })
    }

    // Dynamically construct the update object based on provided request body fields
    const updatedAttributes = {}
    const fieldsToUpdate = ['name', 'category', 'condition', 'posted_by', 'zipcode', 'date_added', 'age_days', 'age_years', 'description', 'image', 'comments']

    fieldsToUpdate.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updatedAttributes[field] = req.body[field]
      }
    })

    // Special handling for age_days to calculate age_years
    if ('age_days' in updatedAttributes) {
      updatedAttributes.age_years = Number((updatedAttributes.age_days / 365).toFixed(1))
    }

    // Always update the 'updatedAt' field
    updatedAttributes.updatedAt = new Date()

    const updateResult = await collection.findOneAndUpdate(
      { id },
      { $set: updatedAttributes },
      { returnDocument: 'after' }
    )

    if (updateResult.id) {
      res.json({ uploaded: 'success', item: updateResult })
    } else {
      res.json({ uploaded: 'failed' })
    }
  } catch (e) {
    next(e)
  }
})

// Delete an existing item
router.delete('/:id', async (req, res, next) => {
  try {
    // Step 6: task 1 - Retrieve the database connection from db.js
    const db = await connectToDatabase()

    // Step 6: task 2 - Use the collection() method
    const collection = db.collection('secondChanceItems')

    // Step 6: task 3 - Find a specific secondChanceItem by ID
    const id = req.params.id // Assuming id is a string; adjust if using ObjectId
    const secondChanceItem = await collection.findOne({ id })
    if (!secondChanceItem) {
      return res.status(404).json({ error: 'secondChanceItem not found' })
    }

    // Step 6: task 4 - Delete the object and send an appropriate message
    await collection.deleteOne({ id })
    res.json({ deleted: 'success' })
  } catch (e) {
    next(e)
  }
})

module.exports = router
