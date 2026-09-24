const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { authenticateToken, requireAdmin, requireMerchantOrAdmin } = require('../middleware/auth');

const router = express.Router();

// 商家校验：目标餐厅是否归其所有（admin 直接放行）
const ensureRestaurantOwnership = (req, restaurantId) => {
  if (req.user.role !== 'merchant') return Promise.resolve();
  return new Promise((resolve, reject) => {
    db.get('SELECT owner_id FROM restaurants WHERE id = ?', [restaurantId], (err, row) => {
      if (err) reject(err);
      else if (!row || row.owner_id !== req.user.id) {
        const e = new Error('unauthorized');
        e.status = 403;
        reject(e);
      } else resolve();
    });
  });
};

// 统一处理商家越权错误
const handleOwnershipError = (res, err, fallbackMessage) => {
  if (err && err.status === 403) {
    return res.status(403).json({ message: '无权操作其他商家的餐厅' });
  }
  return res.status(500).json({ message: fallbackMessage });
};

// 商家校验：目标桌台所属餐厅是否归其所有（admin 直接放行）
const ensureTableOwnership = (req, tableId) => {
  if (req.user.role !== 'merchant') return Promise.resolve();
  return new Promise((resolve, reject) => {
    db.get('SELECT restaurant_id FROM tables WHERE id = ?', [tableId], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve(); // 桌台不存在：交由后续 UPDATE 返回 404
      else ensureRestaurantOwnership(req, row.restaurant_id).then(resolve).catch(reject);
    });
  });
};

// Get all tables (with optional restaurant filter)
router.get('/', (req, res) => {
  const { restaurant_id, status, search, owner_id } = req.query;

  let query = `
    SELECT t.*, r.name as restaurant_name
    FROM tables t
    JOIN restaurants r ON t.restaurant_id = r.id
    WHERE 1=1
  `;
  let params = [];

  if (restaurant_id) {
    query += ' AND t.restaurant_id = ?';
    params.push(restaurant_id);
  }

  if (owner_id) {
    query += ' AND r.owner_id = ?';
    params.push(parseInt(owner_id));
  }

  if (search) {
    query += ' AND t.table_number LIKE ?';
    params.push(`%${search}%`);
  }

  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }

  query += ' ORDER BY r.name, t.table_number';

  db.all(query, params, (err, tables) => {
    if (err) {
      return res.status(500).json({ message: '服务器错误' });
    }

    res.json({ tables });
  });
});

// Get table by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT t.*, r.name as restaurant_name 
     FROM tables t 
     JOIN restaurants r ON t.restaurant_id = r.id 
     WHERE t.id = ?`,
    [id],
    (err, table) => {
      if (err) {
        return res.status(500).json({ message: '服务器错误' });
      }

      if (!table) {
        return res.status(404).json({ message: '桌台不存在' });
      }

      res.json({ table });
    }
  );
});

// Create table (admin or owning merchant)
router.post('/', authenticateToken, requireMerchantOrAdmin, [
  body('restaurant_id').isInt({ min: 1 }).withMessage('餐厅 ID 无效'),
  body('table_number').trim().isLength({ min: 1, max: 10 }).withMessage('桌台编号无效'),
  body('capacity').isInt({ min: 1, max: 20 }).withMessage('容量必须介于 1 到 20 之间'),
  body('min_capacity').optional().isInt({ min: 1, max: 20 }).withMessage('最小容量无效'),
  body('location').optional().trim().isLength({ max: 50 }).withMessage('位置无效'),
  body('table_type').optional().isIn(['standard', 'vip', 'private', 'outdoor']).withMessage('桌台类型无效'),
  body('status').optional().isIn(['available', 'unavailable', 'maintenance']).withMessage('状态无效')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    restaurant_id, table_number, capacity, min_capacity = 1,
    location, table_type = 'standard', status = 'available'
  } = req.body;

  ensureRestaurantOwnership(req, restaurant_id).then(() => {
  // Check if table number already exists for this restaurant
  db.get(
    'SELECT id FROM tables WHERE restaurant_id = ? AND table_number = ?',
    [restaurant_id, table_number],
    (err, existingTable) => {
      if (err) {
        return res.status(500).json({ message: '服务器错误' });
      }

      if (existingTable) {
        return res.status(400).json({ message: '该餐厅已存在此桌台编号' });
      }

      db.run(
        `INSERT INTO tables (
          restaurant_id, table_number, capacity, min_capacity, 
          location, table_type, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [restaurant_id, table_number, capacity, min_capacity, location, table_type, status],
        function(err) {
          if (err) {
            return res.status(500).json({ message: '创建桌台失败' });
          }

          res.status(201).json({
            message: '桌台创建成功',
            tableId: this.lastID
          });
        }
      );
    }
  );
  }).catch((err) => handleOwnershipError(res, err, '创建桌台失败'));
});

