const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT id, name, email, phone, role, avatar, created_at FROM users WHERE 1=1';
  let params = [];

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, users) => {
    if (err) {
      return res.status(500).json({ message: '服务器错误' });
    }

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    let countParams = [];

    if (role) {
      countQuery += ' AND role = ?';
      countParams.push(role);
    }

    if (search) {
      countQuery += ' AND (name LIKE ? OR email LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ message: '服务器错误' });
      }

      res.json({
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// Get user by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  db.get(
    'SELECT id, name, email, phone, role, avatar, created_at, updated_at FROM users WHERE id = ?',
    [id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: '服务器错误' });
      }

      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }

      // Get user's reservation count
      db.get(
        'SELECT COUNT(*) as reservation_count FROM reservations WHERE user_id = ?',
        [id],
        (err, reservationCount) => {
          if (err) {
            return res.status(500).json({ message: '服务器错误' });
          }

          res.json({
            ...user,
            reservation_count: reservationCount.reservation_count
          });
        }
      );
    }
  );
});

// Update user role (admin only)
router.put('/:id/role', authenticateToken, requireAdmin, [
  body('role').isIn(['admin', 'client', 'merchant']).withMessage('角色无效')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { role } = req.body;

  // Prevent admin from changing their own role
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: '无法修改自己的角色' });
  }

  db.run(
    'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [role, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '更新角色失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: '用户不存在' });
      }

      res.json({ message: '用户角色更新成功' });
    }
  );
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: '无法删除自己的账号' });
  }

  // Check if user has active reservations
  db.get(
    'SELECT id FROM reservations WHERE user_id = ? AND status IN ("pending", "confirmed")',
    [id],
    (err, reservation) => {
      if (err) {
        return res.status(500).json({ message: '服务器错误' });
      }

      if (reservation) {
        return res.status(400).json({
          message: '无法删除该用户，其存在有效预订。'
        });
      }

      // 若删除的是商家：其名下餐厅转平台代管（owner_id 置空），不删店
      db.run('UPDATE restaurants SET owner_id = NULL WHERE owner_id = ?', [id], function(updateErr) {
        if (updateErr) {
          return res.status(500).json({ message: '删除用户失败' });
        }

        db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
          if (err) {
            return res.status(500).json({ message: '删除用户失败' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ message: '用户不存在' });
          }

          res.json({ message: '用户删除成功' });
        });
      });
    }
  );
});

// Get user statistics (admin only)
router.get('/stats/dashboard', authenticateToken, requireAdmin, (req, res) => {
  const { date_from, date_to } = req.query;

  // Si no se especifican fechas, usar el mes actual
  const now = new Date();
  const defaultDateFrom = date_from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultDateTo = date_to || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  let whereClause = '';
  let params = [];

  if (date_from || date_to) {
    whereClause = ' WHERE created_at >= ? AND created_at <= ?';
    params = [defaultDateFrom, defaultDateTo];
  }

  const queries = {
    total: 'SELECT COUNT(*) as count FROM users',
    admins: whereClause ? `SELECT COUNT(*) as count FROM users WHERE role = "admin" AND created_at >= ? AND created_at <= ?` : 'SELECT COUNT(*) as count FROM users WHERE role = "admin"',
    clients: whereClause ? `SELECT COUNT(*) as count FROM users WHERE role = "client" AND created_at >= ? AND created_at <= ?` : 'SELECT COUNT(*) as count FROM users WHERE role = "client"',
    recent: 'SELECT COUNT(*) as count FROM users WHERE created_at >= date("now", "-30 days")',
    thisMonth: 'SELECT COUNT(*) as count FROM users WHERE created_at >= date("now", "start of month")',
    totalInPeriod: `SELECT COUNT(*) as count FROM users${whereClause}`
  };

  const results = {};
  let completed = 0;

  Object.entries(queries).forEach(([key, query]) => {
    let queryParams = key === 'total' || key === 'recent' || key === 'thisMonth' ? [] : params;
    
    console.log(`Ejecutando query ${key}:`, query);
    console.log(`Parámetros:`, queryParams);

    db.get(query, queryParams, (err, row) => {
      if (err) {
        console.error(`Error in user stats query ${key}:`, err);
        console.error(`Query fallida:`, query);
        console.error(`Parámetros usados:`, queryParams);
        if (!res.headersSent) {
          return res.status(500).json({ message: '服务器错误' });
        }
        return;
      }

      results[key] = row.count;
      completed++;

      if (completed === Object.keys(queries).length) {
        res.json({
          total: results.total,
          active: results.clients, // Clientes activos
          totalUsers: results.totalInPeriod || results.total // Usuarios en el período
        });
      }
    });
  });
});

module.exports = router;
