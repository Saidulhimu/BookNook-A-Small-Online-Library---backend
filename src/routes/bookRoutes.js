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

// POST /books - Private Route (add a book)
router.post('/', verifyJWT, async (req, res, next) => {
  try {
    const { title, author, category, image, description, totalCopies, userEmail, userName } = req.body;

    // Validation
    if (!title || !author || !category || !image || !description) {
      return res.status(400).json({
        success: false,
        message: 'All fields (title, author, category, image, description) are required',
      });
    }

    const parsedCopies = parseInt(totalCopies, 10);
    if (isNaN(parsedCopies) || parsedCopies < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total copies must be a non-negative number',
      });
    }

    const userEmailFromToken = req.user.email;
    const finalEmail = userEmail || userEmailFromToken;
    const finalName = userName || req.user.name || 'Anonymous User';

    const newBook = {
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      image: image.trim(),
      description: description.trim(),
      totalCopies: parsedCopies,
      userEmail: finalEmail,
      userName: finalName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = getDB();
    const booksCollection = db.collection('books');

    const result = await booksCollection.insertOne(newBook);

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      data: {
        _id: result.insertedId,
        ...newBook,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /books/:id - Private Route (update a book)
router.patch('/:id', verifyJWT, async (req, res, next) => {
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

    const existingBook = await booksCollection.findOne({ _id: new ObjectId(id) });
    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // Ownership check
    if (existingBook.userEmail && existingBook.userEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only update books you have added',
      });
    }

    const { title, author, category, image, description, totalCopies } = req.body;

    const updateDoc = {
      $set: {
        updatedAt: new Date(),
      },
    };

    if (title !== undefined) updateDoc.$set.title = title.trim();
    if (author !== undefined) updateDoc.$set.author = author.trim();
    if (category !== undefined) updateDoc.$set.category = category.trim();
    if (image !== undefined) updateDoc.$set.image = image.trim();
    if (description !== undefined) updateDoc.$set.description = description.trim();
    if (totalCopies !== undefined) {
      const parsed = parseInt(totalCopies, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        updateDoc.$set.totalCopies = parsed;
      }
    }

    const updateResult = await booksCollection.updateOne(
      { _id: new ObjectId(id) },
      updateDoc
    );

    const updatedBook = await booksCollection.findOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /books/:id - Private Route (delete a book)
router.delete('/:id', verifyJWT, async (req, res, next) => {
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
    const borrowsCollection = db.collection('borrows');

    const existingBook = await booksCollection.findOne({ _id: new ObjectId(id) });
    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // Ownership check
    if (existingBook.userEmail && existingBook.userEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete books you have added',
      });
    }

    await booksCollection.deleteOne({ _id: new ObjectId(id) });
    // Clean up any remaining borrows for this book
    await borrowsCollection.deleteMany({ bookId: id });

    res.json({
      success: true,
      message: 'Book deleted successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
