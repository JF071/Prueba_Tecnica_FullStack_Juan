# AgroMarket Admin · Prueba técnica Full Stack

Panel administrativo del **catálogo de productos de un marketplace de agroinsumos**, pensado para el contexto de una plataforma como Croper: muchos proveedores venden fertilizantes, semillas y agroquímicos a productores del campo.

- **Backend:** NestJS + MongoDB (Mongoose), JWT y Swagger.
- **Frontend:** React + TypeScript + Zustand + Tailwind.
- **Base de datos:** MongoDB Atlas (también funciona con MongoDB local).

> Este repositorio contiene los ejercicios 1 y 2. La teoría (ejercicios 3, 4 y 5) y la sección de uso de IA se entregan en un documento PDF aparte.

---

## Funcionalidades

| | |
|---|---|
| **CRUD de productos** | Crear, listar, ver, editar y "eliminar" (despublicar) |
| **Presentaciones de venta** | Cada producto se mide en una **unidad base** (kg, L, und…) y se vende en presentaciones (*Bulto 50 kg*, *Kilo*…), cada una con su factor y precio |
| **Registrar venta** | Vender `N` presentaciones descuenta `N × factor` del stock, de forma **atómica** |
| **Despublicar / volver a publicar** | Eliminación lógica: el producto sale de la tienda pero no se borra |
| **Proveedor** | Cada producto indica qué proveedor del marketplace lo vende |
| **Búsqueda y paginación** | En el servidor, por producto o proveedor, con *debounce* en el frontend |
| **Autenticación** | Registro y login con JWT; todos los endpoints de productos lo exigen |
| **Responsive** | En escritorio se ve una tabla; en celular, tarjetas con menú lateral deslizable |

---

## Cómo ejecutarlo

**Requisitos:** Node 20 o superior y una base MongoDB (Atlas gratis o local).

### Backend
```bash
cd backend
cp .env.example .env     # completa MONGO_URI y JWT_SECRET (instrucciones dentro del archivo)
npm install
npm run start:dev        # API en http://localhost:3000/api
```

### Frontend (en otra terminal)
```bash
cd frontend
npm install
npm run dev              # http://localhost:5173 (Vite redirige /api al backend)
```

Regístrate en la pantalla de inicio y empieza a crear productos.

### Pruebas
```bash
cd backend  && npm test             # 30 pruebas unitarias (Jest)
cd frontend && npm test             # 19 pruebas unitarias (Vitest)
cd frontend && npm run build        # verificación de tipos + build de producción
```

---

## Probar la API

- **Swagger:** http://localhost:3000/docs. Usa el botón *Authorize* con el token que devuelve `/api/auth/login`.
- **Postman:** importa [`docs/postman/AgroMarket.postman_collection.json`](docs/postman/AgroMarket.postman_collection.json).
  1. Ajusta las variables `email` y `password` de la colección con una cuenta registrada.
  2. Ejecuta **Login**: el token se guarda solo.
  3. Sigue en orden. **Crear producto** guarda los ids que usan las peticiones siguientes.
  4. La carpeta *Casos de error* muestra las validaciones y respuestas 400, 401, 409 y 429.

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Crear cuenta |
| `POST` | `/api/auth/login` | Obtener JWT (máx. 5 intentos/min por IP) |
| `GET` | `/api/products?page&limit&search&status` | Listar. `status=active` (publicados, por defecto) o `inactive` (despublicados) |
| `GET` | `/api/products/:id` | Ver uno |
| `POST` | `/api/products` | Crear |
| `PATCH` | `/api/products/:id` | Editar (solo los campos enviados; solo productos publicados) |
| `DELETE` | `/api/products/:id` | **Despublicar** (eliminación lógica) |
| `PATCH` | `/api/products/:id/reactivar` | Volver a publicar |
| `POST` | `/api/products/:id/salidas` | Registrar venta: `{ presentationId, quantity }` |

Todos los endpoints de `/products` requieren `Authorization: Bearer <token>`.

### Ejemplo de producto
```json
{
  "name": "Urea granulada 46%",
  "supplier": "Agroinsumos del Valle S.A.S.",
  "category": "fertilizantes",
  "baseUnit": "kg",
  "stock": 1250,
  "presentations": [
    { "name": "Bulto 50 kg", "factor": 50, "price": 145000 },
    { "name": "Kilo",        "factor": 1,  "price": 3400 }
  ]
}
```
Vender `2 × Bulto 50 kg` descuenta `100 kg`. En la tabla se muestra `1.150 kg ≈ 23 × Bulto 50 kg`.

---

## Decisiones técnicas

