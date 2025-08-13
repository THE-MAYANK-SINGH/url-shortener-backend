// models/Url.js
const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true },   // Long URL
    shortCode: { type: String, required: true, unique: true }, // Short code
    visits: { type: Number, default: 0 } // Number of visits
}, { timestamps: true });

module.exports = mongoose.model('Url', urlSchema);
