# 🔐 Credenciales de Producción - VittaSami

**⚠️ CONFIDENCIAL - NO COMPARTIR**

---

## 🗄️ Base de Datos de Producción

### Supabase Production
```
Project ID: emtcplanfbmydqjbcuxm
URL: https://emtcplanfbmydqjbcuxm.supabase.co
Dashboard: https://supabase.com/dashboard/project/emtcplanfbmydqjbcuxm
```

### API Keys
```
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdGNwbGFuZmJteWRxamJjdXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzc4MjksImV4cCI6MjA3ODY1MzgyOX0.EU70mcxjelqzuWd7izvsowusigFsIvdhzIBg_k-5LSo

Service Role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdGNwbGFuZmJteWRxamJjdXhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzgyOSwiZXhwIjoyMDc4NjUzODI5fQ.yaWPAW9uy45SWEjQRR4jXzmkrDvkog0xi0T0fDtWRzQ
```

### Database Password
```
Password: Hws4!SynJT&Qxo
```

---

## 👤 Super Usuario Administrador

### Credenciales de Login
```
Email: admin@vittasami.com
Password: VittaSami2025!Admin
Role: super_admin
User ID: c05580fa-a30f-4ad7-89f6-62591180b365
```

### Permisos
- ✅ Acceso global a todos los tenants
- ✅ Gestión completa de usuarios
- ✅ Configuración del sistema
- ✅ Acceso a todas las funcionalidades

### URL de Acceso
```
Staging: https://vittasami-git-staging-vittameds-projects.vercel.app/auth/login
Production: https://app.vittasami.lat/auth/login (después de deploy)
```

---

## 📊 Estado del Schema

### Tablas Creadas (17 total) ✅

**Core Tables:**
- ✅ tenants
- ✅ profiles
- ✅ doctors
- ✅ doctor_tenants
- ✅ doctor_availability
- ✅ doctor_breaks
- ✅ patients
- ✅ services
- ✅ appointments

**Feature Management:**
- ✅ feature_flags
- ✅ tenant_features
- ✅ subscription_plans
- ✅ plan_features

**Medical & Billing:**
- ✅ medical_histories
- ✅ icd10_codes

**System:**
- ✅ webhook_logs
- ✅ payment_transactions

### Índices y Optimizaciones
- ✅ ~30 índices creados
- ✅ RLS (Row Level Security) habilitado
- ✅ Triggers para updated_at
- ✅ Foreign keys configuradas

---

## 🌐 Ambientes

### Development
- **Database**: https://mvvxeqhsatkqtsrulcil.supabase.co
- **Localhost**: http://localhost:3003
- **Estado**: Funcionando con datos demo

### Staging
- **Database**: Production (emtcplanfbmydqjbcuxm)
- **URL**: https://vittasami-git-staging-vittameds-projects.vercel.app
- **Vercel**: https://vercel.com/vittameds-projects/vittasami
- **Estado**: ✅ Funcionando con Next.js 16.0.3
- **Auto-deploy**: Push to `staging` branch

### Production
- **Database**: Production (emtcplanfbmydqjbcuxm) ✅ CONFIGURADA
- **URL**: https://app.vittasami.lat (pendiente deploy)
- **Server**: Digital Ocean Droplet
- **Estado**: ⏳ Pendiente actualización a Next.js 16

---

## 🚀 Próximos Pasos

### 1. Actualizar Digital Ocean
```bash
ssh root@<DROPLET_IP>
cd /app/vittasami
git checkout main
git pull origin main

# Actualizar .env con producción
cp .env.production .env
# Editar y completar secrets faltantes

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 2. Variables de Entorno Faltantes
Completar en `.env` de Digital Ocean:
- EMAIL_PASSWORD
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_WHATSAPP_NUMBER
- CULQI_SECRET_KEY (producción)
- NEXT_PUBLIC_CULQI_PUBLIC_KEY (producción)

### 3. Testing
1. Login con super admin en staging
2. Crear primer tenant
3. Probar flujo completo
4. Verificar RLS y permisos

---

## 📝 Notas de Seguridad

⚠️ **IMPORTANTE**:
- Este archivo contiene credenciales sensibles
- NO subir a git
- Guardar en gestor de contraseñas (1Password, LastPass, etc.)
- Cambiar passwords en producción si se comprometen
- Super admin solo para uso administrativo

---

**Fecha de Creación**: 2025-11-16
**Última Actualización**: 2025-11-16
**Responsable**: Tech Lead (Alvaro)
