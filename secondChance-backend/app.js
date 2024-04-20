/*jshint esversion: 8 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pinoLogger = require('./logger');

const connectToDatabase = require('./models/db');
const { loadData } = require("./util/import-mongo/index");

const app = express();
app.use("*", cors());
const port = 3060;

// Connect to MongoDB; we just do this one time
connectToDatabase().then(() => {
    pinoLogger.info('Connected to DB');
}).catch((e) => console.error('Failed to connect to DB', e));

app.use(express.json());

// Route files
// Import routes
const authRoutes = require('./routes/authRoutes'); // Assuming this is correct based on other similar tasks
const secondChanceItemsRoutes = require('./routes/secondChanceItemsRoutes'); // Task 1
const searchRoutes = require('./routes/searchRoutes'); // Assuming this needs to be added as well

const pinoHttp = require('pino-http');
const logger = require('./logger');
app.use(pinoHttp({ logger }));

// Use Routes
app.use('/api/auth', authRoutes); // Assuming this needs to be added as well
app.use('/api/secondchance/items', secondChanceItemsRoutes); // Task 2
app.use('/api/search', searchRoutes); // Assuming this needs to be added as well

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
});

app.get("/", (req, res) => {
    res.send("Inside the server");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
