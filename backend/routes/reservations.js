const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Generate confirmation code
function generateConfirmationCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Get all reservations (with filters)
router.get('/', authenticateToken, (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    restaurant_id, 
    date_from, 
    date_to,
    user_id 
  } = req.query;
  
  const offset = (page - 1) * limit;
  const isAdmin = req.user.role === 'admin';

  let query = `
    SELECT r.*, 
           u.name as user_name, u.email as user_email,
           rest.name as restaurant_name,
           t.table_number
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    JOIN restaurants rest ON r.restaurant_id = rest.id
    JOIN tables t ON r.table_id = t.id
    WHERE 1=1
  `;
  
  let params = [];

  // Non-admin users can only see their own reservations
  if (!isAdmin) {
    query += ' AND r.user_id = ?';
    params.push(req.user.id);
  } else if (user_id) {
    query += ' AND r.user_id = ?';
    params.push(user_id);
  }

  if (status) {
    query += ' AND r.status = ?';
    params.push(status);
  }

  if (restaurant_id) {
    query += ' AND r.restaurant_id = ?';
    params.push(restaurant_id);
  }

  if (date_from) {
    query += ' AND r.reservation_date >= ?';
    params.push(date_from);
  }

  if (date_to) {
    query += ' AND r.reservation_date <= ?';
    params.push(date_to);
  }

  query += ' ORDER BY r.reservation_date DESC, r.reservation_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, reservations) => {
    if (err) {
      return res.status(500).json({ message: '服务器错误' });
    }

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM reservations r WHERE 1=1';
    let countParams = [];

    if (!isAdmin) {
      countQuery += ' AND r.user_id = ?';
      countParams.push(req.user.id);
    } else if (user_id) {
      countQuery += ' AND r.user_id = ?';
      countParams.push(user_id);
    }

    if (status) {
      countQuery += ' AND r.status = ?';
      countParams.push(status);
    }

    if (restaurant_id) {
      countQuery += ' AND r.restaurant_id = ?';
      countParams.push(restaurant_id);
    }

    if (date_from) {
      countQuery += ' AND r.reservation_date >= ?';
      countParams.push(date_from);
    }

    if (date_to) {
      countQuery += ' AND r.reservation_date <= ?';
      countParams.push(date_to);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ message: '服务器错误' });
      }

      res.json({
        reservations,
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

// Get reservation by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';

  let query = `
    SELECT r.*, 
           u.name as user_name, u.email as user_email, u.phone as user_phone,
           rest.name as restaurant_name, rest.address as restaurant_address, rest.phone as restaurant_phone,
           t.table_number, t.capacity as table_capacity, t.location as table_location
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    JOIN restaurants rest ON r.restaurant_id = rest.id
    JOIN tables t ON r.table_id = t.id
    WHERE r.id = ?
  `;

  if (!isAdmin) {
    query += ' AND r.user_id = ?';
  }

  const params = isAdmin ? [id] : [id, req.user.id];

  db.get(query, params, (err, reservation) => {
    if (err) {
      return res.status(500).json({ message: '服务器错误' });
    }

    if (!reservation) {
      return res.status(404).json({ message: '预订不存在' });
    }

    // Get reservation history
    db.all(
      `SELECT rh.*, u.name as changed_by_name
       FROM reservation_history rh
       LEFT JOIN users u ON rh.created_by = u.id
       WHERE rh.reservation_id = ?
       ORDER BY rh.created_at DESC`,
      [id],
      (err, history) => {
        if (err) {
          return res.status(500).json({ message: '服务器错误' });
        }

        res.json({
          ...reservation,
          history
        });
      }
    );
  });
});

