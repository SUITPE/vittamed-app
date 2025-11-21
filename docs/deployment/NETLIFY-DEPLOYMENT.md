# 🌐 VittaMed - Netlify Deployment Guide

## 🚀 Quick Netlify Deployment

### **Paso 1: Preparación**
Los archivos necesarios ya están configurados:
- ✅ `netlify.toml` - Configuración de build y redirects
- ✅ `next.config.mjs` - Optimizado para static export
- ✅ Variables de entorno template

### **Paso 2: Deploy desde GitHub**

1. **Conectar Repositorio:**
   - Ve a [netlify.com](https://app.netlify.com)
   - "New site from Git" → GitHub
   - Selecciona: `SUITPE/vittamed-app`

2. **Configuración Automática:**
   ```
   Build command: npm run build
   Publish directory: out
   Node version: 18
   ```

3. **Variables de Entorno:**
   En Netlify Dashboard → Site settings → Environment variables:
   ```bash
   # REQUERIDAS
   NEXT_PUBLIC_SUPABASE_URL=https://mvvxeqhsatkqtsrulcil.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...

   # PRODUCCIÓN (configura según tus servicios)
   NEXT_PUBLIC_BASE_URL=https://tu-sitio.netlify.app
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   EMAIL_HOST=smtp.gmail.com
   EMAIL_USER=tu-email@domain.com
   EMAIL_PASSWORD=tu-password
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   CRON_SECRET=tu-secreto-seguro
   ```

### **Paso 3: Configuraciones Especiales para VittaMed**

#### **API Routes → Netlify Functions**
```bash
# Las APIs se convertirán automáticamente a:
/api/appointments → /.netlify/functions/appointments
/api/services → /.netlify/functions/services
/api/process-reminders → /.netlify/functions/process-reminders
```

#### **Webhooks de Stripe**
```bash
# URL para webhooks en Netlify:
https://tu-sitio.netlify.app/.netlify/functions/payments/webhook
```

#### **Scheduled Functions (Recordatorios)**
Para el procesamiento automático de recordatorios:
```bash
# Crear Netlify Function scheduled
# En netlify/functions/scheduled-reminders.js
```

### **Paso 4: Configuraciones Post-Deployment**

#### **Custom Domain (Opcional)**
```bash
# En Netlify Dashboard:
Domain settings → Add custom domain
# Configura DNS CNAME: tu-dominio.com → tu-sitio.netlify.app
```

#### **SSL Certificate**
```bash
# Automático con Netlify
# Let's Encrypt se configura automáticamente
```

#### **Environment Variables**
```bash
# Copia desde .env.production.template
# Pega en Netlify → Environment variables
```

---

## ⚠️ **Limitaciones Importantes**

### **1. API Routes como Static Export**
Netlify funciona mejor con **Netlify Functions**. Para VittaMed:

**Opción A: Static Frontend + External API**
- Frontend estático en Netlify
- APIs en Vercel/Railway/Heroku
- Base de datos Supabase (ya configurado)

**Opción B: Full Netlify Functions**
- Migrar APIs a Netlify Functions
- Requiere reestructuración de rutas

### **2. Recordatorios Automáticos**
```bash
# Los cron jobs requieren:
- Netlify Functions con Scheduled triggers
- O servicio externo (Zapier, GitHub Actions)
```

---

## 🔧 **Configuración Recomendada**

### **Arquitectura Híbrida (Recomendada)**
```
┌─ Frontend: Netlify (Static)
├─ API: Vercel (Serverless)
├─ Database: Supabase
├─ Payments: Stripe
├─ Notifications: Twilio
└─ Cron Jobs: GitHub Actions
```

### **Full Netlify (Avanzado)**
Requiere migrar APIs a Netlify Functions:
```bash
# Estructura necesaria:
netlify/functions/
├─ appointments.js
├─ services.js
├─ process-reminders.js
└─ payments-webhook.js
```

---

## 🚀 **Deployment Steps**

### **Método 1: Git Deploy (Recomendado)**
```bash
# Ya está configurado - solo conecta en Netlify UI
```

### **Método 2: CLI Deploy**
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build y deploy
npm run build
netlify deploy --prod --dir=out
```

### **Método 3: Drag & Drop**
```bash
# Build local
npm run build

# Arrastrar carpeta 'out' a Netlify UI
```

---

## ✅ **Verificación Post-Deployment**

### **1. Frontend**
- [ ] Página principal carga
- [ ] Navegación funciona
- [ ] Formularios responden
- [ ] Estilos se aplican correctamente

### **2. Funcionalidades Críticas**
- [ ] Login/registro funciona
- [ ] Booking page carga (puede fallar sin APIs)
- [ ] Dashboard accesible
- [ ] Responsive design OK

### **3. Limitaciones Esperadas**
- ❌ APIs no funcionarán (requieren backend separado)
- ❌ Pagos no procesarán
- ❌ Recordatorios no se enviarán
- ✅ UI/UX completamente funcional

---

## 💡 **Recomendación Final**

**Para VittaMed completo:**
1. **Frontend**: Deploy en Netlify (siguiendo esta guía)
2. **Backend APIs**: Deploy en Vercel (usando la guía Vercel)
3. **Dominio**: Apuntar a Netlify, proxy APIs a Vercel

**Resultado**: Sistema completo y funcional con la mejor performance.

---

## 🆘 **Troubleshooting**

### **Build Fails**
```bash
# Error: API routes in static export
# Solución: Deshabilitar APIs problemáticas o usar Netlify Functions
```

### **Static Assets**
```bash
# Error: Images not loading
# Verificar: images.unoptimized = true en next.config.mjs
```

### **Redirects**
```bash
# Error: 404 en rutas
# Verificar: netlify.toml tiene redirects configurados
```

**¿Listo para deploy?** Sigue los pasos y tendrás VittaMed live en minutos! 🚀