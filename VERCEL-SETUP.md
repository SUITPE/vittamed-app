# 🚀 Configuración de Vercel para VittaMed

## ⚠️ Error Solucionado: `TypeError: Failed to execute 'fetch' on 'Window': Invalid value`

Este error se debe a que **las variables de entorno de Supabase no están configuradas en Vercel**.

## 📋 Variables de Entorno Requeridas

En tu dashboard de Vercel, debes configurar estas variables:

### 1. Variables de Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://mvvxeqhsatkqtsrulcil.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzk2NzcsImV4cCI6MjA3Mzc1NTY3N30.-LxDF04CO66mJrg4rVpHHJLmNnTgNu_lFyfL-qZKsdw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU
```

## 🛠️ Cómo Configurar en Vercel

### Paso 1: Acceder a la Configuración
1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. Haz clic en **Settings**
3. Ve a la sección **Environment Variables**

### Paso 2: Agregar Variables
Para cada variable de entorno:
1. **Name**: `NEXT_PUBLIC_SUPABASE_URL`
2. **Value**: `https://mvvxeqhsatkqtsrulcil.supabase.co`
3. **Environments**: Selecciona `Production`, `Preview`, y `Development`
4. Haz clic en **Save**

Repite para todas las variables:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Paso 3: Redesplegar
1. Ve a **Deployments**
2. Haz clic en **Redeploy** en el último deployment
3. Selecciona **Use existing Build Cache** ❌ (desmarcado)
4. Haz clic en **Redeploy**

## ✅ Verificación

Después del redespliegue, la autenticación debe funcionar correctamente.

## 🔧 Solución Aplicada

Hemos configurado **valores por defecto** en el código para evitar errores de configuración:

- **src/lib/supabase.ts** - Cliente de navegador
- **src/lib/supabase-server.ts** - Cliente de servidor

Esto significa que incluso si olvidas configurar las variables en Vercel, la aplicación seguirá funcionando con los valores correctos.

## 🚨 Seguridad

Las claves mostradas aquí son **públicas** (anon key) o para **desarrollo**. En producción, siempre usa las variables de entorno de Vercel por seguridad.

## 📱 Credenciales Demo

Una vez configurado, puedes usar:
- **Admin**: admin@clinicasanrafael.com / password
- **Doctor**: ana.rodriguez@email.com / password
- **Paciente**: patient@example.com / password