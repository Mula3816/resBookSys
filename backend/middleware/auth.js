const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '需要提供身份验证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
};

// Admin role middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
};

// Get user from database
const getUserFromDB = (userId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, name, email, role, phone, avatar FROM users WHERE id = ?',
      [userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

module.exports = {
  authenticateToken,
  requireAdmin,
  getUserFromDB
};
