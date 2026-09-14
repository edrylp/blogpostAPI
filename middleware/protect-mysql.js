const jwt = require('jsonwebtoken');
const User = require('../models/User-mysql');

/**
 * Middleware to protect routes that require authentication.
 * Expects: Authorization: Bearer <token>
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1️⃣ Check Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // 3️⃣ Check if user still exists
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    // 4️⃣ OPTIONAL (but recommended): invalidate token if password changed
    if (decoded.iat) {
      if (User.changedPasswordAfter(user, decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: 'Password recently changed. Please log in again.',
        });
      }
    }

    // 5️⃣ Attach user to request
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid or expired token.',
    });
  }
};

module.exports = { protect };
