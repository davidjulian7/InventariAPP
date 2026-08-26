# CRM y POS para Retail

Sistema de punto de venta, inventario y CRM para retail (RetailOS). Incluye dashboard, POS, inventario,
reportes exportables y un asistente con IA. Diseño original en Figma:
https://www.figma.com/design/C2uZMYlUams7kQZ0pRz6S8/CRM-y-POS-para-Retail.

## Requisitos

- Node.js 22 o superior (usa el módulo experimental `node:sqlite`).
- npm.

## Puesta en marcha

1. Instala las dependencias:

   ```
   npm i
   ```

2. (Opcional) Copia `.env.example` a `.env` si quieres configurar una API Key de Gemini para el
   asistente de IA, o cambiar la contraseña del usuario semilla. Sin este paso la app funciona
   igual, solo el asistente de IA mostrará un mensaje pidiendo la key.

3. Levanta la app (API + frontend juntos):

   ```
   npm run dev
   ```

   Esto arranca dos procesos en paralelo:
   - `api`: servidor Express en `http://localhost:4000` (base de datos SQLite local).
   - `web`: servidor de desarrollo de Vite en `http://localhost:5173`.

4. Abre `http://localhost:5173` en el navegador.

La base de datos SQLite (`server/inventari.db`) se crea y siembra automáticamente la primera vez
que arranca el servidor `api`. El usuario administrador de prueba es:

- **Email:** `admin@elroble.mx`
- **Contraseña:** `admin123` (o el valor de `DEV_ADMIN_PASSWORD` si lo configuraste en `.env`)

## Otros comandos

- `npm run build` — build de producción del frontend (carpeta `dist/`).
- `npm run dev:web` — solo el frontend (requiere la API corriendo aparte para que funcione).
- `npm run dev:server` — solo la API.
- `npm run db:seed` — vuelve a sembrar la base de datos manualmente (normalmente no es necesario).

Para reiniciar los datos desde cero, borra `server/inventari.db` y vuelve a arrancar `npm run dev`.
