const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /jwt: Issue token upon user login
router.post('/jwt', (req, res) => {
  const { email, name, id } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required to generate JWT token',
    });
  }

  const token = jwt.sign(
    { email, name: name || '', id: id || '' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    message: 'Token issued successfully',
    token,
  });
});

// POST /logout: Clear token cookie
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  });

  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = router;
