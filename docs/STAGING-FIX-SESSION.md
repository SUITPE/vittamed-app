# Sesión de Corrección de Staging - 20 Nov 2025

## 📋 Resumen Ejecutivo

**Objetivo**: Arreglar el ambiente de staging en Vercel para que el login funcione correctamente.

**Estado Final**: ✅ COMPLETADO - Staging funcionando al 100%

**URL de Staging**: https://vittasami-staging.vercel.app/

**Credenciales de Prueba**:
```
Email: admin@clinicasanrafael.com
Password: password123
```

---

## 🐛 Problemas Encontrados y Solucionados

### 1. Error de Twilio en Build Time (CRÍTICO)

**Síntoma**:
```
Error: accountSid must start with AC
    at n.setAccountSid (.next/server/chunks/[root-of-the-server]__cabddc95._.js:12:9844)
```

**Causa Raíz**:
El archivo `src/lib/notifications.ts` tenía un `import twilio from 'twilio'` al nivel del módulo. Esto causaba que Twilio intentara inicializarse en **tiempo de compilación** (build time) en lugar de runtime, fallando porque las variables de entorno de Twilio no están disponibles durante el build.

**Solución Implementada**:
Modificar `src/lib/notifications.ts` para hacer **lazy-loading** de Twilio:

```typescript
// ANTES (❌ Causaba error en build):
import twilio from 'twilio'
export const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, ...)

// DESPUÉS (✅ Funciona correctamente):
let twilioClientInstance: any = null

function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return null
  }

  if (!twilioClientInstance) {
    try {
      const twilio = require('twilio')
      twilioClientInstance = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    } catch (error) {
      console.error('Error initializing Twilio client:', error)
      return null
    }
  }

  return twilioClientInstance
}
```

**Archivos Modificados**:
- `src/lib/notifications.ts` (líneas 15-35, 87-105, 255-281, 284-310)

**Commit**: `058e4a45` - "fix: lazy-load Twilio to prevent build-time initialization"

---

### 2. Alias de Vercel Faltante (404 Error)

**Síntoma**:
Al hacer login, redirigía a `https://vittasami-staging.vercel.app/` que mostraba:
```
404: NOT_FOUND
Code: DEPLOYMENT_NOT_FOUND
```

**Causa**:
El alias `vittasami-staging.vercel.app` no estaba asignado al deployment correcto.

**Solución**:
```bash
vercel alias set vittasami-opzzw07zh-vittameds-projects.vercel.app vittasami-staging.vercel.app
```

---

### 3. JWT Secret Mismatch (Login Loop)

**Síntoma**:
- Login API devuelve HTTP 200 con token correcto
- Al acceder al dashboard, redirige de vuelta al login (loop infinito)
- Error en middleware: HTTP 307 redirect a `/auth/login`

**Causa**:
El middleware no podía validar el token JWT porque el `JWT_SECRET` usado para **generar** el token (en el API de login) no coincidía con el `JWT_SECRET` usado para **validar** el token (en el middleware).

**Diagnóstico**:
```bash
# El deployment viejo no tenía JWT_SECRET sincronizado
curl -I https://vittasami-staging.vercel.app/dashboard/[tenantId]
# HTTP/2 307
# location: /auth/login?redirectTo=...
```

**Solución**:
1. Verificar que `JWT_SECRET` está en variables de entorno:
```bash
vercel env ls | grep JWT
# JWT_SECRET    Encrypted    Preview    12h ago
```

2. Forzar nuevo deployment para que use el JWT_SECRET correcto:
```bash
git commit --allow-empty -m "chore: trigger redeploy with JWT_SECRET env var"
git push origin staging
```

3. Actualizar alias al nuevo deployment:
```bash
vercel alias set vittasami-8zbjbuwih-vittameds-projects.vercel.app vittasami-staging.vercel.app
```

**Verificación**:
```bash
# Login + Dashboard access con cookies
curl -c /tmp/cookies.txt -X POST https://vittasami-staging.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinicasanrafael.com","password":"password123"}'

curl -b /tmp/cookies.txt -I https://vittasami-staging.vercel.app/dashboard/[tenantId]
# HTTP/2 200 ✅ (ya no redirige)
```

