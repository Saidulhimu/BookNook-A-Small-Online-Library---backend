const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { verifyJWT } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /books - Public Route (all books, new arrivals, search/filter)
router.get('/', async (req, res, next) => {
  try {
    const db = getDB();
    const booksCollection = db.collection('books');

    const { sort, limit, category, search, userEmail } = req.query;

    const query = {};

    // Filter by category if provided
    if (category && category !== 'All') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    // Search by title or author
    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { author: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Filter by user email if requested
    if (userEmail) {
      query.userEmail = userEmail;
    }

    let cursor = booksCollection.find(query);

    // Sort by newest if requested or default to createdAt desc
    if (sort === 'newest') {
      cursor = cursor.sort({ createdAt: -1 });
    } else {
      cursor = cursor.sort({ createdAt: -1 });
    }

    // Apply limit if specified (e.g. limit=6 for New Arrivals on Home)
    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        cursor = cursor.limit(parsedLimit);
      }
    }

    const books = await cursor.toArray();

    res.json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    next(error);
  }
});

// GET /books/:id - Public/Read Route (single book details)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Book ID format',
      });
    }

    const db = getDB();
    const booksCollection = db.collection('books');

    const book = await booksCollection.findOne({ _id: new ObjectId(id) });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    res.json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
