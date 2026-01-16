const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON (useful if you add a contact form later)
app.use(express.json());

// Serve Static Assets from the React build folder
app.use(express.static(path.join(__dirname, '../client/dist')));

// API Endpoint Example (Dynamic Feature)
app.get('/api/status', (req, res) => {
  res.json({ message: "Soleymani Lab System Online" });
});

// Handle React Routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});