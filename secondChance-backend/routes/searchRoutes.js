const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');

// Search for gifts
router.get('/', async (req, res, next) => {
    try {
        // Task 1: Connect to MongoDB using connectToDatabase database
        const db = await connectToDatabase(); // Use await keyword and store the connection in `db`

        const collection = db.collection("gifts");

        // Initialize the query object
        let query = {};

        // Add the name filter to the query if the name parameter is not empty
        if (req.query.name) { // Check if name parameter exists and is not empty
            query.name = { $regex: req.query.name, $options: "i" }; // Using regex for partial match, case-insensitive
        }

        // Task 3: Add other filters to the query
        if (req.query.category) {
            query.category = req.query.category; // Directly match the category
        }
        if (req.query.condition) {
            query.condition = req.query.condition; // Directly match the condition
        }
        if (req.query.age_years) {
            query.age_years = { $lte: parseInt(req.query.age_years) }; // Match items with age_years less than or equal to the provided value
        }

        // Task 4: Fetch filtered gifts using the find(query) method
        const gifts = await collection.find(query).toArray(); // Use await to fetch results and convert them to an array

        res.json(gifts);
    } catch (e) {
        next(e);
    }
});

module.exports = router;
