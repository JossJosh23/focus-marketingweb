# FOCUGEX

Aplicación web con frontend React, backend Express, autenticación segura y PostgreSQL.

## Desarrollo local

1. Copia `.env.example` como `.env` y configura PostgreSQL.
2. Instala las dependencias y compila el frontend:

```bash
npm install
npm run build
npm start
```

Para desarrollar la interfaz ejecuta `npm run dev` en otra terminal. Vite enviará `/api` al backend del puerto 3000.

## Variables de entorno

- `DATABASE_URL`: conexión completa a PostgreSQL.
- `DATABASE_SSL`: usa `true` cuando el proveedor exige SSL.
- `JWT_SECRET`: cadena aleatoria de al menos 32 caracteres.
- `ADMIN_EMAIL`: correo del primer administrador.
- `ADMIN_PASSWORD`: contraseña inicial de al menos 10 caracteres.
- `PORT`: `3000`.

Al arrancar, la aplicación crea la tabla `users` y el administrador inicial si todavía no existe. Las contraseñas se guardan con hash bcrypt y la sesión utiliza una cookie `HttpOnly`.

## Dokploy

1. Crea una base de datos PostgreSQL en Dokploy.
2. Copia su URL de conexión interna en `DATABASE_URL` dentro de **Environment** de la aplicación.
3. Añade `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DATABASE_SSL=false` y `PORT=3000`.
4. Selecciona **Dockerfile**, ruta `Dockerfile`, contexto `/` y deja vacío **Docker Build Stage**.
5. En el dominio usa **Container Port 3000**, Path `/` e Internal Path `/`.
6. Despliega nuevamente.

`GET /health` confirma tanto el estado del servidor como la conexión con PostgreSQL.