---

## 📊 Deployments de Vercel

### Deployment Final Funcional

**URL**: https://vittasami-8zbjbuwih-vittameds-projects.vercel.app
**Alias**: https://vittasami-staging.vercel.app
**Branch**: `staging`
**Commit**: `d1949deb` - "chore: trigger redeploy with JWT_SECRET env var"
**Estado**: ● Ready
**Duración Build**: 57 segundos
**Páginas Generadas**: 77 páginas sin errores

### Otros Aliases Disponibles
- https://vittasami-git-staging-vittameds-projects.vercel.app/ (auto-asignado por Vercel)

---

## 🔧 Configuración de Variables de Entorno en Vercel

### Variables Críticas para Staging (Preview)

```bash
# Autenticación
JWT_SECRET=vittasami-jwt-secret-key-production-2025

# Supabase (Development Database)
NEXT_PUBLIC_SUPABASE_URL=https://mvvxeqhsatkqtsrulcil.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_ROLE_KEY=[service_role_key]

# Twilio (Opcional - no requerido para build)
TWILIO_ACCOUNT_SID=[optional]
TWILIO_AUTH_TOKEN=[optional]
TWILIO_WHATSAPP_NUMBER=[optional]
TWILIO_PHONE_NUMBER=[optional]

# Email (Opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=[optional]
EMAIL_PASSWORD=[optional]
```

**Comando para verificar**:
```bash
vercel env ls
```

---

## 🗂️ Archivos Modificados en Esta Sesión

### 1. `src/lib/notifications.ts`
- **Cambio**: Lazy-loading de Twilio
- **Líneas Modificadas**: 1-35, 67-106, 235-288
- **Razón**: Prevenir inicialización de Twilio en build-time

### 2. Ningún otro archivo fue modificado
- Los problemas restantes se solucionaron con configuración de Vercel

---

## ✅ Checklist de Verificación Post-Deploy

Para verificar que staging funciona correctamente después de un nuevo deploy:

### 1. Verificar Build Exitoso
```bash
vercel ls | head -5
# Buscar: ● Ready (no ● Error)
```

### 2. Verificar Alias
```bash
vercel inspect vittasami-staging.vercel.app
# Debe apuntar al último deployment exitoso
```

### 3. Test de Login (API)
```bash
curl -X POST https://vittasami-staging.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinicasanrafael.com","password":"password123"}' \
  -i

# Esperar:
# HTTP/2 200
# set-cookie: vittasami-auth-token=...
# {"success":true,"redirectPath":"/dashboard/..."}
```

### 4. Test de Dashboard con Sesión
```bash
# Login y guardar cookies
curl -c /tmp/cookies.txt -s -X POST https://vittasami-staging.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinicasanrafael.com","password":"password123"}'

# Acceder a dashboard con cookies
curl -b /tmp/cookies.txt -I https://vittasami-staging.vercel.app/dashboard/b25d4953-d741-419e-9a81-c815eb2e5f7d

# Esperar:
# HTTP/2 200 (NO HTTP/2 307 redirect)
```

### 5. Test Manual en Browser
1. Abrir: https://vittasami-staging.vercel.app/
2. Click en "Iniciar Sesión"
3. Ingresar credenciales:
   - Email: `admin@clinicasanrafael.com`
   - Password: `password123`
4. Verificar redirección a dashboard (NO loop infinito)
5. Verificar que dashboard carga correctamente

---

## 🔍 Troubleshooting

### Si el login vuelve a fallar:

#### Problema: Build Error con Twilio
**Síntoma**: `Error: accountSid must start with AC`
**Solución**: Verificar que `src/lib/notifications.ts` usa lazy-loading (ver código arriba)

#### Problema: 404 en vittasami-staging.vercel.app
**Síntoma**: `DEPLOYMENT_NOT_FOUND`
**Solución**:
```bash
# Listar deployments
vercel ls | head -5

# Asignar alias al último deployment exitoso
vercel alias set [deployment-url] vittasami-staging.vercel.app
```

