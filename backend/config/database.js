const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/restaurant.db');

// Ensure database directory exists
const fs = require('fs');
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error al conectar con SQLite:', err.message);
  } else {
    console.log('✅ Conectado a SQLite');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize database tables
async function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          role VARCHAR(20) DEFAULT 'client',
          avatar VARCHAR(255),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Restaurants table
      db.run(`
        CREATE TABLE IF NOT EXISTS restaurants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          address VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          email VARCHAR(100),
          capacity INTEGER NOT NULL,
          opening_time VARCHAR(5) NOT NULL,
          closing_time VARCHAR(5) NOT NULL,
          cuisine_type VARCHAR(50),
          rating DECIMAL(3,2) DEFAULT 0.00,
          image VARCHAR(255),
          status VARCHAR(20) DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tables table
      db.run(`
        CREATE TABLE IF NOT EXISTS tables (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          restaurant_id INTEGER NOT NULL,
          table_number VARCHAR(10) NOT NULL,
          capacity INTEGER NOT NULL,
          min_capacity INTEGER DEFAULT 1,
          location VARCHAR(50),
          table_type VARCHAR(20) DEFAULT 'standard',
          status VARCHAR(20) DEFAULT 'available',
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
        )
      `);

      // Reservations table
      db.run(`
        CREATE TABLE IF NOT EXISTS reservations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          restaurant_id INTEGER NOT NULL,
          table_id INTEGER NOT NULL,
          reservation_date DATE NOT NULL,
          reservation_time TIME NOT NULL,
          party_size INTEGER NOT NULL,
          occasion VARCHAR(50),
          special_requests TEXT,
          status VARCHAR(20) DEFAULT 'pending',
          deposit_amount DECIMAL(10,2) DEFAULT 0.00,
          total_amount DECIMAL(10,2) DEFAULT 0.00,
          payment_method VARCHAR(50),
          payment_notes TEXT,
          payment_date DATETIME,
          confirmation_code VARCHAR(10) UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
          FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
        )
      `);

      // Reservation status history
      db.run(`
        CREATE TABLE IF NOT EXISTS reservation_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reservation_id INTEGER NOT NULL,
          status VARCHAR(20) NOT NULL,
          notes TEXT,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Base de datos inicializada correctamente');
          resolve();
        }
      });
    });
  });
}

// Create default admin user
async function createDefaultAdmin() {
  return new Promise((resolve, reject) => {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    db.run(
      `INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      ['Administrador', 'admin@restaurant.com', hashedPassword, 'admin'],
      function(err) {
        if (err) {
          reject(err);
        } else {
          if (this.changes > 0) {
            console.log('👤 Administrador por defecto creado');
          }
          resolve();
        }
      }
    );
  });
}

module.exports = {
  db,
  initDatabase,
  createDefaultAdmin
};