// Update table (admin or owning merchant)
router.put('/:id', authenticateToken, requireMerchantOrAdmin, [
  body('table_number').optional().trim().isLength({ min: 1, max: 10 }),
  body('capacity').optional().isInt({ min: 1, max: 20 }),
  body('min_capacity').optional().isInt({ min: 1, max: 20 }),
  body('location').optional().trim().isLength({ max: 50 }),
  body('table_type').optional().isIn(['standard', 'vip', 'private', 'outdoor']),
  body('status').optional().isIn(['available', 'unavailable', 'maintenance'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const updates = [];
  const values = [];

  const allowedFields = [
    'table_number', 'capacity', 'min_capacity',
    'location', 'table_type', 'status'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  if (updates.length === 0) {
    return res.status(400).json({ message: '没有可更新的字段' });
  }

  values.push(id);

  ensureTableOwnership(req, id).then(() => {
  db.run(
    `UPDATE tables SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ message: '更新桌台失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: '桌台不存在' });
      }

      res.json({ message: '桌台更新成功' });
    }
  );
  }).catch((err) => handleOwnershipError(res, err, '更新桌台失败'));
});

// Delete table (admin or owning merchant)
router.delete('/:id', authenticateToken, requireMerchantOrAdmin, (req, res) => {
  const { id } = req.params;

  ensureTableOwnership(req, id).then(() => {
  // Check if table has existing reservations
  db.get(
    'SELECT id FROM reservations WHERE table_id = ? AND status IN ("pending", "confirmed")',
    [id],
    (err, reservation) => {
      if (err) {
        return res.status(500).json({ message: '服务器错误' });
      }

      if (reservation) {
        return res.status(400).json({
          message: '无法删除该桌台，其存在有效预订。'
        });
      }

      db.run('DELETE FROM tables WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ message: '删除桌台失败' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '桌台不存在' });
        }

        res.json({ message: '桌台删除成功' });
      });
    }
  );
  }).catch((err) => handleOwnershipError(res, err, '删除桌台失败'));
});

// Get table availability for specific date
router.get('/:id/availability', (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: '日期为必填项' });
  }

  // Get table info
  db.get('SELECT * FROM tables WHERE id = ?', [id], (err, table) => {
    if (err) {
      return res.status(500).json({ message: '服务器错误' });
    }

    if (!table) {
      return res.status(404).json({ message: '桌台不存在' });
    }

    // Get existing reservations for the date
    db.all(
      `SELECT reservation_time, party_size 
       FROM reservations 
       WHERE table_id = ? AND reservation_date = ? AND status IN ('pending', 'confirmed')
       ORDER BY reservation_time`,
      [id, date],
      (err, reservations) => {
        if (err) {
          return res.status(500).json({ message: '服务器错误' });
        }

        // Generate time slots from 11:00 to 23:30
        const timeSlots = [];
        for (let hour = 11; hour <= 23; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            timeSlots.push(time);
          }
        }

        const availability = timeSlots.map(time => {
          const conflictingReservation = reservations.find(res => {
            const resTime = res.reservation_time.substring(0, 5);
            const resHour = parseInt(resTime.split(':')[0]);
            const resMinute = parseInt(resTime.split(':')[1]);
            const slotHour = parseInt(time.split(':')[0]);
            const slotMinute = parseInt(time.split(':')[1]);
            
            // Check if reservation conflicts with time slot (2-hour window)
            const timeDiff = Math.abs((resHour * 60 + resMinute) - (slotHour * 60 + slotMinute));
            return timeDiff < 120;
          });

          return {
            time,
            available: !conflictingReservation,
            reservation: conflictingReservation || null
          };
        });

        res.json({
          table,
          date,
          availability
        });
      }
    );
  });
});

module.exports = router;
