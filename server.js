require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');
const cors = require('cors');
const Url = require('./models/Url');

const app = express();
app.use(express.json());
app.use(cors());

const path = require('path');
app.use(express.static(path.join(__dirname, 'frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Shorten URL
app.post('/api/shorten', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const shortCode = shortid.generate();
    const newUrl = await Url.create({ originalUrl: url, shortCode }); // ✅ matches schema
    res.json({ shortUrl: `${process.env.BASE_URL}/${shortCode}` });
});

app.get('/', (req, res) => {
  res.send('URL Shortener Backend is running!');
});

// Redirect to original URL
app.get('/:shortcode', async (req, res) => {
    try {
        const urlDoc = await Url.findOne({ shortCode: req.params.shortcode });
        if (!urlDoc) return res.status(404).send('Not found');

        // Increment visit count
        urlDoc.visits += 1;
        await urlDoc.save();

        res.redirect(urlDoc.originalUrl);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Admin Route (Bonus) - Lists all URLs with visits count
app.get('/api/admin', async (req, res) => {
    try {
        const allUrls = await Url.find().sort({ createdAt: -1 });
        res.json(allUrls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Start server on fixed port 5001
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
