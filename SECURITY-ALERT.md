# 🚨 ALERTA DE SEGURIDAD - CREDENCIALES COMPROMETIDAS

**Fecha:** 2025-10-14
**Severidad:** CRÍTICA
**Estado:** ACCIÓN REQUERIDA

## Resumen

Durante una auditoría de seguridad se detectó que el archivo `.env.local` con credenciales reales fue comprometido en el historial de Git.

## Credenciales que DEBEN ser rotadas INMEDIATAMENTE:

### 1. Supabase Service Role Key
- **Ubicación:** `SUPABASE_SERVICE_ROLE_KEY`
- **Riesgo:** ALTO - Permite bypass completo de RLS policies
- **Acción:**
  1. Ir a Supabase Dashboard → Settings → API
  2. Rotar el Service Role Key
  3. Actualizar `.env.local` (NO commitear)
  4. Desplegar con nueva variable en producción

### 2. Email Password
- **Ubicación:** `EMAIL_PASSWORD=V1tt@Med2025`
- **Riesgo:** MEDIO - Acceso a cuenta de email
- **Acción:**
  1. Cambiar password en el proveedor de email
  2. Actualizar `.env.local`
  3. Actualizar en producción

### 3. JWT Secret
- **Ubicación:** `JWT_SECRET` (si existe en .env.local)
- **Riesgo:** ALTO - Permite falsificar tokens de autenticación
- **Acción:**
  1. Generar nuevo secret: `openssl rand -base64 32`
  2. Actualizar `.env.local`
  3. **NOTA:** Esta variable será deprecada cuando migremos a Supabase Auth

## Acciones Completadas

✅ Agregado `.env.local` a `.gitignore`
✅ Creado `.env.example` como plantilla
✅ Documentado este archivo de alerta

## Acciones Pendientes

⚠️ **URGENTE - Realizar antes de continuar:**

1. [ ] Rotar SUPABASE_SERVICE_ROLE_KEY en Supabase Dashboard
2. [ ] Cambiar EMAIL_PASSWORD en proveedor de email
3. [ ] Generar nuevo JWT_SECRET (temporal hasta migración)
4. [ ] Actualizar variables en entorno de producción (Vercel/AWS)
5. [ ] Verificar que `.env.local` no está en git: `git status`

## Cómo Prevenir en el Futuro

1. **NUNCA** commitear archivos `.env*` (excepto `.env.example`)
2. Usar servicios de gestión de secrets:
   - Vercel: Variables de entorno en Dashboard
   - AWS: AWS Secrets Manager
   - Azure: Key Vault
3. Rotar credenciales regularmente (cada 90 días)
4. Usar diferentes credenciales para dev/staging/production

## Verificar Estado Actual

```bash
# 1. Verificar que .env.local NO está tracked
git status

# 2. Si aparece, eliminarlo del tracking (SIN borrar el archivo)
git rm --cached .env.local

# 3. Verificar .gitignore incluye .env.local
cat .gitignore | grep ".env.local"
```

## Contacto

Si tienes dudas sobre este proceso de rotación, consulta con el equipo de seguridad.

---

**Última actualización:** 2025-10-14
**Responsable:** DevOps/Security Team
