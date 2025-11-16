# Vercel Setup Log - VittaSami

**Fecha:** 2025-01-15
**Usuario:** suitpe
**Proyecto:** VittaSami

## Estado Actual

- ✅ Vercel CLI instalado
- ✅ Logueado como: suitpe
- ✅ Staging branch: remotes/origin/staging
- ✅ Environment file: .env.staging configurado

## Próximos Pasos

### 1. Vincular Proyecto a Vercel

```bash
cd /Users/alvaro/Projects/VittaSamiApp
vercel link
```

**Responde a las preguntas:**
- Set up and deploy? → **No** (configuraremos primero)
- Which scope? → **suitpe** (o tu team name)
- Link to existing project? → **No** (es nuevo)
- What's your project's name? → **vittasami**
- In which directory is your code located? → **./** (raíz del proyecto)

### 2. Configurar Environment Variables

Ir a: https://vercel.com/suitpe/vittasami/settings/environment-variables

Copiar todas las variables de `.env.staging`:

```bash
# Copiar y pegar en Vercel Dashboard
cat .env.staging
```

**IMPORTANTE:**
- ✅ Marcar checkbox "Preview"
- ✅ Marcar checkbox "Development"
- ❌ NO marcar "Production" (usamos Digital Ocean)

### 3. Configurar Git Integration

Ir a: https://vercel.com/suitpe/vittasami/settings/git

**Git Configuration:**
- Production Branch: `(none)` o vacío
- Ignored Build Step: Configurado en vercel.json ✅

### 4. Deploy Staging

```bash
# Cambiar a staging branch
git checkout staging

# Verificar que estés en staging
git branch

# Push a staging (trigger auto-deploy)
git push origin staging
```

### 5. Monitorear Deploy

Ir a: https://vercel.com/suitpe/vittasami/deployments

Ver logs en tiempo real hasta que diga "Ready"

### 6. Verificar Deployment

URL esperada: `https://vittasami-staging.vercel.app`

```bash
# Test health check
curl https://vittasami-staging.vercel.app/api/health

# Test homepage
open https://vittasami-staging.vercel.app
```

### 7. Login Test

```
URL: https://vittasami-staging.vercel.app/auth/login
Usuario: admin@clinicasanrafael.com
Password: password123
```

## Comandos de Referencia

```bash
# Ver status de Vercel
vercel ls

# Ver logs
vercel logs vittasami-staging

# Deploy manual (si es necesario)
vercel --prod

# Rollback a deployment anterior
vercel rollback [deployment-url]
```

## Troubleshooting

### Build falla
```bash
# Ver logs completos
vercel logs [deployment-url]

# Test build localmente
npm run build

# Si local funciona, revisar env vars en Vercel
```

### Variables de entorno no funcionan
- Verificar que estén marcadas para "Preview"
- Hacer redeploy después de agregar variables
- Vercel Dashboard > Deployments > Redeploy

### 404 o páginas no cargan
- Verificar que vercel.json esté en la raíz
- Verificar que Next.js 15 sea compatible
- Revisar logs de función

---

**Next:** Una vez que staging funcione, documentar workflow de desarrollo
