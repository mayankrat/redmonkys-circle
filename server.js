// server.js (Simple Test Version)
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/apps/circle', (req, res) => {
    // Set the required Shopify header
    res.setHeader('Content-Type', 'application/liquid');
    // Send a very simple response
    res.send('<h1>Hello from my app! If you see this, the connection is working.</h1>');
});

app.listen(PORT, () => {
    console.log(`Simple test server listening on port ${PORT}`);
});