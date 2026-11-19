# Prueba Técnica Full Stack

Backend NestJS + MongoDB (JWT, Swagger) y frontend React + TypeScript + Zustand.

## Requisitos
Node 20+ y MongoDB corriendo (local o Atlas).

## Backend
```bash
cd backend
cp .env.example .env     # edita MONGO_URI y JWT_SECRET
npm install
npm run start:dev        # http://localhost:3000/api
npm test                 # pruebas unitarias
```
Swagger: http://localhost:3000/docs (botón "Authorize" con el token de `/api/auth/login`).

Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, y `GET|POST /api/products`, `GET|PATCH|DELETE /api/products/:id` (requieren JWT). Listado con `?page=1&limit=10&search=texto`.

## Frontend
```bash
cd frontend
npm install
npm run dev              # http://localhost:5173 (proxy a /api)
npm test && npm run build
```
Regístrate en la pantalla inicial y luego gestiona productos.

## Decisiones
- Capas: controller → service → modelo; DTOs con `class-validator` (whitelist).
- Seguridad: bcrypt, JWT con expiración, helmet, CORS configurable, rate limiting (5 intentos/min en login), escape de regex en la búsqueda, validación de ObjectId.
- Frontend: estado en Zustand (auth y productos), paginación y búsqueda en servidor con debounce, errores traducidos a mensajes amigables, tabla que pasa a tarjetas en móvil.
