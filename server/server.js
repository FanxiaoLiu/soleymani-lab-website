const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// This will serve the React build files (once we build them)
app.use(express.static(path.join(__dirname, '../client/dist')));

// API Test Route
app.get('/api/test', (req, res) => {
  res.json({ message: "Soleymani Lab Server is running!" });
});

// Handle React Routing (Redirect all other requests to React)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});