const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { db } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Configuración de Multer para subida de imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'restaurant-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('仅允许上传图片文件'));
    }
  }
});

// Middleware para manejar errores de multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Error de Multer:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件过大' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: '意外的文件字段' });
    }
  } else if (err) {
    console.error('Error en subida de archivo:', err);
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Get all restaurants
router.get('/', (req, res) => {
  const { page = 1, limit = 12, search, cuisine_type, min_rating, max_rating } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT r.*, 
           (SELECT COUNT(*) FROM reservations WHERE restaurant_id = r.id AND status = 'confirmed') as total_reservations
    FROM restaurants r 
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (r.name LIKE ? OR r.cuisine_type LIKE ? OR r.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (cuisine_type) {
    query += ` AND r.cuisine_type = ?`;
    params.push(cuisine_type);
  }

  if (min_rating) {
    query += ` AND r.rating >= ?`;
    params.push(parseFloat(min_rating));
  }

  if (max_rating) {
    query += ` AND r.rating <= ?`;
    params.push(parseFloat(max_rating));
  }

  query += ` ORDER BY r.rating DESC, r.name ASC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  db.all(query, params, (err, restaurants) => {
    if (err) {
      return res.status(500).json({ message: '服务器错误' });
    }

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM restaurants r 
      WHERE 1=1
    `;
    
    // Add the same WHERE conditions as the main query
    let countParams = [];
    if (search) {
      countQuery += ` AND (r.name LIKE ? OR r.cuisine_type LIKE ? OR r.description LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (cuisine_type) {
      countQuery += ` AND r.cuisine_type = ?`;
      countParams.push(cuisine_type);
    }

    if (min_rating) {
      countQuery += ` AND r.rating >= ?`;
      countParams.push(parseFloat(min_rating));
    }

    if (max_rating) {
      countQuery += ` AND r.rating <= ?`;
      countParams.push(parseFloat(max_rating));
    }
    
    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ message: '服务器错误' });
      }

      res.json({
        restaurants,
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

// Get restaurant statistics - CORREGIDO
router.get('/stats', (req, res) => {
  const query = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
      AVG(CAST(rating AS REAL)) as averageRating
    FROM restaurants
  `;
  
  db.get(query, (err, result) => {
    if (err) {
      console.error('Error en consulta de estadísticas:', err);
      return res.status(500).json({ message: '服务器错误' });
    }
    
    const stats = {
      total: result?.total || 0,
      active: result?.active || 0,
      averageRating: result?.averageRating ? parseFloat(result.averageRating).toFixed(1) : '0.0'
    };
    
    console.log('Estadísticas enviadas:', stats);
    res.json(stats);
  });
});

// Get restaurant by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  console.log(`Fetching restaurant with ID: ${id}`);

  db.get(
    'SELECT * FROM restaurants WHERE id = ?',
    [id],
    (err, restaurant) => {
      if (err) {
        console.error('Error fetching restaurant:', err);
        return res.status(500).json({ message: '服务器错误' });
      }

      if (!restaurant) {
        console.log(`Restaurant with ID ${id} not found`);
        return res.status(404).json({ message: '餐厅不存在' });
      }

      console.log('Restaurant found:', restaurant);

      // Get tables for this restaurant
      db.all(
        'SELECT * FROM tables WHERE restaurant_id = ? ORDER BY capacity',
        [id],
        (err, tables) => {
          if (err) {
            console.error('Error fetching tables:', err);
            // Si hay error con las tablas, devolver el restaurante sin tablas
            return res.json({
              ...restaurant,
              tables: [],
              avg_rating: restaurant.rating || 0
            });
          }

          console.log(`Found ${tables ? tables.length : 0} tables for restaurant ${id}`);

          res.json({
            ...restaurant,
            tables: tables || [],
            avg_rating: restaurant.rating || 0
          });
        }
      );
    }
  );
});

// Create restaurant (admin only)
router.post('/', authenticateToken, requireAdmin, upload.single('image'), [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('姓名长度必须为 2-100 个字符'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('描述长度必须为 10-1000 个字符'),
  body('cuisine_type').trim().isIn(['秘鲁菜', '日料', '意大利菜', '法餐', '墨西哥菜', '西班牙菜', '中餐', '泰餐', '国际融合菜', '素食', '印度菜', '美式', '地中海菜', '融合菜']).withMessage('菜系类型无效'),
  body('address').trim().isLength({ min: 10, max: 200 }).withMessage('地址长度必须为 10-200 个字符'),
  body('phone').trim().isLength({ min: 10, max: 20 }).withMessage('电话长度必须为 10-20 个字符'),
  body('email').trim().isEmail().withMessage('邮箱格式无效'),
  body('opening_time').trim().isLength({ min: 5, max: 20 }).withMessage('营业开始时间无效'),
  body('closing_time').trim().isLength({ min: 5, max: 20 }).withMessage('营业结束时间无效'),
  body('capacity').isInt({ min: 1, max: 1000 }).withMessage('容量必须介于 1 到 1000 之间'),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('评分必须介于 0 到 5 之间'),
  body('status').trim().isIn(['active', 'inactive']).withMessage('状态无效'),
  body('image').optional().trim().isLength({ min: 0, max: 500 }).withMessage('图片 URL 无效')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    description,
    cuisine_type,
    address,
    phone,
    email,
    opening_time,
    closing_time,
    capacity,
    rating,
    status,
    image
  } = req.body;

  // Determinar la URL de la imagen
  let imageUrl = image || '';
  if (req.file) {
    // Si se subió un archivo, usar la URL del archivo subido
    imageUrl = `/uploads/${req.file.filename}`;
  }

  db.run(`
    INSERT INTO restaurants (
      name, description, cuisine_type, address, phone, email,
      opening_time, closing_time, capacity, rating, status, image, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `, [
    name, description, cuisine_type, address, phone, email,
    opening_time, closing_time, capacity, rating || 0, status, imageUrl
  ], function(err) {
    if (err) {
      console.error('Error creating restaurant:', err);
      return res.status(500).json({ message: '创建餐厅失败' });
    }

    res.status(201).json({
      message: '餐厅创建成功',
      restaurantId: this.lastID
    });
  });
});

// Update restaurant (admin only)
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), handleMulterError, (req, res) => {
  const { id } = req.params;
  const updateFields = {};
  const updateValues = [];

  // Dynamically build update query
  const allowedFields = ['name', 'description', 'cuisine_type', 'address', 'phone', 'email', 'opening_time', 'closing_time', 'capacity', 'rating', 'status'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined && req.body[field] !== '') {
      updateFields[field] = req.body[field];
      updateValues.push(req.body[field]);
    }
  });

  // Manejar la imagen
  if (req.file) {
    // Si se subió un nuevo archivo, usar la URL del archivo subido
    const imageUrl = `/uploads/${req.file.filename}`;
    updateFields.image = imageUrl;
    updateValues.push(imageUrl);
  } else if (req.body.image !== undefined && req.body.image !== '') {
    // Si se proporcionó una URL de imagen
    updateFields.image = req.body.image;
    updateValues.push(req.body.image);
  }

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ message: '没有可更新的字段' });
  }

  updateValues.push(`datetime('now')`);
  updateValues.push(id);

  const setClause = Object.keys(updateFields).map(field => `${field} = ?`).join(', ');

  db.run(
    `UPDATE restaurants SET ${setClause}, updated_at = ? WHERE id = ?`,
    updateValues,
    function(err) {
      if (err) {
        console.error('Error updating restaurant:', err);
        return res.status(500).json({ message: '更新餐厅失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: '餐厅不存在' });
      }

      res.json({
        message: '餐厅更新成功'
      });
    }
  );
});

