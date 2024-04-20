const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/db');
const router = express.Router();
const dotenv = require('dotenv');
const pino = require('pino');  // Import Pino logger
dotenv.config();

const logger = pino();  // Create a Pino logger instance


const JWT_SECRET = process.env.JWT_SECRET; // Ensure this is set in your .env file

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
        const db = await connectToDatabase();

        // Task 2: Access MongoDB `users` collection
        const collection = db.collection("users");

        // Task 3: Check if user credentials already exist in the database and throw an error if they do
        const existingUser = await collection.findOne({ email: req.body.email });
        if (existingUser) {
            logger.error('Email id already exists');
            return res.status(400).json({ error: 'Email id already exists' });
        }

        // Task 4: Create a hash to encrypt the password so that it is not readable in the database
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(req.body.password, salt);

        // Task 5: Insert the user into the database
        const newUser = await collection.insertOne({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            createdAt: new Date(),
        });

        // Task 6: Create JWT authentication if passwords match with user._id as payload
        const payload = {
            user: {
                id: newUser.insertedId,
            },
        };
        const authtoken = jwt.sign(payload, JWT_SECRET);

        // Task 7: Log the successful registration using the logger
        logger.info('User registered successfully');

        // Task 8: Return the user email and the token as a JSON
        res.status(201).json({ authtoken, email: req.body.email });
    } catch (e) {
        logger.error(e);
        return res.status(500).send('Internal server error');
    }
});





// Login endpoint
router.post('/login', async (req, res) => {
    try {
        // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
        const db = await connectToDatabase();

        // Task 2: Access MongoDB `users` collection
        const collection = db.collection("users");

        // Task 3: Check for user credentials in the database
        const theUser = await collection.findOne({ email: req.body.email });
        if (!theUser) {
            logger.error('User not found');
            return res.status(404).json({ error: 'User not found' });
        }

        // Task 4: Check if the password matches the encrypted password
        const isMatch = await bcrypt.compare(req.body.password, theUser.password);
        if (!isMatch) {
            logger.error('Passwords do not match');
            return res.status(400).json({ error: 'Wrong password' });
        }

        // Task 5: Fetch user details from the database
        const userName = theUser.firstName;
        const userEmail = theUser.email;

        // Task 6: Create JWT authentication if passwords match with user._id as payload
        const payload = {
            user: {
                id: theUser._id.toString(), // Ensure the payload uses the user's _id from MongoDB
            },
        };
        const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }); // Optionally set an expiration

        // Task 7: Log the successful login
        logger.info('User logged in successfully');

        // Return the user email and the token as a JSON
        res.json({ authtoken, userName, userEmail });

    } catch (e) {
        logger.error(`Login error: ${e}`);
        return res.status(500).send('Internal server error');
    }
});


module.exports = router;