// Create reservation
router.post('/', authenticateToken, [
  body('restaurant_id').isInt({ min: 1 }).withMessage('餐厅 ID 无效'),
  body('table_id').isInt({ min: 1 }).withMessage('桌台 ID 无效'),
  body('reservation_date').isISO8601().withMessage('日期无效'),
  body('reservation_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('时间格式无效'),
  body('party_size').isInt({ min: 1, max: 20 }).withMessage('人数必须介于 1 到 20 之间'),
  body('occasion').optional().trim().isLength({ max: 50 }),
  body('special_requests').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    restaurant_id, table_id, reservation_date, reservation_time,
    party_size, occasion, special_requests
  } = req.body;

  try {
    // Verify table exists and belongs to restaurant
    db.get(
      'SELECT t.*, r.capacity as restaurant_capacity FROM tables t JOIN restaurants r ON t.restaurant_id = r.id WHERE t.id = ? AND t.restaurant_id = ?',
      [table_id, restaurant_id],
      (err, table) => {
        if (err) {
          return res.status(500).json({ message: '服务器错误' });
        }

        if (!table) {
          return res.status(400).json({ message: '该餐厅下未找到此桌台' });
        }

        if (party_size > table.capacity) {
          return res.status(400).json({ message: '人数超出桌台容量' });
        }

        // Check if table is available for the requested time
        db.get(
          `SELECT id FROM reservations 
           WHERE table_id = ? AND reservation_date = ? AND status IN ('pending', 'confirmed')
           AND ABS(strftime('%s', reservation_time) - strftime('%s', ?)) < 7200`,
          [table_id, reservation_date, reservation_time],
          (err, conflictingReservation) => {
            if (err) {
              return res.status(500).json({ message: '服务器错误' });
            }

            if (conflictingReservation) {
              return res.status(400).json({ message: '该时段桌台不可用' });
            }

            // Create reservation
            const confirmationCode = generateConfirmationCode();
            
            db.run(
              `INSERT INTO reservations (
                user_id, restaurant_id, table_id, reservation_date, reservation_time,
                party_size, occasion, special_requests, confirmation_code
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                req.user.id, restaurant_id, table_id, reservation_date, reservation_time,
                party_size, occasion, special_requests, confirmationCode
              ],
              function(err) {
                if (err) {
                  return res.status(500).json({ message: '创建预订失败' });
                }

                // Create initial history record
                db.run(
                  `INSERT INTO reservation_history (reservation_id, status, notes, created_by) 
                   VALUES (?, 'pending', '预订已创建', ?)`,
                  [this.lastID, req.user.id]
                );

                res.status(201).json({
                  message: '预订创建成功',
                  reservationId: this.lastID,
                  confirmationCode
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// Update reservation status (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).withMessage('状态无效'),
  body('notes').optional().trim().isLength({ max: 500 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { status, notes } = req.body;

  // Get current reservation
  db.get('SELECT * FROM reservations WHERE id = ?', [id], (err, reservation) => {
    if (err) {
      return res.status(500).json({ message: '服务器错误' });
    }

    if (!reservation) {
      return res.status(404).json({ message: '预订不存在' });
    }

    // Update reservation status
    db.run(
      'UPDATE reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '更新预订失败' });
        }

        // Add to history
        db.run(
          `INSERT INTO reservation_history (reservation_id, status, notes, created_by) 
           VALUES (?, ?, ?, ?)`,
          [id, status, notes || `状态变更为 ${status}`, req.user.id]
        );

        res.json({ message: '预订状态更新成功' });
      }
    );
  });
});

// Cancel reservation (user can cancel their own)
router.put('/:id/cancel', authenticateToken, [
  body('reason').optional().trim().isLength({ max: 500 })
], (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const isAdmin = req.user.role === 'admin';

  // Get reservation
  let query = 'SELECT * FROM reservations WHERE id = ?';
  let params = [id];

  if (!isAdmin) {
    query += ' AND user_id = ?';
    params.push(req.user.id);
  }

  db.get(query, params, (err, reservation) => {
    if (err) {
      return res.status(500).json({ message: '服务器错误' });
    }

    if (!reservation) {
      return res.status(404).json({ message: '预订不存在' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ message: '该预订已取消' });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({ message: '无法取消已完成的预订' });
    }

    // Update reservation status
    db.run(
      'UPDATE reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['cancelled', id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '取消预订失败' });
        }

        // Add to history
        db.run(
          `INSERT INTO reservation_history (reservation_id, status, notes, created_by) 
           VALUES (?, 'cancelled', ?, ?)`,
          [id, reason || '用户取消', req.user.id]
        );

        res.json({ message: '预订取消成功' });
      }
    );
  });
});

// Record payment for completed reservation (admin only)
router.put('/:id/payment', authenticateToken, requireAdmin, [
  body('total_amount').isFloat({ min: 0 }).withMessage('总金额必须为正数'),
  body('payment_method').optional().trim().isLength({ max: 50 }).withMessage('支付方式无效'),
  body('notes').optional().trim().isLength({ max: 200 }).withMessage('备注无效')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { total_amount, payment_method, notes } = req.body;

  // Get current reservation
  db.get('SELECT * FROM reservations WHERE id = ?', [id], (err, reservation) => {
    if (err) {
      return res.status(500).json({ message: '服务器错误' });
    }

    if (!reservation) {
      return res.status(404).json({ message: '预订不存在' });
    }

    if (reservation.status !== 'completed') {
      return res.status(400).json({ message: '仅可为已完成的预订登记付款' });
    }

    // Update reservation with payment information
    db.run(
      `UPDATE reservations SET 
        total_amount = ?, 
        payment_method = ?, 
        payment_notes = ?,
        payment_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [total_amount, payment_method || null, notes || null, id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '登记付款失败' });
        }

        // Add to history
        db.run(
          `INSERT INTO reservation_history (reservation_id, status, notes, created_by) 
           VALUES (?, 'payment_registered', ?, ?)`,
          [id, `已登记付款：¥${total_amount} ${payment_method ? `(${payment_method})` : ''} ${notes ? `- ${notes}` : ''}`, req.user.id]
        );

        res.json({ 
          message: '付款登记成功',
          payment: {
            total_amount,
            payment_method,
            notes,
            payment_date: new Date().toISOString()
          }
        });
      }
    );
  });
});

