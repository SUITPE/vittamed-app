# Auto-Deploy a Staging con GitHub Actions

Este proyecto está configurado para desplegar automáticamente la rama `staging` a `vittasami-staging.vercel.app` usando GitHub Actions.

## 🎯 Qué hace

Cada vez que haces `git push origin staging`:

1. ✅ GitHub Actions detecta el push
2. ✅ Despliega automáticamente a Vercel
3. ✅ Asigna el alias `vittasami-staging.vercel.app`
4. ✅ Sin intervención manual necesaria

## ⚙️ Setup Inicial (Solo una vez)

### Paso 1: Crear Vercel Token

1. Ve a https://vercel.com/account/tokens
2. Click en "Create Token"
3. Nombre: `GitHub Actions - VittaSami Staging`
4. Scope: `Full Account`
5. Expiration: `No Expiration` (o elige un periodo largo)
6. Click "Create Token"
7. **Copia el token** (lo necesitarás en el siguiente paso)

### Paso 2: Agregar Token a GitHub Secrets

1. Ve al repositorio en GitHub: https://github.com/SUITPE/vittamed-app
2. Click en "Settings" (pestaña superior)
3. En el menú lateral izquierdo, busca "Secrets and variables" → "Actions"
4. Click en "New repository secret"
5. Name: `VERCEL_TOKEN`
6. Secret: **Pega el token de Vercel** que copiaste en el Paso 1
7. Click "Add secret"

### Paso 3: Verificar que el Workflow Existe

El workflow ya está creado en `.github/workflows/deploy-staging.yml`.

Si no existe, asegúrate de hacer pull de los últimos cambios:

```bash
git pull origin staging
```

## 🚀 Uso Normal (Después del Setup)

Simplemente trabaja normalmente:

```bash
# 1. Haz tus cambios
git add .
git commit -m "feat: nueva funcionalidad"

# 2. Push a staging
git push origin staging

# 3. ¡Eso es todo! El deployment es automático
```

## 📊 Monitorear Deployments

### Ver el progreso en GitHub

1. Ve a tu repositorio en GitHub
2. Click en la pestaña "Actions"
3. Verás el workflow "Deploy to Staging" ejecutándose
4. Click en el workflow para ver logs detallados

### Verificar el deployment

Una vez completado el workflow, verifica:

```bash
# En tu navegador
https://vittasami-staging.vercel.app
```

## 🔍 Troubleshooting

### Error: "VERCEL_TOKEN is not set"

**Problema:** No configuraste el secret en GitHub.

**Solución:** Sigue el Paso 2 arriba para agregar `VERCEL_TOKEN` a GitHub Secrets.

### Error: "Invalid token"

**Problema:** El token de Vercel expiró o es inválido.

**Solución:**
1. Crea un nuevo token en https://vercel.com/account/tokens
2. Actualiza el secret `VERCEL_TOKEN` en GitHub

### Error: "Failed to assign alias"

**Problema:** Puede que el dominio `vittasami-staging.vercel.app` no esté configurado.

**Solución:**
1. Ve a https://vercel.com/dashboard
2. Selecciona el proyecto `vittasami`
3. Ve a "Settings" → "Domains"
4. Asegúrate de que `vittasami-staging.vercel.app` esté en la lista

### El workflow no se ejecuta

**Problema:** GitHub Actions puede estar deshabilitado.

**Solución:**
1. Ve a "Settings" → "Actions" → "General" en GitHub
2. Asegúrate de que "Allow all actions and reusable workflows" esté seleccionado

## 🔄 Workflow Detallado

El workflow realiza estos pasos:

1. **Checkout code** - Clona el repositorio
2. **Setup Node.js** - Instala Node.js 20
3. **Install Vercel CLI** - Instala Vercel globalmente
4. **Pull Vercel Environment** - Sincroniza configuración de Vercel
5. **Build Project** - Construye el proyecto
6. **Deploy to Vercel** - Despliega a Vercel
7. **Assign Staging Alias** - Asigna `vittasami-staging.vercel.app`
8. **Deployment Summary** - Muestra resumen en GitHub

## 📝 Archivos Relacionados

- **Workflow:** `.github/workflows/deploy-staging.yml`
- **Documentación:** `docs/deployment/AUTO-DEPLOY-STAGING.md` (este archivo)

## 🎉 Beneficios

✅ **Sin comandos manuales** - Solo push a staging
✅ **Deployment consistente** - Siempre usa el mismo proceso
✅ **Logs visibles** - Todo el proceso es auditable en GitHub
✅ **Rápido** - Deploy en ~2-3 minutos
✅ **Automático** - Sin olvidar pasos

## 🔐 Seguridad

- El token de Vercel está encriptado en GitHub Secrets
- Solo usuarios con acceso al repositorio pueden ver logs
- Los tokens nunca se exponen en logs
- Puedes revocar el token en cualquier momento desde Vercel

## 📚 Referencias

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel Deployments with GitHub Actions](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
