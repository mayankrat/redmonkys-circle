// server.js (Final Version for Shopify Proxy)
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'build')));

// This function sends our app with the correct LIQUID label for Shopify.
const sendApp = (req, res) => {
    res.setHeader('Content-Type', 'application/liquid'); // This is the corrected line
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
};

// This handles the base case: /apps/circle
app.get('/apps/circle', sendApp);

// This handles all other cases like /apps/circle/feed
app.get('/apps/circle/*', sendApp);

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`Shopify App Proxy server listening on port ${PORT}`);
});