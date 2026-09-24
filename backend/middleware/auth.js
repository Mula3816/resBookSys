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

// Admin or merchant role middleware（管理后台入口；数据范围在各自路由内过滤）
const requireMerchantOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'merchant') {
    return res.status(403).json({ message: '需要管理员或商家权限' });
  }
  next();
};

// 查询某商家名下的餐厅 ID 列表（数据隔离用）
const getUserRestaurantIds = (userId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id FROM restaurants WHERE owner_id = ?',
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map((row) => row.id));
      }
    );
  });
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
  requireMerchantOrAdmin,
  getUserRestaurantIds,
  getUserFromDB
};
