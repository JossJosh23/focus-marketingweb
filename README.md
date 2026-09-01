# Focus Marketing Web

Frontend del acceso privado de MarketingYorch, construido con React y Vite.

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Despliegue en Dokploy

La aplicación incluye un `Dockerfile` de producción. En Dokploy:

1. Selecciona **Dockerfile** como tipo de compilación.
2. Usa `Dockerfile` como ruta del archivo.
3. Configura el puerto interno como `80`.
4. No configures un comando de inicio personalizado; Nginx ya está definido.
5. Asocia el dominio en la pestaña **Domains** y habilita HTTPS.
6. Ejecuta un nuevo despliegue después de subir estos archivos a GitHub.

El endpoint `/health` responde con `200 OK` para las comprobaciones de salud.
