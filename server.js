require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');
const cors = require('cors');
const path = require('path');
const Url = require('./models/Url');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Serve React frontend
app.use(express.static(path.join(__dirname, 'frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error("❌ MONGO_URI not found in .env");
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

// BASE_URL for short links
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// API Routes
app.post('/api/shorten', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
        const shortCode = shortid.generate();
        const newUrl = await Url.create({ originalUrl: url, shortCode });
        res.json({ shortUrl: `${BASE_URL}/${shortCode}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.get('/', (req, res) => {
    res.send('URL Shortener Backend is running!');
});

app.get('/:shortcode', async (req, res) => {
    try {
        const urlDoc = await Url.findOne({ shortCode: req.params.shortcode });
        if (!urlDoc) return res.status(404).send('Not found');

        urlDoc.visits += 1;
        await urlDoc.save();

        res.redirect(urlDoc.originalUrl);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Admin Route: List all URLs
app.get('/api/admin', async (req, res) => {
    try {
        const allUrls = await Url.find().sort({ createdAt: -1 });
        res.json(allUrls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
