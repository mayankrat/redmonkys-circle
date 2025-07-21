// server.js (Corrected Version)
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'build')));

// --- THIS IS THE NEW LINE I ADDED ---
// This handles the base case: /apps/circle
app.get('/apps/circle', (req, res) => {
    res.setHeader('Content-Type', 'application/liquid');
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// This handles all other cases like /apps/circle/feed
app.get('/apps/circle/*', (req, res) => {
    res.setHeader('Content-Type', 'application/liquid');
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`Shopify App Proxy server listening on port ${PORT}`);
});