const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { verifyJWT } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /borrows - Private Route (borrow a book with copies decrement & double-borrow check)
router.post('/', verifyJWT, async (req, res, next) => {
  try {
    const { bookId, returnDate } = req.body;
    const userEmail = req.user.email;

    if (!bookId || !ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Book ID is required to borrow a book',
      });
    }

    const parsedReturn = returnDate ? new Date(returnDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    // Allow "today" (a date picker sends midnight), reject anything clearly in the past.
    if (isNaN(parsedReturn.getTime()) || parsedReturn.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'Return date must be a valid date that is not in the past',
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

    // 2. Challenge 2: friendly check first - a user cannot hold the same book twice
    //    (the unique index below is the race-proof guard)
    const activeBorrow = await borrowsCollection.findOne({ bookId: book._id.toString(), userEmail });
    if (activeBorrow) {
      return res.status(400).json({
        success: false,
        message: 'You have already borrowed this book! Please return it before borrowing again.',
      });
    }

    // Challenge 1: Check available copies
    if (!book.totalCopies || book.totalCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Sorry, this book is currently out of stock (Not Available).',
      });
    }

    // 3. Take a copy atomically (fails if copies hit 0 in the meantime)
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

    // Save borrow record
    const borrowDoc = {
      bookId: book._id.toString(),
      bookTitle: book.title,
      bookImage: book.image,
      bookAuthor: book.author,
      category: book.category,
      userEmail: userEmail,
      userName: req.user.name || 'Library Member',
      borrowDate: new Date(),
      returnDate: parsedReturn,
      createdAt: new Date(),
    };

    // 4. No double borrow: the unique (bookId, userEmail) index rejects a second active borrow.
    let result;
    try {
      result = await borrowsCollection.insertOne(borrowDoc);
    } catch (err) {
      // Give the copy back since this borrow did not happen.
      await booksCollection.updateOne({ _id: book._id }, { $inc: { totalCopies: 1 } });
      if (err.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'You have already borrowed this book! Please return it before borrowing again.',
        });
      }
      throw err;
    }

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

// GET /borrows - Private Route (get borrows of logged in user)
router.get('/', verifyJWT, async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const db = getDB();
    const borrowsCollection = db.collection('borrows');

    const userBorrows = await borrowsCollection
      .find({ userEmail })
      .sort({ borrowDate: -1 })
      .toArray();

    res.json({
      success: true,
      count: userBorrows.length,
      data: userBorrows,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /borrows/:id - Private Route (return a book and increment available copies)
router.delete('/:id', verifyJWT, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Borrow ID format',
      });
    }

    const db = getDB();
    const booksCollection = db.collection('books');
    const borrowsCollection = db.collection('borrows');

    // Find the borrow record belonging to this user
    const borrowRecord = await borrowsCollection.findOne({
      _id: new ObjectId(id),
      userEmail,
    });

    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found or does not belong to you',
      });
    }

    // Increment copies back by 1 in books collection
    if (borrowRecord.bookId && ObjectId.isValid(borrowRecord.bookId)) {
      await booksCollection.updateOne(
        { _id: new ObjectId(borrowRecord.bookId) },
        { $inc: { totalCopies: 1 } }
      );
    }

    // Delete borrow record
    await borrowsCollection.deleteOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: `Successfully returned "${borrowRecord.bookTitle}". Thank you!`,
      data: {
        id,
        bookId: borrowRecord.bookId,
        bookTitle: borrowRecord.bookTitle,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
