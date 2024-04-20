const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Used for hashing passwords
const jwt = require('jsonwebtoken'); // Used for generating tokens

// Mock user database
const users = [];

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create a new user
        const user = { username: req.body.username, password: hashedPassword };
        users.push(user);

        res.status(201).send('User registered');
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error: error });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    const user = users.find(u => u.username === req.body.username);
    if (user == null) {
        return res.status(400).send('Cannot find user');
    }
    try {
        if (await bcrypt.compare(req.body.password, user.password)) {
            // Generate a token
            const accessToken = jwt.sign({ username: user.username }, process.env.ACCESS_TOKEN_SECRET);
            res.json({ accessToken: accessToken });
        } else {
            res.send('Not Allowed');
        }
    } catch (error) {
        res.status(500).send();
    }
});

module.exports = router;
