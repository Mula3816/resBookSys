const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('姓名长度必须为 2-100 个字符'),
  body('email').isEmail().normalizeEmail().withMessage('邮箱格式无效'),
  body('password').isLength({ min: 6 }).withMessage('密码长度至少为 6 个字符'),
  // 手机号选填：先去空格，空值/空串直接跳过校验（optional 默认只跳过 undefined）
  body('phone').trim().optional({ values: 'falsy' }).isMobilePhone().withMessage('手机号无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone } = req.body;

    // Check if user exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: '服务器错误' });
      }

      if (user) {
        return res.status(400).json({ message: '该邮箱已被注册' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      db.run(
        `INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)`,
        [name, email, hashedPassword, phone || null],
        function(err) {
          if (err) {
            return res.status(500).json({ message: '创建用户失败' });
          }

          // Create token
          const token = jwt.sign(
            { id: this.lastID, email, role: 'client' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
          );

          res.status(201).json({
            message: '用户创建成功',
            token,
            user: {
              id: this.lastID,
              name,
              email,
              phone,
              role: 'client'
            }
          });
        }
      );
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('邮箱格式无效'),
  body('password').notEmpty().withMessage('密码为必填项')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ message: '服务器错误' });
        }

        if (!user) {
          return res.status(401).json({ message: '账号或密码错误' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({ message: '账号或密码错误' });
        }

        // Create token
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
          message: '登录成功',
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar
          }
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await require('../middleware/auth').getUserFromDB(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // Obtener estadísticas de reservas del usuario
    const { db } = require('../config/database');
    
    db.all(
      `SELECT 
         COUNT(*) as total,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed,
         COALESCE(SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END), 0) as confirmed,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending,
         COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled,
         COALESCE(SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END), 0) as no_show
       FROM reservations 
       WHERE user_id = ?`,
      [req.user.id],
      (err, stats) => {
        if (err) {
          console.error('Error getting user stats:', err);
          // En caso de error, devolver el usuario sin estadísticas
          return res.json({ user });
        }

        const userStats = stats[0] || {
          total: 0,
          completed: 0,
          confirmed: 0,
          pending: 0,
          cancelled: 0,
          no_show: 0
        };

        res.json({ 
          user: {
            ...user,
            stats: userStats
          }
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// Update profile
router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone').trim().optional({ values: 'falsy' }).isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone } = req.body;
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phone) {
      updates.push('phone = ?');
      values.push(phone);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: '没有可更新的字段' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);

    db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          return res.status(500).json({ message: '更新个人资料失败' });
        }

        res.json({ message: '个人资料更新成功' });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
