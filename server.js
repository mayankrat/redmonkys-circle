// server.js
const express = require('express');
const path = require('path');
const app = express();

// The port the server will run on. Use the environment's port or 3000 as a default.
const PORT = process.env.PORT || 3000;

// --- IMPORTANT ---
// This tells Express to serve the static files (like JS, CSS, images)
// from the 'build' directory, which is where the compiled React app lives.
app.use(express.static(path.join(__dirname, 'build')));

// --- App Proxy Route ---
// Shopify will send all requests starting with `/apps/circle` (or your proxy path) here.
// The `*` is a wildcard to catch all sub-paths like `/apps/circle/feed` or `/apps/circle/question/123`.
app.get('/apps/circle/*', (req, res) => {
    // Set the Content-Type to application/liquid as required by Shopify.
    res.setHeader('Content-Type', 'application/liquid');

    // Send the main index.html file from your React app's build folder.
    // This file contains the `<div id="root"></div>` and the script tags
    // to load the React application. Shopify will render this Liquid response.
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// A simple health check route.
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Start the server.
app.listen(PORT, () => {
    console.log(`Shopify App Proxy server listening on port ${PORT}`);
});