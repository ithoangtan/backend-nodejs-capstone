const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const connectToDatabase = require('../models/db')
const router = express.Router()
const dotenv = require('dotenv')
const pino = require('pino') // Import Pino logger
dotenv.config()
const { body, validationResult } = require('express-validator')

const logger = pino() // Create a Pino logger instance

const JWT_SECRET = process.env.JWT_SECRET // Ensure this is set in your .env file

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
    const db = await connectToDatabase()

    // Task 2: Access MongoDB `users` collection
    const collection = db.collection('users')

    // Task 3: Check if user credentials already exist in the database and throw an error if they do
    const existingUser = await collection.findOne({ email: req.body.email })
    if (existingUser) {
      logger.error('Email id already exists')
      return res.status(400).json({ error: 'Email id already exists' })
    }

    // Task 4: Create a hash to encrypt the password so that it is not readable in the database
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(req.body.password, salt)

    // Task 5: Insert the user into the database
    const newUser = await collection.insertOne({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: hash,
      createdAt: new Date()
    })

    // Task 6: Create JWT authentication if passwords match with user._id as payload
    const payload = {
      user: {
        id: newUser.insertedId
      }
    }
    const authtoken = jwt.sign(payload, JWT_SECRET)

    // Task 7: Log the successful registration using the logger
    logger.info('User registered successfully')

    // Task 8: Return the user email and the token as a JSON
    res.status(201).json({ authtoken, email: req.body.email })
  } catch (e) {
    logger.error(e)
    return res.status(500).send('Internal server error')
  }
})

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
    const db = await connectToDatabase()

    // Task 2: Access MongoDB `users` collection
    const collection = db.collection('users')

    // Task 3: Check for user credentials in the database
    const theUser = await collection.findOne({ email: req.body.email })
    if (!theUser) {
      logger.error('User not found')
      return res.status(404).json({ error: 'User not found' })
    }

    // Task 4: Check if the password matches the encrypted password
    const isMatch = await bcrypt.compare(req.body.password, theUser.password)
    if (!isMatch) {
      logger.error('Passwords do not match')
      return res.status(400).json({ error: 'Wrong password' })
    }

    // Task 5: Fetch user details from the database
    const userName = theUser.firstName
    const userEmail = theUser.email

    // Task 6: Create JWT authentication if passwords match with user._id as payload
    const payload = {
      user: {
        id: theUser._id.toString() // Ensure the payload uses the user's _id from MongoDB
      }
    }
    const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }) // Optionally set an expiration

    // Task 7: Log the successful login
    logger.info('User logged in successfully')

    // Return the user email and the token as a JSON
    res.json({ authtoken, userName, userEmail })
  } catch (e) {
    logger.error(`Login error: ${e}`)
    return res.status(500).send('Internal server error')
  }
})

router.put('/update', [
  body('firstName').optional().isLength({ min: 2 }), // Validates first name if provided
  body('lastName').optional().isLength({ min: 2 }) // Validates last name if provided
], async (req, res) => {
  // Task 2: Validate the input using `validationResult` and return an appropriate message if you detect an error
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    logger.error('Validation errors in update request', errors.array())
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    // Task 3: Check if `email` is present in the header and throw an appropriate error message if not present
    const email = req.headers.email
    if (!email) {
      logger.error('Email not found in the request headers')
      return res.status(400).json({ error: 'Email not found in the request headers' })
    }

    // Task 4: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js` and access the users collection
    const db = await connectToDatabase()
    const collection = db.collection('users')

    // Task 5: Find the user credentials in the database
    const existingUser = await collection.findOne({ email })
    if (!existingUser) {
      logger.error('User not found')
      return res.status(404).json({ error: 'User not found' })
    }

    const updateData = {}
    if (req.body.firstName) updateData.firstName = req.body.firstName
    if (req.body.lastName) updateData.lastName = req.body.lastName
    if (req.body.password) {
      // Task 4: Check if the password matches the encrypted password and update if provided
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(req.body.password, salt)
    }
    updateData.updatedAt = new Date() // Always update the 'updatedAt' field

    // Task 6: Update the user credentials in the database
    const updatedUser = await collection.findOneAndUpdate(
      { email },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!updatedUser) {
      return res.status(404).json({ error: 'Failed to update user' })
    }

    // Task 7: Create JWT authentication with `user._id` as a payload using the secret key from the .env file
    const payload = {
      user: {
        id: updatedUser._id.toString()
      }
    }
    const authtoken = jwt.sign(payload, JWT_SECRET)

    // Send the updated user details and JWT token
    res.json({
      authtoken,
      userName: updatedUser.firstName,
      userEmail: updatedUser.email
    })
    logger.info('User updated successfully') // Log successful registration
  } catch (e) {
    logger.error(`Update error: ${e}`)
    return res.status(500).send('Internal server error')
  }
})

module.exports = router
