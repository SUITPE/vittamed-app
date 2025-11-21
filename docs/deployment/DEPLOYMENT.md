# 🚀 Guía de Deployment - VittaMed

## 📋 Configuración de Variables de Entorno

### Desarrollo Local
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Staging
```bash
NEXT_PUBLIC_APP_URL=https://staging.vittamed.abp.pe
```

### Producción
```bash
NEXT_PUBLIC_APP_URL=https://vittamed.abp.pe
```

---

## 🔧 Configuración Completa por Ambiente

### 1. Variables Críticas (Requeridas)

#### Supabase
```bash
NEXT_PUBLIC_SUPABASE_URL=https://mvvxeqhsatkqtsrulcil.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5...
```

#### Autenticación
```bash
JWT_SECRET=tu-secreto-jwt-minimo-32-caracteres
```

#### URL de la Aplicación
```bash
# 🔴 IMPORTANTE: Cambiar según el ambiente
NEXT_PUBLIC_APP_URL=https://vittamed.abp.pe
```

#### Email
```bash
EMAIL_HOST=mail.abp.pe
EMAIL_PORT=587
EMAIL_USER=vittamed@abp.pe
EMAIL_PASSWORD=V1tt@Med2025
```

---

### 2. Variables Opcionales

#### Stripe (Pagos)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Twilio (SMS/WhatsApp)
```bash
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890
```

---

## 📧 Configuración de Emails

### Los emails de invitación incluyen:
- Botón "Iniciar Sesión" que apunta a `${NEXT_PUBLIC_APP_URL}/auth/login`
- Enlace alternativo de texto con la URL completa
- Credenciales del usuario (email + contraseña temporal)

### Ejemplo de URL generada:
- Desarrollo: `http://localhost:3000/auth/login`
- Staging: `https://staging.vittamed.abp.pe/auth/login`
- Producción: `https://vittamed.abp.pe/auth/login`

---

## 🌍 Deployment a Producción

### Paso 1: Configurar Variables de Entorno

En tu servidor de producción (Vercel, AWS, etc.):

```bash
# Application URL
NEXT_PUBLIC_APP_URL=https://vittamed.abp.pe

# Database
NEXT_PUBLIC_SUPABASE_URL=https://mvvxeqhsatkqtsrulcil.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Auth
JWT_SECRET=produccion-secret-key-32-chars-min

# Email
EMAIL_HOST=mail.abp.pe
EMAIL_PORT=587
EMAIL_USER=vittamed@abp.pe
EMAIL_PASSWORD=V1tt@Med2025

# Environment
NODE_ENV=production
```

### Paso 2: Build y Deploy

```bash
# Instalar dependencias
npm install

# Build
npm run build

# Iniciar en producción
npm start
```

---

## 🔄 Cambiar de Servidor/Dominio

### Opción 1: Cambio Temporal (Testing)
1. Actualizar `.env.local` o `.env.production`
2. Cambiar `NEXT_PUBLIC_APP_URL`
3. Rebuild y redeploy

### Opción 2: Múltiples Ambientes
Crear archivos separados:

```bash
.env.development    # http://localhost:3000
.env.staging        # https://staging.vittamed.abp.pe
.env.production     # https://vittamed.abp.pe
```

### Opción 3: Variables de Entorno del Host
En Vercel/Netlify/AWS:
- Dashboard → Settings → Environment Variables
- Agregar `NEXT_PUBLIC_APP_URL` con el valor correcto
- Redeploy automático

---

## ✅ Checklist Pre-Deployment

- [ ] `NEXT_PUBLIC_APP_URL` apunta al dominio correcto
- [ ] Variables de Supabase configuradas
- [ ] `JWT_SECRET` es único y seguro (min 32 chars)
- [ ] Email configurado con credenciales válidas
- [ ] `NODE_ENV=production`
- [ ] Tests pasando: `npm test`
- [ ] Build exitoso: `npm run build`
- [ ] Stripe configurado (si usa pagos)
- [ ] Migraciones de base de datos aplicadas

---

## 🧪 Testing de Emails en Diferentes Ambientes

### Desarrollo (localhost)
```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
**Email generado:** http://localhost:3000/auth/login

### Staging
```bash
# .env.staging
NEXT_PUBLIC_APP_URL=https://staging.vittamed.abp.pe
```
**Email generado:** https://staging.vittamed.abp.pe/auth/login

### Producción
```bash
# .env.production
NEXT_PUBLIC_APP_URL=https://vittamed.abp.pe
```
**Email generado:** https://vittamed.abp.pe/auth/login

---

## 🔐 Seguridad

### Variables Sensibles
**NUNCA** commitear a Git:
- `JWT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EMAIL_PASSWORD`
- `STRIPE_SECRET_KEY`
- `TWILIO_AUTH_TOKEN`

### .gitignore debe incluir:
```
.env
.env.local
.env.production
.env.staging
```

### Usar `.env.example` para documentación:
```bash
# Copiar para crear tu .env local
cp .env.example .env.local
# Luego editar con tus valores reales
```

---

## 📝 Notas Importantes

1. **`NEXT_PUBLIC_APP_URL` es crítica** - todos los emails usan esta variable
2. **Sin esta variable** - fallback a `https://vittamed.abp.pe`
3. **Cambios requieren rebuild** - las variables `NEXT_PUBLIC_*` se embeben en el build
4. **Email no configurado** - usuarios se crean igual, solo no reciben invitación
5. **Logs de email** - revisar consola para errores de envío

---

## 🆘 Troubleshooting

### Problema: Email no se envía
**Solución:**
1. Verificar variables `EMAIL_*` en `.env`
2. Revisar logs del servidor
3. Confirmar que email/password sean válidos
4. Verificar firewall/puertos del servidor SMTP

### Problema: URL incorrecta en emails
**Solución:**
1. Verificar `NEXT_PUBLIC_APP_URL` en variables de entorno
2. Rebuild la aplicación
3. Limpiar caché: `rm -rf .next && npm run build`

### Problema: 500 error al crear usuario
**Solución:**
1. Verificar que `password_hash` se esté generando
2. Revisar logs del servidor para error específico
3. Confirmar que `JWT_SECRET` esté configurado

---

**Última actualización:** 2 de Octubre, 2025
**Versión:** 1.0.0