### Modelo de datos
- **Unidad base y presentaciones.** En el agro un mismo producto se vende en varias presentaciones. El inventario se guarda en una sola unidad (la base) y cada presentación dice cuántas unidades base contiene (`factor`). Así se sabe exactamente cuánto descontar al vender, y cada presentación puede tener su propio precio (por ejemplo, descuento por volumen).
- **Presentaciones embebidas** dentro del producto: siempre se leen junto con él, que es el caso de uso natural de los subdocumentos en MongoDB.
- **Eliminación lógica (`active: false`).** Borrar físicamente deja pedidos e historial apuntando a algo que no existe. `DELETE` se mantiene para respetar el contrato REST del CRUD, pero solo despublica. Los documentos antiguos sin el campo cuentan como publicados (`{ active: { $ne: false } }`).
- **Descuento atómico de stock.** La venta usa un único `findOneAndUpdate` con el filtro `stock >= cantidad` y `$inc: { stock: -cantidad }`. Si dos ventas llegan al mismo tiempo, Mongo las serializa sobre el documento y el stock nunca queda negativo. Si no alcanza, responde **409** con el detalle. Las cantidades se redondean a 3 decimales para evitar errores de coma flotante.

### Backend
- Capas **controller → service → modelo**, un módulo por dominio (`auth`, `users`, `products`).
- **DTOs con `class-validator`**:
  - `whitelist` + `forbidNonWhitelisted` rechazan campos extra, lo que evita *mass assignment*: un cliente no puede enviar `active` ni otros campos internos.
  - Los textos se recortan antes de validar.
  - Las presentaciones se validan una por una.
- **Filtro global de errores de Mongo:** un índice único violado responde 409, un error de validación responde 400 y cualquier otro responde 500 sin exponer detalles internos.
- **`ParseObjectIdPipe`** responde 400 si el id no tiene formato válido, en lugar de un error de *cast*.

### Seguridad
- Contraseñas con **bcrypt**. El mismo mensaje para correo o clave incorrectos no revela cuál de los dos falló.
- **JWT** con expiración; el secreto vive en variables de entorno.
- **Rate limiting:** 100 peticiones/min global y **5 intentos/min en login y registro** (anti fuerza bruta → 429).
- **helmet** (cabeceras HTTP seguras).
- **CORS con lista blanca:** si no se configura, solo permite el frontend local, nunca todos los orígenes.
- **Búsqueda protegida contra inyección:** el texto se escapa antes de usarlo en el `$regex`.
- **Credenciales fuera del código:** `.env` está en `.gitignore`.

### Frontend
- **Zustand** con dos stores: `authStore` (sesión) y `productStore` (lista, paginación, búsqueda, filtro, avisos).
  - Al cerrar sesión, el store de productos se limpia automáticamente (suscripción al de auth).
  - Cada carga lleva un número y se **descartan las respuestas viejas**, que es una condición de carrera al paginar rápido.
- **Manejo de errores:** `friendlyMessage()` traduce los códigos HTTP a mensajes claros. Los errores de un formulario se muestran **dentro del modal**, no detrás.
- **UX:**
  - Confirmación propia antes de despublicar.
  - Los modales se cierran con Esc.
  - Los avisos de éxito se cierran solos; los de error se quedan hasta que el usuario los cierre.
  - El resumen de la venta (cuánto se descuenta, cuánto queda, total) se ve antes de confirmar.
- **Organización:** `api.ts` (HTTP), `store/` (estado), `components/` (pantallas), `components/ui/` (piezas reutilizables: `Modal`, `IconButton`), `hooks/` y `units.ts` (unidades y formatos).
- **Diseño:** Tailwind con un sistema de tokens (colores HSL, tipografía Plus Jakarta Sans), igual al que uso en mis proyectos.

---

## Estructura

```
backend/src
├── auth/        registro, login, estrategia y guard JWT
├── users/       esquema y servicio de usuarios
├── products/    controlador, servicio, esquema y DTOs (producto, venta)
├── common/      filtro de errores Mongo, pipe de ObjectId, CORS
└── main.ts      helmet, CORS, ValidationPipe, Swagger
frontend/src
├── api.ts       cliente HTTP y mensajes amigables
├── store/       Zustand: authStore, productStore
├── components/  páginas, formularios, layout y ui reutilizable
├── hooks/       useEscape
└── units.ts     unidades base, formatos y equivalencias
docs/
└── postman/     colección para probar la API
```

---

## Mejoras futuras

Quedaron fuera para mantener el alcance de la prueba, pero el diseño las permite:

- **Historial de movimientos (kárdex):** guardar cada venta o entrada (quién, cuándo, cuánto) en su propia colección, y hacerlo en una transacción junto con el descuento de stock.
- **Proveedor como entidad propia** (NIT, contacto, calificación), con referencia desde el producto.
- **Roles y permisos:** administrador del marketplace vs. proveedor que solo gestiona sus productos.
- **Sesión más segura:** token en cookie `httpOnly` + *refresh token*, en vez de `localStorage`.
- **Pruebas e2e** (Supertest + mongodb-memory-server) y **CI** en GitHub Actions.
- **Docker Compose** para levantar API, frontend y Mongo con un comando.