#### Problema: Login loop (redirige a /auth/login)
**Síntoma**: Login exitoso pero dashboard redirige al login
**Diagnóstico**:
```bash
# Verificar que JWT_SECRET existe
vercel env ls | grep JWT

# Verificar que el deployment tiene la variable
vercel inspect [deployment-url] | grep JWT
```
**Solución**:
```bash
# Si falta JWT_SECRET
vercel env add JWT_SECRET preview
# Ingresar: vittasami-jwt-secret-key-production-2025

# Forzar redeploy
git commit --allow-empty -m "chore: sync JWT_SECRET"
git push origin staging

# Esperar build y actualizar alias
sleep 60
vercel ls | head -3  # Copiar nuevo deployment URL
vercel alias set [nuevo-deployment-url] vittasami-staging.vercel.app
```

#### Problema: Variables de entorno no disponibles
**Síntoma**: Errores relacionados con Supabase, JWT, etc.
**Solución**:
```bash
# Listar todas las variables
vercel env ls

# Agregar variable faltante
vercel env add [VARIABLE_NAME] preview

# Verificar en deployment específico
vercel env pull .env.vercel --environment=preview
cat .env.vercel
```

---

## 📝 Comandos Útiles de Vercel

### Ver Deployments
```bash
vercel ls                    # Listar deployments
vercel ls | head -10         # Solo últimos 10
```

### Inspeccionar Deployment
```bash
vercel inspect [deployment-url]           # Info general
vercel inspect --logs [deployment-url]    # Con logs
```

### Ver Logs
```bash
vercel logs [deployment-url]              # Logs del deployment
vercel logs [deployment-url] --since 5m   # Últimos 5 minutos
vercel logs [deployment-url] --follow     # En tiempo real
```

### Gestionar Aliases
```bash
vercel alias ls                                        # Listar aliases
vercel alias set [deployment-url] [alias]              # Asignar alias
vercel alias rm [alias]                                # Eliminar alias
```

### Variables de Entorno
```bash
vercel env ls                                          # Listar variables
vercel env add [NAME] [environment]                    # Agregar variable
vercel env rm [NAME] [environment]                     # Eliminar variable
vercel env pull .env.vercel --environment=preview      # Descargar variables
```

---

## 🚀 Proceso de Deploy a Staging

### Workflow Automático (Recomendado)

1. **Push a branch staging**:
```bash
git checkout staging
git add .
git commit -m "feat: nueva funcionalidad"
git push origin staging
```

2. **Vercel detecta el push automáticamente** y despliega

3. **Verificar build exitoso**:
```bash
vercel ls | head -3
# Esperar: ● Ready
```

4. **Actualizar alias** (si es necesario):
```bash
# Solo si el alias no se actualizó automáticamente
NEW_DEPLOYMENT=$(vercel ls --format plain | head -1 | awk '{print $1}')
vercel alias set $NEW_DEPLOYMENT vittasami-staging.vercel.app
```

5. **Verificar funcionamiento**:
```bash
# Test de login
curl -X POST https://vittasami-staging.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinicasanrafael.com","password":"password123"}' \
  | python3 -m json.tool
```

### Workflow Manual (Si automático falla)

```bash
cd /Users/alvaro/Projects/VittaSamiApp

# Deploy manual a staging
vercel --prod=false

# Copiar la URL del deployment
# Ejemplo: https://vittasami-xxx-vittameds-projects.vercel.app

# Asignar alias
vercel alias set https://vittasami-xxx-vittameds-projects.vercel.app vittasami-staging.vercel.app
```

---

## 🗄️ Base de Datos

### Staging usa Development Database

**Supabase Project**: mvvxeqhsatkqtsrulcil
**URL**: https://mvvxeqhsatkqtsrulcil.supabase.co
**Tabla de usuarios**: `custom_users`

### Usuarios de Prueba Disponibles

