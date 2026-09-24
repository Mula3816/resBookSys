const { initDatabase, createDefaultAdmin } = require('../config/database');

async function initialize() {
  try {
    console.log('🔧 Inicializando base de datos...');
    await initDatabase();
    await createDefaultAdmin();
    console.log('✅ Base de datos inicializada exitosamente');
    console.log('👤 Administrador por defecto:');
    console.log('   Email: admin@restaurant.com');
    console.log('   Contraseña: admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

initialize();
