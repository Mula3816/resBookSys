# 🚀 Instrucciones para Subir a GitHub

## 1. Crear Repositorio en GitHub

1. Ve a [GitHub](https://github.com)
2. Inicia sesión o crea una cuenta
3. Haz clic en "+" → "New repository"
4. Configura el repositorio:
   - **Repository name**: `restaurant-booking-system`
   - **Description**: `Sistema completo de reservas de restaurantes con React y Node.js`
   - **Visibility**: Public o Private (como prefieras)
   - **NO marques** "Add a README file" (ya tenemos uno)
   - **NO marques** "Add .gitignore" (ya tenemos uno)
   - **NO marques** "Choose a license" (puedes agregarlo después)
5. Haz clic en "Create repository"

## 2. Conectar Local con GitHub

El repositorio ya está inicializado localmente. Solo necesitas conectarlo:

```bash
# Agregar el remote de GitHub (reemplaza TU_USERNAME)
git remote add origin https://github.com/TU_USERNAME/restaurant-booking-system.git

# Verificar el remote
git remote -v

# Push al repositorio remoto
git push -u origin master
```

## 3. Verificar en GitHub

1. Ve a tu repositorio en GitHub
2. Deberías ver todos los archivos
3. El README.md debería aparecer en la página principal

## 📋 Estructura Final del Proyecto

```
restaurant-booking-system/
├── 📁 backend/                 # Backend Node.js
│   ├── 📁 config/              # Configuración de DB
│   ├── 📁 middleware/          # Autenticación
│   ├── 📁 routes/              # API endpoints
│   ├── 📁 scripts/             # Scripts de DB
│   ├── 📁 services/            # Servicios
│   ├── 📄 .env.example         # Variables de entorno ejemplo
│   ├── 📄 package.json         # Dependencias
│   └── 📄 server.js            # Servidor principal
├── 📁 frontend/                # Frontend React
│   ├── 📁 public/              # Archivos estáticos
│   ├── 📁 src/                 # Código fuente
│   │   ├── 📁 components/       # Componentes React
│   │   ├── 📁 pages/           # Páginas
│   │   ├── 📁 services/        # Servicios API
│   │   └── 📁 utils/           # Utilidades
│   ├── 📄 package.json         # Dependencias
│   └── 📄 tailwind.config.js   # Configuración Tailwind
├── 📄 .gitignore               # Archivos ignorados por Git
├── 📄 README.md                # Documentación del proyecto
└── 📄 package.json             # Configuración raíz
```

## 🗂️ Archivos Eliminados (Limpieza)

### Scripts de Desarrollo Eliminados:
- ❌ checkTables.js
- ❌ checkUsers.js  
- ❌ createAdmin.js
- ❌ createTables.js
- ❌ debug_register.js
- ❌ improvedAvailability.js
- ❌ test_register.ps1
- ❌ migrate_payment_fields.js
- ❌ check_payments.js
- ❌ check_table.js

### Scripts de Datos de Prueba Eliminados:
- ❌ insertSampleData.js
- ❌ insertSampleReservations.js
- ❌ insertSampleUsers.js
- ❌ resetAndInitialize.js

## 🎯 Qué Quedó en el Proyecto

### Backend (15 archivos):
- ✅ Configuración de base de datos
- ✅ Middleware de autenticación
- ✅ Rutas API completas
- ✅ Scripts de inicialización
- ✅ Servicios de email
- ✅ Servidor principal

### Frontend (47 archivos):
- ✅ Componentes atómicos, moleculares y organismos
- ✅ Páginas públicas y de administración
- ✅ Servicios de API
- ✅ Contextos y utilidades
- ✅ Configuración completa

## 🚀 Para Desplegar

### Opción 1: GitHub Pages (Frontend)
```bash
# En el frontend
cd frontend
npm run build
# Subir la carpeta /build a GitHub Pages
```

### Opción 2: Vercel/Netlify
- Conecta tu repositorio de GitHub
- Configura las variables de entorno
- Despliegue automático

### Opción 3: Servidor Propio
- Clona el repositorio
- Instala dependencias en backend y frontend
- Configura variables de entorno
- Inicia los servicios

## 🔐 Variables de Entorno

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key
DB_PATH=./database/restaurant.db
FRONTEND_URL=http://localhost:3001
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
SKIP_PREFLIGHT_CHECK=true
```

## 📊 Estadísticas del Proyecto

- **Total de archivos**: ~67
- **Líneas de código**: ~31,118
- **Tecnologías**: React, Node.js, SQLite, TailwindCSS
- **Características**: 15+ funcionalidades principales

---

🎉 **¡Listo para subir a GitHub!**

El proyecto está limpio, organizado y listo para producción.