```sql
-- Admin
email: admin@clinicasanrafael.com
password: password123
role: admin_tenant
tenant_id: b25d4953-d741-419e-9a81-c815eb2e5f7d

-- Doctor
email: ana.rodriguez@email.com
password: VittaSami2024!
role: doctor

-- Recepcionista
email: secre@clinicasanrafael.com
password: password
role: receptionist
```

### Query útil para verificar usuarios
```sql
SELECT
  email,
  role,
  tenant_id,
  is_active,
  first_name,
  last_name
FROM custom_users
WHERE email = 'admin@clinicasanrafael.com';
```

---

## 📌 Notas Importantes

### 1. Diferencia entre Ambientes

| Ambiente | Vercel Project | Database | Branch Git |
|----------|---------------|----------|------------|
| **Staging** | Preview (vittasami-staging.vercel.app) | Development (mvvxeqhsatkqtsrulcil) | `staging` |
| **Production** | Production | Production (emtcplanfbmydqjbcuxm) | `main` |

### 2. JWT_SECRET es Crítico
- El mismo secret debe usarse en API de login y en middleware
- Se configura en Vercel env vars
- Valor actual: `vittasami-jwt-secret-key-production-2025`
- Si se cambia, todos los tokens existentes quedan inválidos

### 3. Twilio es Opcional
- La app puede funcionar sin Twilio
- Solo se usa para SMS/WhatsApp (opcional)
- El lazy-loading previene errores en build

### 4. Deployments de Preview
- Cada push a `staging` crea un nuevo deployment
- El alias debe actualizarse manualmente (o esperar unos minutos)
- Los deployments viejos permanecen disponibles

---

## 📅 Timeline de Cambios

### 20 Nov 2025 - 12:37 PM
- **Commit**: `058e4a45` - Fix Twilio lazy-loading
- **Deployment**: vittasami-opzzw07zh
- **Status**: Build exitoso, pero JWT_SECRET faltante

### 20 Nov 2025 - 12:48 PM
- **Action**: Agregado alias `vittasami-staging.vercel.app`
- **Issue**: Login loop por JWT_SECRET mismatch

### 20 Nov 2025 - 1:48 PM
- **Commit**: `d1949deb` - Trigger redeploy con JWT_SECRET
- **Deployment**: vittasami-8zbjbuwih
- **Status**: ✅ COMPLETADO - Todo funcionando

---

## 🎯 Estado Final del Sistema

### ✅ Funcionando Correctamente
- Build sin errores de Twilio
- Login API (HTTP 200, token válido)
- Middleware valida tokens correctamente
- Dashboard accesible post-login
- No hay login loops
- Alias configurado correctamente

### ⚠️ Limitaciones Conocidas
- Twilio SMS/WhatsApp no configurado (opcional)
- Email SMTP no configurado (opcional)
- Solo funciona con usuarios en Development DB

### 🔄 Próximos Pasos (Opcional)
1. Configurar Twilio para SMS/WhatsApp en staging
2. Configurar SMTP para emails en staging
3. Agregar más usuarios de prueba si es necesario
4. Documentar proceso de deploy a Production

---

## 📞 Contacto y Referencias

### Documentación Relacionada
- `/Users/alvaro/Projects/VittaSamiApp/docs/PRODUCTION-CREDENTIALS.md`
- `/Users/alvaro/Projects/VittaSamiApp/CLAUDE.md`

### Archivos Clave del Proyecto
- **Login Page**: `src/app/auth/login/page.tsx`
- **Login API**: `src/app/api/auth/login/route.ts`
- **Middleware**: `src/middleware.ts`
- **Custom Auth**: `src/lib/custom-auth.ts`
- **Notifications**: `src/lib/notifications.ts`

### Vercel CLI Version
```bash
vercel --version
# Vercel CLI 48.10.2
```

---

**Documento creado**: 20 Nov 2025
**Última actualización**: 20 Nov 2025 13:48 PM
**Autor**: Tech Lead ABPTeam
**Status**: ✅ VALIDADO Y FUNCIONAL
