# Restaurant Booking System

Sistema completo de reservas de restaurantes con panel de administración y gestión de mesas.

## 🚀 Características

### Frontend (React + TailwindCSS)
- 📱 **Diseño responsivo** con TailwindCSS
- 🔐 **Autenticación** de usuarios (JWT)
- 🍽️ **Catálogo de restaurantes** con filtros avanzados
- 📅 **Sistema de reservas** con disponibilidad en tiempo real
- 👤 **Panel de usuario** para gestionar reservas
- 🛠️ **Panel de administración** completo
- 📊 **Dashboard** con estadísticas en tiempo real

### Backend (Node.js + Express + SQLite)
- 🗄️ **Base de datos SQLite** con migraciones
- 🔒 **Middleware de autenticación** y autorización
- 📡 **API RESTful** completa
- 🔄 **Validación de datos** con express-validator
- 📈 **Sistema de disponibilidad** inteligente
- 🔄 **Gestión de estados** de reservas

### Funcionalidades Principales
- ✅ **Registro y login** de usuarios
- ✅ **Gestión de restaurantes** (CRUD completo)
- ✅ **Sistema de mesas** con capacidad y ubicación
- ✅ **Disponibilidad dinámica** basada en horarios del restaurante
- ✅ **Bloqueo inteligente** de mesas (ventana de 2 horas)
- ✅ **Historial de reservas** con seguimiento
- ✅ **Estadísticas** del sistema
- ✅ **Filtros avanzados** de búsqueda

## 🛠️ Instalación

### Prerrequisitos
- Node.js (v18+)
- npm o yarn

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## 📁 Estructura del Proyecto

```
restaurant-booking-system/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuración de SQLite
│   ├── middleware/
│   │   └── auth.js              # Middleware de autenticación
│   ├── routes/
│   │   ├── auth.js              # Rutas de autenticación
│   │   ├── restaurants.js       # Rutas de restaurantes
│   │   ├── reservations.js      # Rutas de reservas
│   │   ├── users.js             # Rutas de usuarios
│   │   └── tables.js            # Rutas de mesas
│   ├── scripts/
│   │   ├── initDatabase.js      # Inicialización de DB
│   │   └── initializeCompleteSystem.js # Setup completo
│   ├── services/
│   │   └── emailService.js      # Servicio de emails
│   └── server.js               # Servidor principal
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── atoms/           # Componentes atómicos
│   │   │   ├── molecules/       # Componentes moleculares
│   │   │   └── organisms/       # Componentes organismos
│   │   ├── pages/
│   │   │   ├── admin/          # Panel de administración
│   │   │   ├── auth/            # Autenticación
│   │   │   └── public/          # Páginas públicas
│   │   ├── services/
│   │   │   └── api.js           # Cliente HTTP
│   │   └── utils/
│   │       └── auth.js          # Utilidades de auth
│   └── tailwind.config.js
└── README.md
```

## 🔐 Credenciales por Defecto

### Administrador
- **Email**: admin@restaurant.com
- **Password**: admin123

### Usuario de Prueba
- **Email**: user@example.com
- **Password**: user123

## 🎯 Uso

### Para Usuarios
1. **Regístrate** o inicia sesión
2. **Explora restaurantes** con filtros
3. **Verifica disponibilidad** para tu fecha y grupo
4. **Selecciona horario** y mesa disponibles
5. **Confirma reserva** con detalles adicionales

### Para Administradores
1. **Inicia sesión** como administrador
2. **Gestiona restaurantes** (crear, editar, eliminar)
3. **Configura mesas** por restaurante
4. **Monitorea reservas** y estadísticas
5. **Gestiona usuarios** y permisos

## 🔄 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Perfil de usuario

### Restaurantes
- `GET /api/restaurants` - Listar restaurantes
- `GET /api/restaurants/:id` - Detalle de restaurante
- `POST /api/restaurants` - Crear restaurante (admin)
- `PUT /api/restaurants/:id` - Actualizar restaurante (admin)
- `DELETE /api/restaurants/:id` - Eliminar restaurante (admin)
- `GET /api/restaurants/:id/availability` - Verificar disponibilidad
- `GET /api/restaurants/stats` - Estadísticas (admin)

### Reservas
- `GET /api/reservations` - Listar reservas (usuario/admin)
- `POST /api/reservations` - Crear reserva
- `PUT /api/reservations/:id` - Actualizar reserva
- `DELETE /api/reservations/:id` - Cancelar reserva

### Mesas
- `GET /api/tables` - Listar mesas (admin)
- `POST /api/tables` - Crear mesa (admin)
- `PUT /api/tables/:id` - Actualizar mesa (admin)
- `DELETE /api/tables/:id` - Eliminar mesa (admin)

## 🎨 Características Técnicas

### Frontend
- **React 18** con hooks funcionales
- **TailwindCSS** para estilos
- **React Hook Form** para formularios
- **React Router** para navegación
- **Axios** para peticiones HTTP
- **Toast notifications** para feedback

### Backend
- **Node.js + Express**
- **SQLite** como base de datos
- **bcrypt** para hashing de passwords
- **jsonwebtoken** para autenticación
- **express-validator** para validación
- **cors** para跨域

### Seguridad
- 🔐 **JWT tokens** para autenticación
- 🛡️ **bcrypt** para passwords
- 🔒 **Middleware de autorización**
- ✅ **Validación de inputs**
- 🚫 **CORS configurado**

## 📊 Sistema de Disponibilidad

El sistema calcula la disponibilidad considerando:
- **Horarios del restaurante** (apertura/cierre)
- **Capacidad de mesas** vs tamaño del grupo
- **Reservas existentes** con ventana de 2 horas
- **Estado de mesas** (disponible/ocupada)

### Ejemplo de Flujo
1. Usuario selecciona restaurante y fecha
2. Sistema consulta horarios del restaurante
3. Genera slots de 30 minutos dentro del horario
4. Filtra slots con conflictos de reservas
5. Muestra horarios y mesas disponibles

## 🚀 Despliegue

### Variables de Entorno

#### Backend (.env)
```
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secret-key
DB_PATH=./database/restaurant.db
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Docker (Opcional)
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contribuir

1. **Fork** el proyecto
2. **Crear** feature branch
3. **Hacer commit** de cambios
4. **Push** al branch
5. **Crear** Pull Request

## 📝 Licencia

Este proyecto está bajo licencia MIT. 

## 📞 Contacto

Para soporte o preguntas, contacta a [jesusmelvillemm@gmail.com]

---

👥 Autores

Jesus Melville - [GitHub](https://github.com/JesusMelville)
Marlon Levano - [GitHub](https://github.com/MarlonNovaro)
---

**Hecho con ❤️ para restaurantes modernos**
