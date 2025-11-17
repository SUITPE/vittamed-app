# Vercel Deployment Issue Log

**Fecha:** 2025-01-15
**Proyecto:** VittaSami
**Usuario:** Alvaro (suitpe)

---

## 🚨 Problema: Deployments se Cancelan Automáticamente

### Síntomas

- Todos los deployments (Preview y Production) se cancelan después de 2-3 segundos
- Estado: "Canceled"
- Duración: 0-3ms (indica cancelación inmediata)
- No hay build logs disponibles

### Deployments Intentados

```
Age    Status      Environment    Duration
33s    Canceled    Preview        2s
59m    Error       Preview        1m (UTF-8 encoding error)
1h     Canceled    Preview        2s
1h     Canceled    Preview        3s
1h     Canceled    Preview        2s
1h     Error       Production     1m (manual deploy with encoding error)
1h     Canceled    Production     2s
```

### Cambios Realizados

1. **Removed ignoreCommand from vercel.json** (ca29a060)
   - Original: `bash -c '[[ "$VERCEL_GIT_COMMIT_REF" == "main" ]] && exit 1 || exit 0'`
   - Razón: Estaba cancelando todos los builds, no solo main
   - Resultado: Builds siguen cancelándose

2. **Fixed UTF-8 encoding in culqi-server.ts** (2efe23bb)
   - Problema: Caracteres especiales mal codificados
   - Fix: Reescrito con encoding UTF-8 correcto
   - Resultado: Build error resuelto, pero deployments cancelados

3. **Fixed Suspense boundary in checkout/error** (cbdb5824)
   - Problema: useSearchParams() sin Suspense (Next.js 15 requirement)
   - Fix: Wrapped component in Suspense
   - Resultado: Build error resuelto, pero deployments cancelados

### Posibles Causas

1. **Vercel Dashboard Configuration**
   - Ignored Build Step configurado en Settings > Git
   - Production Branch mal configurado
   - Proyecto pausado o deshabilitado

2. **GitHub Integration**
   - Webhooks no configurados correctamente
   - Branch protection rules conflictivas
   - GitHub App permissions insuficientes

3. **Project Settings**
   - Build command override que causa error
   - Root directory incorrecto
   - Framework detection fallando

### Próximos Pasos de Troubleshooting

#### 1. Verificar Configuración en Vercel Dashboard

```
URL: https://vercel.com/vittameds-projects/vittasami/settings
```

**Settings > Git:**
- [ ] Verificar "Ignored Build Step" (debe estar vacío o removido)
- [ ] Verificar "Production Branch" (debe ser "none" o vacío)
- [ ] Verificar que GitHub integration esté activa

**Settings > General:**
- [ ] Verificar que proyecto no esté pausado
- [ ] Verificar Build & Development Settings:
  - Framework Preset: Next.js
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`

**Settings > Environment Variables:**
- [ ] Verificar que variables estén configuradas para "Preview"

#### 2. Verificar en GitHub

```
URL: https://github.com/SUITPE/vittamed-app/settings/hooks
```

- [ ] Verificar que Vercel webhook esté activo
- [ ] Check recent deliveries para errores

#### 3. Intentar Deploy Manual Directo

```bash
# Sin auto-detection de GitHub
vercel --force --no-wait
```

#### 4. Revisar Vercel Logs

```bash
# Ver inspect del último deployment cancelado
vercel inspect https://vittasami-fleiuvpqc-vittameds-projects.vercel.app

# Ver builds history
vercel ls --scope vittameds-projects
```

### Solución Temporal: Deploy Manual

Si auto-deploy no funciona, usar deploy manual:

```bash
# Desde staging branch
git checkout staging
git pull origin staging

# Build local primero para verificar
npm run build

# Deploy manual a Vercel
vercel --force

# Promote a production si es necesario
vercel --prod
```

### Configuración Actual Correcta

**vercel.json:**
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  // ... (resto de config OK)
  // ignoreCommand: REMOVIDO ✅
}
```

**Environment Variables (14 configuradas):**
- NEXT_PUBLIC_SUPABASE_URL ✅
- NEXT_PUBLIC_SUPABASE_ANON_KEY ✅
- SUPABASE_SERVICE_ROLE_KEY ✅
- NEXT_PUBLIC_DOMAIN_MAIN ✅
- NEXT_PUBLIC_DOMAIN_APP ✅
- NEXT_PUBLIC_CULQI_PUBLIC_KEY ✅
- CULQI_SECRET_KEY ✅
- CULQI_WEBHOOK_SECRET ✅
- EMAIL_HOST ✅
- EMAIL_PORT ✅
- EMAIL_USER ✅
- EMAIL_PASSWORD ✅
- NODE_ENV ✅
- NEXT_TELEMETRY_DISABLED ✅

### Contacto con Soporte Vercel

Si el problema persiste, contactar soporte:

```
URL: https://vercel.com/support
Email: support@vercel.com
```

**Información a proveer:**
- Project ID: `prj_qtj25xNU85mtR7D0JMUVbmXyp3HP`
- Org ID: `team_kaaAqT40R4pSYIesk0PLvUCo`
- Deployment URLs: (ver arriba)
- Descripción: All deployments are automatically canceled after 2-3s with no build logs

---

## 📝 Updates

**2025-01-15 20:15 (UTC-5):**
- Problema identificado: Deployments cancelándose automáticamente
- Fixes aplicados: UTF-8 encoding, Suspense boundary, removed ignoreCommand
- Siguiente paso: Verificar configuración en Vercel Dashboard manualmente

---

**Tech Lead:** Investigar configuración de Vercel Dashboard antes de siguiente intento
# Vercel Deployment Test - Sun Nov 16 20:40:42 -05 2025
