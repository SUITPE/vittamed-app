# 🔄 Git Workflow - VittaSami

## ⚠️ REGLA CRÍTICA

**NUNCA hacer commits directamente en `main`**

Todos los cambios DEBEN pasar primero por `staging` antes de llegar a `main`.

---

## 📋 Flujo de Trabajo Correcto

### 1. Desarrollo de Features

```bash
# Crear feature branch desde staging
git checkout staging
git pull origin staging
git checkout -b feature/nombre-del-feature

# Hacer cambios y commits
git add .
git commit -m "feat: descripción del cambio"

# Push feature branch
git push origin feature/nombre-del-feature

# Crear Pull Request: feature/nombre → staging
```

### 2. Testing en Staging

```bash
# Merge feature a staging (via PR o directo)
git checkout staging
git merge feature/nombre-del-feature
git push origin staging

# ⏳ ESPERAR:
# - Vercel deploy a staging
# - Pruebas manuales
# - Verificación de funcionalidad
```

### 3. Deployment a Production

```bash
# SOLO después de verificar staging
git checkout main
git pull origin main
git merge staging  # Fast-forward merge
git push origin main

# ⏳ GitHub Actions automáticamente:
# - Ejecuta tests
# - Deploy a production
```

---

## 🚫 Anti-Patterns (NO HACER)

### ❌ Commits Directos en Main
```bash
# INCORRECTO
git checkout main
git commit -m "docs: update"  # ❌ NUNCA!
git push origin main
```

**Problema**: Main tiene commits que staging no tiene → branches desincronizadas

### ❌ Merge Main → Staging (Flujo Inverso)
```bash
# INCORRECTO
git checkout staging
git merge main  # ❌ Flujo inverso!
```

**Problema**: Staging debería ser la fuente de verdad, no un receptor de main

### ❌ Cherry-Pick de Commits
```bash
# EVITAR
git cherry-pick abc123  # ❌ Crea divergencia
```

**Problema**: Genera historias de git divergentes

---

## ✅ Casos de Uso Específicos

### Hotfix Urgente en Production

Si hay un bug crítico en production:

```bash
# 1. Crear hotfix branch desde main
git checkout main
git checkout -b hotfix/descripcion

# 2. Fix + commit
git add .
git commit -m "fix: bug crítico en production"

# 3. Merge a AMBAS branches
git checkout main
git merge hotfix/descripcion
git push origin main

git checkout staging
git merge hotfix/descripcion
git push origin staging

# 4. Limpiar
git branch -d hotfix/descripcion
```

### Actualización de Documentación

Documentación también sigue el flujo normal:

```bash
# 1. En staging primero
git checkout staging
# ... editar docs ...
git commit -m "docs: actualizar guía de deployment"
git push origin staging

# 2. Verificar en staging
# 3. Merge a main (cuando esté listo)
git checkout main
git merge staging
git push origin main
```

### Sincronizar Branches Desincronizadas

Si main tiene commits que staging no tiene (como sucedió):

```bash
# Traer cambios de main a staging
git checkout staging
git merge main -m "chore: sync with main"
git push origin staging

# Verificar sincronización
git log --oneline --graph --all
```

---

## 🔒 Branch Protection (Recomendado)

Configurar en GitHub para prevenir errores:

### Main Branch Protection

```yaml
Settings → Branches → Branch protection rules → main

Reglas recomendadas:
✅ Require pull request reviews before merging
✅ Require status checks to pass before merging
   - CI/CD tests
   - TypeScript check
   - Linter
✅ Require branches to be up to date before merging
✅ Include administrators (aplicar reglas a todos)
❌ Allow force pushes (deshabilitado)
❌ Allow deletions (deshabilitado)
```

### Staging Branch Protection

```yaml
Settings → Branches → Branch protection rules → staging

Reglas recomendadas:
✅ Require pull request reviews (opcional, más flexible que main)
✅ Require status checks to pass before merging
❌ Allow force pushes (solo en casos excepcionales)
```

---

## 📊 Environments

### Staging Environment
- **URL**: https://vittasami-staging.vercel.app
- **Branch**: `staging`
- **Deploy**: Automático en push
- **Database**: Staging DB (mvvxeqhsatkqtsrulcil.supabase.co)
- **Purpose**: Testing y verificación pre-production

### Production Environment
- **URL**: https://app.vittasami.lat
- **Branch**: `main`
- **Deploy**: GitHub Actions (tests + deploy)
- **Database**: Production DB (emtcplanfbmydqjbcuxm.supabase.co)
- **Purpose**: Aplicación live para usuarios

---

## 🔍 Verificación de Sincronización

### Verificar que branches están sincronizadas:

```bash
# Ver últimos commits de ambas branches
git log --oneline --graph --all --decorate -10

# Comparar branches
git diff staging..main

# Si output está vacío → branches sincronizadas ✅
```

### Verificar divergencia:

```bash
# Ver commits en main que no están en staging
git log staging..main

# Ver commits en staging que no están en main
git log main..staging
```

---

## 📝 Commit Message Convention

Seguir Conventional Commits:

```
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
chore: tareas de mantenimiento
refactor: refactorización de código
test: agregar o modificar tests
style: cambios de formato (no afectan código)
perf: mejoras de performance
ci: cambios en CI/CD
```

**Ejemplos:**
```bash
git commit -m "feat: add voice dictation to medical notes"
git commit -m "fix: super admin redirect to correct page"
git commit -m "docs: update deployment workflow"
git commit -m "chore: reorganize docs directory structure"
```

---

## 🎯 Checklist Pre-Merge a Main

Antes de hacer `git merge staging` en main:

- [ ] ✅ Todos los cambios están en staging
- [ ] ✅ Staging deployment exitoso
- [ ] ✅ Tests pasando en staging
- [ ] ✅ Verificación manual completada
- [ ] ✅ No hay commits directos en main que staging no tenga
- [ ] ✅ Pull de main actualizado (`git pull origin main`)
- [ ] ✅ Merge será fast-forward (sin conflictos)

---

## 🚨 Si Cometiste un Error

### Commit directo en main (lo que pasó hoy):

```bash
# 1. Sincronizar staging inmediatamente
git checkout staging
git merge main
git push origin staging

# 2. Verificar sincronización
git log --oneline -5
```

### Push forzado accidental:

```bash
# 1. Contactar al equipo inmediatamente
# 2. Recuperar desde GitHub history
# 3. git reflog para encontrar estado anterior
git reflog
git reset --hard HEAD@{n}
```

---

## 📚 Referencias

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

---

**Última actualización**: 2025-11-21
**Creado por**: Claude Code
**Status**: ✅ Documentación oficial del proyecto
