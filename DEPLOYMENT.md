# Guía de Despliegue en Railway

Este proyecto incluye un frontend Next.js y un backend Spring Boot que pueden desplegarse en Railway.

## Prerequisitos

1. Cuenta en [Railway.app](https://railway.app)
2. Proyecto con código en GitHub (recomendado)

## Opción 1: Despliegue con Railway CLI

### 1. Instalar Railway CLI

\`\`\`bash
npm install -g @railway/cli
\`\`\`

### 2. Iniciar sesión

\`\`\`bash
railway login
\`\`\`

### 3. Desplegar Backend

\`\`\`bash
cd backend
railway init
railway up
\`\`\`

### 4. Agregar PostgreSQL

En el dashboard de Railway:
- Click en "New" → "Database" → "PostgreSQL"
- Railway automáticamente configurará `DATABASE_URL`

### 5. Configurar Variables de Entorno del Backend

En Railway dashboard → Variables:

\`\`\`
JWT_SECRET=tu-clave-secreta-super-segura-minimo-256-bits
JWT_EXPIRATION=86400000
CORS_ALLOWED_ORIGINS=https://tu-frontend.railway.app
DDL_AUTO=update
HIBERNATE_DIALECT=org.hibernate.dialect.PostgreSQLDialect
LOG_LEVEL=INFO
\`\`\`

### 6. Desplegar Frontend

\`\`\`bash
cd ..
railway init
railway up
\`\`\`

### 7. Configurar Variables de Entorno del Frontend

En Railway dashboard → Variables:

\`\`\`
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api
NEXT_PUBLIC_APP_URL=https://tu-frontend.railway.app
\`\`\`

## Opción 2: Despliegue desde GitHub

### 1. Subir código a GitHub

\`\`\`bash
git add .
git commit -m "Add Railway deployment config"
git push origin main
\`\`\`

### 2. Crear Proyecto en Railway

1. Ve a [Railway.app](https://railway.app)
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Elige tu repositorio

### 3. Configurar Servicios

Railway detectará automáticamente los Dockerfiles. Necesitas crear 2 servicios:

**Servicio 1: Backend**
- Root Directory: `/backend`
- Variables de entorno: (ver arriba)

**Servicio 2: Frontend**
- Root Directory: `/`
- Variables de entorno: (ver arriba)

**Servicio 3: PostgreSQL**
- Agregar desde "New" → "Database" → "PostgreSQL"

## Opción 3: Docker Local

Para probar localmente con Docker:

\`\`\`bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
\`\`\`

Accede a:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080/api
- Database: localhost:5432

## Comandos Útiles de Railway

\`\`\`bash
# Ver logs en tiempo real
railway logs

# Ver variables de entorno
railway variables

# Abrir en navegador
railway open

# Conectar a la base de datos
railway connect postgres
\`\`\`

## Troubleshooting

### Error de conexión a la base de datos

Verifica que `DATABASE_URL` esté configurado correctamente en Railway.

### Error de CORS

Asegúrate de que `CORS_ALLOWED_ORIGINS` incluya la URL de tu frontend de Railway.

### Error de build en Frontend

Verifica que el `Dockerfile` use Node 20+ y que todas las dependencias estén en `package.json`.

### Error de build en Backend

Asegúrate de que Java 17 esté configurado y que todas las dependencias de Gradle estén correctas.

## Seguridad en Producción

1. **Cambiar JWT_SECRET**: Usa un secreto fuerte y único
2. **Configurar CORS**: Solo permitir tu dominio frontend
3. **Variables de entorno**: NUNCA commitear archivos `.env` con secretos
4. **DDL_AUTO**: Usar `update` o `validate` en producción, no `create-drop`
5. **Logs**: Configurar `LOG_LEVEL=WARN` o `ERROR` en producción

## Monitoreo

Railway proporciona:
- Métricas de CPU y memoria
- Logs en tiempo real
- Alertas de error
- Reinicio automático en caso de fallos