// Delete reservation (admin only) - Solo permite eliminar completadas y canceladas
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  // Primero obtener la reserva para verificar su estado
  db.get('SELECT * FROM reservations WHERE id = ?', [id], (err, reservation) => {
    if (err) {
      return res.status(500).json({ message: '删除预订失败' });
    }

    if (!reservation) {
      return res.status(404).json({ message: '预订不存在' });
    }

    // Solo permitir eliminar reservas completadas o canceladas
    if (reservation.status === 'pending' || reservation.status === 'confirmed') {
      return res.status(400).json({ 
        message: '无法删除待确认或已确认的预订。仅可删除已完成或已取消的预订。'
      });
    }

    db.run('DELETE FROM reservations WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ message: '删除预订失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: '预订不存在' });
      }

      res.json({ message: '预订删除成功' });
    });
  });
});

// Get reservation statistics (admin only)
router.get('/stats/dashboard', authenticateToken, requireAdmin, (req, res) => {
  const { date_from, date_to, restaurant_id } = req.query;

  // Si no se especifican fechas, usar el mes actual
  const now = new Date();
  const defaultDateFrom = date_from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultDateTo = date_to || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  let whereClause = 'WHERE 1=1';
  let params = [];

  if (date_from) {
    whereClause += ' AND reservation_date >= ?';
    params.push(date_from);
  } else {
    whereClause += ' AND reservation_date >= ?';
    params.push(defaultDateFrom);
  }

  if (date_to) {
    whereClause += ' AND reservation_date <= ?';
    params.push(date_to);
  } else {
    whereClause += ' AND reservation_date <= ?';
    params.push(defaultDateTo);
  }

  if (restaurant_id) {
    whereClause += ' AND restaurant_id = ?';
    params.push(restaurant_id);
  }

  // Calcular fechas del período anterior para comparación
  const currentStartDate = new Date(defaultDateFrom);
  const currentEndDate = new Date(defaultDateTo);
  const daysDiff = Math.ceil((currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24));
  
  const previousStartDate = new Date(currentStartDate);
  previousStartDate.setDate(previousStartDate.getDate() - daysDiff);
  const previousEndDate = new Date(currentEndDate);
  previousEndDate.setDate(previousEndDate.getDate() - daysDiff);
  
  const previousDateFrom = previousStartDate.toISOString().split('T')[0];
  const previousDateTo = previousEndDate.toISOString().split('T')[0];

  let previousWhereClause = 'WHERE 1=1';
  let previousParams = [];

  if (restaurant_id) {
    previousWhereClause += ' AND restaurant_id = ?';
    previousParams.push(restaurant_id);
  }
  previousWhereClause += ' AND reservation_date >= ? AND reservation_date <= ?';
  previousParams.push(previousDateFrom, previousDateTo);

  const queries = {
    // Período actual
    total: `SELECT COUNT(*) as count FROM reservations ${whereClause}`,
    pending: `SELECT COUNT(*) as count FROM reservations ${whereClause} AND status = 'pending'`,
    confirmed: `SELECT COUNT(*) as count FROM reservations ${whereClause} AND status = 'confirmed'`,
    cancelled: `SELECT COUNT(*) as count FROM reservations ${whereClause} AND status = 'cancelled'`,
    completed: `SELECT COUNT(*) as count FROM reservations ${whereClause} AND status = 'completed'`,
    revenue: `SELECT COALESCE(SUM(total_amount), 0) as total FROM reservations ${whereClause} AND status = 'completed'`,
    pendingRevenue: `SELECT COALESCE(SUM(total_amount), 0) as total FROM reservations ${whereClause} AND status = 'confirmed'`,
    
    // Período anterior para comparación
    prevTotal: `SELECT COUNT(*) as count FROM reservations ${previousWhereClause}`,
    prevPending: `SELECT COUNT(*) as count FROM reservations ${previousWhereClause} AND status = 'pending'`,
    prevConfirmed: `SELECT COUNT(*) as count FROM reservations ${previousWhereClause} AND status = 'confirmed'`,
    prevCancelled: `SELECT COUNT(*) as count FROM reservations ${previousWhereClause} AND status = 'cancelled'`,
    prevCompleted: `SELECT COUNT(*) as count FROM reservations ${previousWhereClause} AND status = 'completed'`,
    prevRevenue: `SELECT COALESCE(SUM(total_amount), 0) as total FROM reservations ${previousWhereClause} AND status = 'completed'`,
    
    // Estadísticas de usuarios
    totalUsers: `SELECT COUNT(*) as count FROM users WHERE created_at >= ? AND created_at <= ?`,
    prevTotalUsers: `SELECT COUNT(*) as count FROM users WHERE created_at >= ? AND created_at <= ?`,
    
    // Estadísticas de restaurantes
    totalRestaurants: `SELECT COUNT(*) as count FROM restaurants`,
    activeRestaurants: `SELECT COUNT(*) as count FROM restaurants WHERE status = 'active'`
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    let queryParams = [];
    
    if (key.startsWith('prev')) {
      queryParams = [...previousParams];
    } else if (key === 'totalUsers' || key === 'prevTotalUsers') {
      if (key === 'totalUsers') {
        queryParams = [defaultDateFrom, defaultDateTo];
      } else {
        queryParams = [previousDateFrom, previousDateTo];
      }
    } else if (key === 'totalRestaurants' || key === 'activeRestaurants') {
      // Estas consultas no necesitan parámetros de fecha
      queryParams = [];
    } else {
      // Para las consultas de reservas (total, pending, confirmed, etc.)
      queryParams = [...params];
    }

    db.get(query, queryParams, (err, row) => {
      if (err) {
        console.error(`Error in query ${key}:`, err);
        if (!res.headersSent) {
          return res.status(500).json({ message: '服务器错误' });
        }
        return;
      }

      results[key] = row.count || row.total || 0;
      completed++;

      if (completed === totalQueries) {
        // Calcular porcentajes de cambio
        const calculateChange = (current, previous) => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return Math.round(((current - previous) / previous) * 100);
        };

        const finalResults = {
          total: results.total,
          pending: results.pending,
          confirmed: results.confirmed,
          cancelled: results.cancelled,
          completed: results.completed,
          revenue: results.revenue,
          pendingRevenue: results.pendingRevenue,
          totalUsers: results.totalUsers,
          activeRestaurants: results.activeRestaurants,
          totalRestaurants: results.totalRestaurants,
          
          // Porcentajes de cambio
          changes: {
            total: calculateChange(results.total, results.prevTotal),
            pending: calculateChange(results.pending, results.prevPending),
            confirmed: calculateChange(results.confirmed, results.prevConfirmed),
            cancelled: calculateChange(results.cancelled, results.prevCancelled),
            completed: calculateChange(results.completed, results.prevCompleted),
            revenue: calculateChange(results.revenue, results.prevRevenue),
            totalUsers: calculateChange(results.totalUsers, results.prevTotalUsers)
          }
        };

        if (!res.headersSent) {
          res.json(finalResults);
        }
      }
    });
  });
});

module.exports = router;
