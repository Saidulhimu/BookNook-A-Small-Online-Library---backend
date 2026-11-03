const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { verifyJWT } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /borrows - Private Route (borrow a book with copies decrement & double-borrow check)
router.post('/', verifyJWT, async (req, res, next) => {
  try {
    const { bookId, returnDate, userName } = req.body;
    const userEmail = req.user.email;

    if (!bookId || !ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Book ID is required to borrow a book',
      });
    }

    const db = getDB();
    const booksCollection = db.collection('books');
    const borrowsCollection = db.collection('borrows');

    // 1. Check if book exists
    const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found in the library catalog',
      });
    }

    // 2. Challenge 1: Check available copies
    if (!book.totalCopies || book.totalCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Sorry, this book is currently out of stock (Not Available).',
      });
    }

    // 3. Challenge 2: No Double Borrow (User cannot borrow the same book twice simultaneously)
    const activeBorrow = await borrowsCollection.findOne({
      bookId: book._id.toString(),
      userEmail: userEmail,
    });

    if (activeBorrow) {
      return res.status(400).json({
        success: false,
        message: 'You have already borrowed this book! Please return it before borrowing again.',
      });
    }

    // 4. Decrement available copies by 1 with $inc
    const updateResult = await booksCollection.updateOne(
      { _id: new ObjectId(bookId), totalCopies: { $gt: 0 } },
      { $inc: { totalCopies: -1 } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not borrow book: copies are no longer available.',
      });
    }

    // 5. Save borrow record
    const borrowDoc = {
      bookId: book._id.toString(),
      bookTitle: book.title,
      bookImage: book.image,
      bookAuthor: book.author,
      category: book.category,
      userEmail: userEmail,
      userName: userName || req.user.name || 'Library Member',
      borrowDate: new Date(),
      returnDate: returnDate ? new Date(returnDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // default 7 days from now
      createdAt: new Date(),
    };

    const result = await borrowsCollection.insertOne(borrowDoc);

    res.status(201).json({
      success: true,
      message: `You have successfully borrowed "${book.title}"!`,
      data: {
        _id: result.insertedId,
        ...borrowDoc,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
