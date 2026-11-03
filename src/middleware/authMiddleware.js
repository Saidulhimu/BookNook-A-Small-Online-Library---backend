const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'booknook_super_secret_jwt_key_2026';

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access: Token not provided',
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden access: Invalid or expired token',
      });
    }
    req.user = decoded;
    next();
  });
}

module.exports = {
  verifyJWT,
  JWT_SECRET,
};

