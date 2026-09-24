const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'database', 'restaurant.db');
const db = new sqlite3.Database(dbPath);

async function initializeCompleteSystem() {
  console.log('🚀 Inicializando sistema completo con datos de muestra...');
  
  try {
    // Verificar si ya hay datos
    const restaurantCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM restaurants', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    if (restaurantCount > 0) {
      console.log('✅ El sistema ya tiene datos. No se insertarán datos de muestra.');
      return;
    }

    // 1. Insertar restaurantes
    console.log('\n🍽 Insertando restaurantes...');
    const restaurants = [
      {
        name: "La Mar",
        cuisine_type: "秘鲁菜",
        description: "秘鲁最佳海景餐厅，主营酸橘汁腌鱼和新鲜海鱼，拥有 30 多年历史。",
        address: "米拉弗洛雷斯区拉玛尔大道 123 号",
        phone: "+51 1 234-5678",
        email: "info@lamar.com",
        opening_time: "11:00",
        closing_time: "23:00",
        capacity: 120,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1552566626-8f9919c6b9a?w=800",
        status: "active"
      },
      {
        name: "Sakura Sushi Bar",
        cuisine_type: "日料",
        description: "地道日式体验，大师级主厨现做新鲜寿司。环境优雅，服务无可挑剔。",
        address: "圣伊西德罗区兰花街 456 号",
        phone: "+51 1 345-6789",
        email: "contacto@sakura.com",
        opening_time: "12:00",
        closing_time: "23:30",
        capacity: 80,
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1579584439413-3d4a7375e9b?w=800",
        status: "active"
      },
      {
        name: "Trattoria Italiana",
        cuisine_type: "意大利菜",
        description: "传承意式经典，手工意面、柴火烤披萨，搭配意大利精选产区葡萄酒。",
        address: "林塞区意大利大道 789 号",
        phone: "+51 1 456-7890",
        email: "info@trattoria.com",
        opening_time: "12:30",
        closing_time: "00:00",
        capacity: 100,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1555396269-9ad694d64d1?w=800",
        status: "active"
      },
      {
        name: "Le Bistrot Parisien",
        cuisine_type: "法餐",
        description: "优雅法式餐厅，招牌红酒烩鸡、法式焗蜗牛与经典甜点，尽享地道巴黎风情。",
        address: "圣博尔哈区法兰西街 321 号",
        phone: "+51 1 567-8901",
        email: "reservation@lebistrot.com",
        opening_time: "13:00",
        closing_time: "23:00",
        capacity: 60,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1414235077428-142898bad04d?w=800",
        status: "active"
      },
      {
        name: "El Mariachi Loco",
        cuisine_type: "墨西哥菜",
        description: "活力四射的墨西哥美食，正宗塔可、新鲜鳄梨酱与玛格丽特鸡尾酒，周末还有现场乐队演出。",
        address: "苏尔科区墨西哥大道 654 号",
        phone: "+51 1 678-9012",
        email: "fiesta@mariachiloco.com",
        opening_time: "11:30",
        closing_time: "01:00",
        capacity: 150,
        rating: 4.4,
        image: "https://images.unsplash.com/photo-1562367476-c8b2302b777c?w=800",
        status: "active"
      },
      {
        name: "Tapas del Sol",
        cuisine_type: "西班牙菜",
        description: "正宗西班牙小吃，伊比利亚火腿、瓦伦西亚海鲜饭配自制桑格利亚，浓郁地中海风情。",
        address: "巴兰科区马德里街 987 号",
        phone: "+51 1 789-0123",
        email: "reservas@tapasdelsol.com",
        opening_time: "12:00",
        closing_time: "00:30",
        capacity: 90,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1555396269-9ad694d64d1?w=800",
        status: "active"
      },
      {
        name: "Great Wall Chinese",
        cuisine_type: "中餐",
        description: "传统粤菜，广式点心、北京烤鸭与手工鲜面，利马历史最悠久的中餐厅之一。",
        address: "市中心中华大道 246 号",
        phone: "+51 1 890-1234",
        email: "delivery@greatwall.com",
        opening_time: "11:00",
        closing_time: "22:30",
        capacity: 110,
        rating: 4.3,
        image: "https://images.unsplash.com/photo-1565299624946-566f6dd8e27?w=800",
        status: "active"
      },
      {
        name: "Bangkok Dreams",
        cuisine_type: "泰餐",
        description: "异域泰式风味，咖喱、泰式炒河粉与芒果糯米饭，香料均从泰国进口。",
        address: "米拉弗洛雷斯区暹罗街 135 号",
        phone: "+51 1 901-2345",
        email: "info@bangkokdreams.com",
        opening_time: "12:00",
        closing_time: "23:00",
        capacity: 70,
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1563244162-1c1c4e0be65?w=800",
        status: "active"
      },
      {
        name: "The Golden Fork",
        cuisine_type: "国际融合菜",
        description: "国际融合料理，创意菜品荟萃各地精华，更有精选葡萄酒与特调鸡尾酒。",
        address: "圣伊西德罗区全景大道 789 号",
        phone: "+51 1 012-3456",
        email: "reservations@goldenfork.com",
        opening_time: "13:00",
        closing_time: "01:00",
        capacity: 85,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1414235077428-142898bad04d?w=800",
        status: "active"
      },
      {
        name: "Vegan Paradise",
        cuisine_type: "素食",
        description: "100% 纯素料理，创新健康菜品，无糖甜点与鲜榨果汁。",
        address: "米拉弗洛雷斯区绿色街 321 号",
        phone: "+51 1 123-4567",
        email: "hola@veganparadise.com",
        opening_time: "11:00",
        closing_time: "22:00",
        capacity: 65,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1540555700-0e1c74d1b7e?w=800",
        status: "active"
      }
    ];

    for (const restaurant of restaurants) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO restaurants (
            name, cuisine_type, description, address, phone, 
            email, capacity, opening_time, closing_time, 
            rating, image, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          restaurant.name,
          restaurant.cuisine_type,
          restaurant.description,
          restaurant.address,
          restaurant.phone,
          restaurant.email,
          restaurant.capacity,
          restaurant.opening_time,
          restaurant.closing_time,
          restaurant.rating,
          restaurant.image,
          restaurant.status
        ], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    console.log(`✅ ${restaurants.length} restaurantes insertados`);

    // 2. Insertar mesas para cada restaurante
    console.log('\n🪑 Insertando mesas...');
    let tableId = 1;
    const tables = [];

    restaurants.forEach((restaurant, restaurantIndex) => {
      const tablesPerRestaurant = restaurantIndex < 3 ? 12 : 8;
      
      for (let i = 1; i <= tablesPerRestaurant; i++) {
        const capacity = i <= 4 ? 2 : i <= 8 ? 4 : i <= 10 ? 6 : 8;
        const tableType = i <= 4 ? 'standard' : i <= 8 ? 'private' : i <= 10 ? 'vip' : 'outdoor';
        const location = i <= 2 ? '露台' : i <= 6 ? '室内' : i <= 8 ? '包间' : i <= 10 ? '吧台' : '花园';
        
        tables.push({
          restaurant_id: restaurantIndex + 1,
          table_number: `${restaurantIndex + 1}-${i}`,
          capacity,
          table_type: tableType,
          location,
          status: 'available'
        });
        tableId++;
      }
    });

    for (const table of tables) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO tables (
            restaurant_id, table_number, capacity, table_type, 
            location, status
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          table.restaurant_id,
          table.table_number,
          table.capacity,
          table.table_type,
          table.location,
          table.status
        ], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    console.log(`✅ ${tables.length} mesas insertadas`);

    // 3. Insertar usuarios de muestra
    console.log('\n👥 Insertando usuarios...');
    const users = [
      { name: "商家演示", email: "owner@restaurant.com", phone: "+51 987 000 001", role: "merchant", password: "owner123" },
      { name: "Carlos Rodríguez", email: "carlos.rodriguez@email.com", phone: "+51 987 654 321", role: "client" },
      { name: "María González", email: "maria.gonzalez@email.com", phone: "+51 987 654 322", role: "client" },
      { name: "Luis Fernández", email: "luis.fernandez@email.com", phone: "+51 987 654 323", role: "client" },
      { name: "Ana Silva", email: "ana.silva@email.com", phone: "+51 987 654 324", role: "client" },
      { name: "Roberto Méndez", email: "roberto.mendez@email.com", phone: "+51 987 654 325", role: "client" },
      { name: "Patricia Vargas", email: "patricia.vargas@email.com", phone: "+51 987 654 326", role: "client" },
      { name: "Diego Castillo", email: "diego.castillo@email.com", phone: "+51 987 654 327", role: "client" },
      { name: "Laura Ríos", email: "laura.rios@email.com", phone: "+51 987 654 328", role: "client" },
      { name: "Miguel Ángulo", email: "miguel.angulo@email.com", phone: "+51 987 654 329", role: "client" },
      { name: "Carmen Torres", email: "carmen.torres@email.com", phone: "+51 987 654 330", role: "client" }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password || 'password123', 10);
      
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO users (
            name, email, phone, password, role, 
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          user.name,
          user.email,
          user.phone,
          hashedPassword,
          user.role
        ], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    console.log(`✅ ${users.length} usuarios insertados`);

    // 将 3 家餐厅分配给默认商家账号（其余餐厅为平台自营）
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE restaurants SET owner_id = (SELECT id FROM users WHERE email = 'owner@restaurant.com')
         WHERE name IN ('La Mar', 'Sakura Sushi Bar', 'Trattoria Italiana')`,
        (err) => {
          if (err) reject(err);
          else {
            console.log('🏪 已将 3 家餐厅分配给默认商家账号');
            resolve();
          }
        }
      );
    });

    // 4. Insertar algunas reservas de ejemplo
    console.log('\n📅 Insertando reservas de ejemplo...');
    const reservations = [
      {
        restaurant_id: 1,
        table_id: 1,
        user_id: 1,
        reservation_date: '2026-03-13',
        reservation_time: '19:00',
        party_size: 2,
        occasion: '生日',
        special_requests: '如可能请安排靠窗桌位',
        status: 'confirmed',
        confirmation_code: 'LA-MAR-20260313-001'
      },
      {
        restaurant_id: 2,
        table_id: 13,
        user_id: 2,
        reservation_date: '2026-03-14',
        reservation_time: '20:00',
        party_size: 4,
        occasion: '浪漫约会',
        special_requests: '其中一位客人需要素食',
        status: 'confirmed',
        confirmation_code: 'SAKURA-20260314-002'
      },
      {
        restaurant_id: 3,
        table_id: 23,
        user_id: 3,
        reservation_date: '2026-03-15',
        reservation_time: '13:00',
        party_size: 6,
        occasion: '家庭聚餐',
        special_requests: '需要儿童座椅',
        status: 'confirmed',
        confirmation_code: 'TRATT-20260315-003'
      }
    ];

    for (const reservation of reservations) {
      const reservationId = await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO reservations (
            restaurant_id, table_id, user_id, reservation_date,
            reservation_time, party_size, occasion, special_requests,
            status, confirmation_code, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          reservation.restaurant_id,
          reservation.table_id,
          reservation.user_id,
          reservation.reservation_date,
          reservation.reservation_time,
          reservation.party_size,
          reservation.occasion,
          reservation.special_requests,
          reservation.status,
          reservation.confirmation_code
        ], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });

      // Insertar en el historial
      await new Promise((resolveHistory) => {
        db.run(`
          INSERT INTO reservation_history (
            reservation_id, status, notes, created_at
          ) VALUES (?, ?, ?, datetime('now'))
        `, [
          reservationId,
          reservation.status,
          reservation.status === 'cancelled' ? 'Cancelada por el cliente' : null
        ], function(err) {
          if (err) console.error('Error insertando historial:', err);
          resolveHistory();
        });
      });
    }

    console.log(`✅ ${reservations.length} reservas insertadas`);

    console.log('\n🎉 Sistema inicializado exitosamente!');
    console.log('\n📊 Resumen de datos insertados:');
    console.log(`   • Restaurantes: ${restaurants.length}`);
    console.log(`   • Mesas: ${tables.length}`);
    console.log(`   • Usuarios: ${users.length}`);
    console.log(`   • Reservas: ${reservations.length}`);
    console.log('\n🔑 Credenciales de prueba:');
    console.log('   • Email: carlos.rodriguez@email.com');
    console.log('   • Contraseña: password123');
    console.log('   • Email: maria.gonzalez@email.com');
    console.log('   • Contraseña: password123');
    console.log('   • ... (y así para todos los usuarios)');
    console.log('\n🚀 El sistema está listo para usar!');
    
  } catch (error) {
    console.error('❌ Error inicializando sistema:', error);
  } finally {
    db.close();
  }
}

initializeCompleteSystem();
