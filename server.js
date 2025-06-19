const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://qrfarmtracking.netlify.app/']
}));
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Test route
app.get('/ping', (req, res) => {
  res.json({ message: 'pong', status: 'success' });
});

// Import routes
const batchesRouter = require('./routes/batches');
const productsRouter = require('./routes/products');
const recipesRouter = require('./routes/recipes');

// Use routes
app.use('/api/batches', batchesRouter);
app.use('/api/products', productsRouter);
app.use('/api/recipes', recipesRouter); 

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});