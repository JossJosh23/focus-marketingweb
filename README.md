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
- `APP_URL`: URL pública sin barra final, por ejemplo `https://focugex.playorch.tech`.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` y `SMTP_FROM`: servicio de correo para recuperación de contraseña y avisos de dispositivos nuevos.

Al arrancar, la aplicación crea las tablas de usuarios, sesiones y recuperación de contraseña. Las contraseñas se guardan con hash bcrypt, las sesiones pueden revocarse y la cookie es `HttpOnly`.

## Dokploy

1. Crea una base de datos PostgreSQL en Dokploy.
2. Copia su URL de conexión interna en `DATABASE_URL` dentro de **Environment** de la aplicación.
3. Añade `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DATABASE_SSL=false`, `PORT=3000` y `APP_URL=https://focugex.playorch.tech`.
4. Configura las variables `SMTP_*` para habilitar los correos. Sin SMTP, el login funciona pero no se enviarán enlaces de recuperación ni avisos de dispositivos nuevos.
5. Selecciona **Dockerfile**, ruta `Dockerfile`, contexto `/` y deja vacío **Docker Build Stage**.
6. En el dominio usa **Container Port 3000**, Path `/` e Internal Path `/`.
7. Despliega nuevamente.

`GET /health` confirma tanto el estado del servidor como la conexión con PostgreSQL.
