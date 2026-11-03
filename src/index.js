const express = require('express');
const cors = require('cors');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set in .env');
  process.exit(1);
}

const { connectDB } = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Root Health Check Route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '📚 BookNook - A Small Online Library API is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// Books API Routes
app.use('/books', bookRoutes);

// Borrows API Routes
app.use('/borrows', borrowRoutes);

// Centralized Error Handler
app.use(errorHandler);

// Start Server and Connect Database
async function startServer() {
  try {
    const db = await connectDB();
    // One active borrow per user per book, enforced by the database (no race conditions).
    await db.collection('borrows').createIndex({ bookId: 1, userEmail: 1 }, { unique: true });
  } catch (error) {
    console.warn('⚠️ Warning: Initial MongoDB connection failed:', error.message);
    console.warn('👉 Please update MONGODB_URI in your .env file with your valid cluster connection string.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 BookNook Server listening on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
