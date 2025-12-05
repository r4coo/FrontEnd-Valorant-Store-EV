# Configuración de Railway para Backend Java

Esta guía te ayudará a configurar Railway para que apunte correctamente a la carpeta `backend/` de tu monorepo.

## Opción 1: Configurar desde Railway Dashboard (Recomendado)

### Paso 1: Crear Nuevo Proyecto en Railway
1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Haz clic en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Busca y selecciona tu repositorio: `tu-usuario/tu-repo`

### Paso 2: Configurar Root Directory
1. Una vez creado el proyecto, ve a **Settings**
2. En la sección **"Source"**, busca **"Root Directory"**
3. Cambia el valor a: `backend`
4. Haz clic en **"Save"**

### Paso 3: Configurar Variables de Entorno
1. Ve a la pestaña **"Variables"**
2. Agrega las siguientes variables:

\`\`\`
DATABASE_URL=postgresql://usuario:password@host:5432/database
JWT_SECRET=tu_secreto_super_seguro_aqui
CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app
PORT=8080
SPRING_PROFILES_ACTIVE=prod
\`\`\`

**Para obtener DATABASE_URL de Neon:**
- Ve a tu proyecto Neon
- Copia el **Connection String** de PostgreSQL
- Pégalo en Railway como `DATABASE_URL`

### Paso 4: Configurar Build
1. Ve a **Settings** → **Deploy**
2. Asegúrate que:
   - **Builder**: Dockerfile
   - **Dockerfile Path**: Dockerfile (relativo a backend/)
   - **Watch Paths**: `backend/**` (opcional, para que solo redepliegue cuando cambie el backend)

### Paso 5: Desplegar
1. Railway detectará el `backend/Dockerfile` automáticamente
2. Haz clic en **"Deploy"** o simplemente haz push a tu repo
3. Railway comenzará a construir y desplegar tu backend

### Paso 6: Obtener URL del Backend
1. Una vez desplegado, ve a **Settings** → **Networking**
2. Haz clic en **"Generate Domain"**
3. Copia la URL generada (ej: `tu-backend.railway.app`)
4. Usa esta URL en Vercel como `NEXT_PUBLIC_API_URL`

---

## Opción 2: Configurar con Railway CLI

### Instalar Railway CLI
\`\`\`bash
npm install -g @railway/cli
railway login
\`\`\`

### Vincular Proyecto
\`\`\`bash
cd backend/
railway link
\`\`\`

### Desplegar
\`\`\`bash
railway up
\`\`\`

### Configurar Variables de Entorno
\`\`\`bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="tu_secreto"
railway variables set CORS_ALLOWED_ORIGINS="https://tu-frontend.vercel.app"
\`\`\`

---

## Opción 3: Configurar Manualmente railway.toml

Si Railway no detecta automáticamente el `backend/`, crea este archivo en la raíz:

**Archivo: `railway.toml`**
\`\`\`toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "backend/Dockerfile"

[deploy]
startCommand = "java -jar app.jar"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
\`\`\`

---

## Verificar que Funciona

### 1. Check de Salud del Backend
\`\`\`bash
curl https://tu-backend.railway.app/actuator/health
\`\`\`

Deberías recibir:
\`\`\`json
{"status":"UP"}
\`\`\`

### 2. Test de API
\`\`\`bash
curl https://tu-backend.railway.app/api/auth/test
\`\`\`

### 3. Logs en Railway
Ve a tu proyecto en Railway → **Deployments** → Click en el deployment actual para ver los logs

---

## Conectar Frontend en Vercel con Backend en Railway

### En Vercel
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://tu-backend.railway.app`
   - **Environments**: Production, Preview, Development
4. Redespliega tu frontend

### Verificar Conexión
El frontend ahora hará llamadas API a:
\`\`\`typescript
// Ejemplo en tu código
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`)
\`\`\`

---

## Estructura Final de Despliegue

\`\`\`
GitHub Repo (monorepo)
├── app/              → Vercel lo despliega (frontend)
├── components/       
├── backend/          → Railway lo despliega (backend)
│   ├── Dockerfile    ← Railway usa este
│   └── src/
└── Dockerfile        → Este es para frontend (Vercel lo ignora)

Railway Config:
- Root Directory: backend
- Dockerfile Path: Dockerfile
- Port: 8080
\`\`\`

---

## Troubleshooting

### Error: "Cannot find Dockerfile"
**Solución**: Asegúrate que Railway tiene configurado:
- Root Directory: `backend`
- O el railway.json/railway.toml apunta correctamente

### Error: "Build failed"
**Solución**: Revisa los logs en Railway. Usualmente es:
- Falta alguna variable de entorno
- El `DATABASE_URL` no es válido
- Errores de compilación de Gradle

### Error: "CORS policy"
**Solución**: Verifica que `CORS_ALLOWED_ORIGINS` en Railway incluya tu URL de Vercel

### Base de datos no conecta
**Solución**: 
- Verifica que `DATABASE_URL` esté correctamente configurado
- Ejecuta los scripts SQL en Neon primero
- Revisa que Neon permita conexiones externas

---

## Ejecutar Scripts SQL en Neon

1. Ve a tu dashboard de Neon
2. Selecciona tu base de datos
3. Abre el **SQL Editor**
4. Copia y pega el contenido de `scripts/03-postgresql-tables.sql`
5. Ejecuta
6. Luego ejecuta `scripts/04-postgresql-seed.sql`

O usa el CLI de psql:
\`\`\`bash
psql $DATABASE_URL < scripts/03-postgresql-tables.sql
psql $DATABASE_URL < scripts/04-postgresql-seed.sql
\`\`\`

---

## Resumen de URLs

- **Frontend**: https://tu-proyecto.vercel.app
- **Backend**: https://tu-backend.railway.app
- **Database**: Neon PostgreSQL (configurado en Railway)

Todas las piezas conectadas y funcionando independientemente.