// Get restaurant availability for specific date - MEJORADO
router.get('/:id/availability', (req, res) => {
  const { id } = req.params;
  const { date, party_size } = req.query;

  if (!date) {
    return res.status(400).json({ message: '日期为必填项' });
  }

  // Obtener información del restaurante con sus horarios
  db.get(
    'SELECT * FROM restaurants WHERE id = ?',
    [id],
    (err, restaurant) => {
      if (err) {
        return res.status(500).json({ message: '服务器错误' });
      }

      if (!restaurant) {
        return res.status(404).json({ message: '餐厅不存在' });
      }

      // Obtener todas las mesas del restaurante
      db.all(
        'SELECT * FROM tables WHERE restaurant_id = ? AND capacity >= ? AND status = ? ORDER BY capacity',
        [id, parseInt(party_size) || 1, 'available'],
        (err, tables) => {
          if (err) {
            return res.status(500).json({ message: '服务器错误' });
          }

          // Obtener reservas existentes para la fecha
          db.all(
            `SELECT table_id, reservation_time, party_size 
               FROM reservations 
               WHERE restaurant_id = ? AND reservation_date = ? AND status IN ('pending', 'confirmed')`,
            [id, date],
            (err, reservations) => {
              if (err) {
                return res.status(500).json({ message: '服务器错误' });
              }

              // Parsear horarios del restaurante
              const openingHours = restaurant.opening_time || '11:00';
              const closingHours = restaurant.closing_time || '23:00';
              
              const [openHour, openMin] = openingHours.split(':').map(Number);
              const [closeHour, closeMin] = closingHours.split(':').map(Number);
              
              // Generar time slots basados en horarios del restaurante
              const timeSlots = [];
              for (let hour = openHour; hour <= closeHour; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                  const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                  
                  // Verificar si el slot está dentro del horario de atención
                  const slotMinutes = hour * 60 + minute;
                  const openMinutes = openHour * 60 + openMin;
                  const closeMinutes = closeHour * 60 + closeMin;
                  
                  // Asegurar que el slot no exceda el horario de cierre
                  if (slotMinutes >= openMinutes && slotMinutes < closeMinutes) {
                    timeSlots.push(slotTime);
                  }
                }
              }

              const availability = timeSlots.map(time => {
                // Verificar conflictos con reservas existentes (ventana de 2 horas)
                const conflictingReservations = reservations.filter(res => {
                  const resTime = res.reservation_time.substring(0, 5);
                  const resHour = parseInt(resTime.split(':')[0]);
                  const resMinute = parseInt(resTime.split(':')[1]);
                  const slotHour = parseInt(time.split(':')[0]);
                  const slotMinute = parseInt(time.split(':')[1]);
                  
                  // Ventana de conflicto: 2 horas antes o después
                  const timeDiff = Math.abs((resHour * 60 + resMinute) - (slotHour * 60 + slotMinute));
                  return timeDiff < 120; // 2 horas = 120 minutos
                });

                const reservedTables = conflictingReservations.map(res => res.table_id);
                const availableTables = tables.filter(table => !reservedTables.includes(table.id));

                return {
                  time,
                  available: availableTables.length > 0,
                  tables: availableTables,
                  totalTables: tables.length,
                  conflictingReservations: conflictingReservations.length
                };
              });

              res.json({
                date,
                partySize: parseInt(party_size) || 1,
                restaurant: {
                  id: restaurant.id,
                  name: restaurant.name,
                  opening_hours: restaurant.opening_time,
                  closing_hours: restaurant.closing_time
                },
                availability,
                summary: {
                  totalSlots: timeSlots.length,
                  availableSlots: availability.filter(slot => slot.available).length,
                  totalTables: tables.length,
                  totalReservations: reservations.length
                }
              });
            }
          );
        }
      );
    }
  );
});

// Delete restaurant (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM restaurants WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除餐厅失败' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '餐厅不存在' });
    }

    res.json({ message: '餐厅删除成功' });
  });
});

module.exports = router;
