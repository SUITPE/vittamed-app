# 🚀 VittaMed Auto-Deployment Setup Guide

Este sistema te dará **auto-deployment como Vercel** pero en tu propio servidor DigitalOcean.

## 🎯 Cómo funciona

1. **Push a main/master** → GitHub Actions se activa automáticamente
2. **Build & Test** → Compila la aplicación en GitHub
3. **Deploy** → Sube y reinicia automáticamente en tu servidor
4. **Health Check** → Verifica que todo funcione correctamente

---

## 📋 Configuración Paso a Paso

### **1. Configurar SSH Key en tu servidor**

En tu servidor DigitalOcean:

```bash
# Generar SSH key para GitHub Actions
ssh-keygen -t rsa -b 4096 -C "github-actions@vittamed.com" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github_actions
chmod 644 ~/.ssh/github_actions.pub

# Mostrar la clave privada (la necesitaremos para GitHub)
cat ~/.ssh/github_actions
```

### **2. Configurar GitHub Secrets**

Ve a tu repositorio en GitHub: **Settings > Secrets and variables > Actions**

Agrega estos secrets:

#### **🔐 Secrets requeridos:**

| Secret Name | Value | Descripción |
|-------------|-------|-------------|
| `DO_HOST` | `tu-servidor-ip` | IP de tu servidor DigitalOcean |
| `DO_USERNAME` | `root` o `tu-usuario` | Usuario SSH del servidor |
| `DO_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Contenido completo de `~/.ssh/github_actions` |
| `DO_PORT` | `22` | Puerto SSH (opcional, default 22) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mvvxeqhsatkqtsrulcil.supabase.co` | URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Clave anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Clave de servicio de Supabase |

### **3. Preparar tu servidor**

En tu servidor DigitalOcean:

```bash
# Instalar Node.js 20 (si no lo tienes)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Crear estructura de directorios
sudo mkdir -p /apps/prod/vittamed-app/logs
sudo chown -R $USER:$USER /apps/prod

# Configurar PM2 para arranque automático
pm2 startup systemd -u $USER --hp /home/$USER
```

### **4. Configurar Nginx (Opcional pero recomendado)**

```bash
# Instalar Nginx
sudo apt update
sudo apt install nginx -y

# Crear configuración
sudo tee /etc/nginx/sites-available/vittamed << 'EOF'
server {
    listen 80;
    server_name tu-dominio.com;  # Cambiar por tu dominio

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/vittamed /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🚦 Probando el Auto-Deployment

### **Método 1: Push a main/master**
```bash
git add .
git commit -m "feat: test auto-deployment"
git push origin main
```

### **Método 2: Trigger manual desde GitHub**
1. Ve a tu repo en GitHub
2. **Actions** tab
3. **🚀 Deploy VittaMed to DigitalOcean**
4. **Run workflow**

---

## 📊 Monitoreo del Deployment

### **Ver logs en GitHub Actions:**
- Ve a **Actions** en tu repositorio
- Haz clic en el deployment más reciente
- Revisa cada paso del workflow

### **Ver logs en tu servidor:**
```bash
# Estado de PM2
pm2 status vittamed-app

# Logs de la aplicación
pm2 logs vittamed-app

# Monitoreo en tiempo real
pm2 monit

# Health check manual
curl http://localhost:3000/api/health
```

---

## 🔧 Comandos Útiles de Servidor

### **Gestión de la aplicación:**
```bash
# Ver estado
pm2 status vittamed-app

# Reiniciar aplicación
pm2 restart vittamed-app

# Parar aplicación
pm2 stop vittamed-app

# Ver logs en tiempo real
pm2 logs vittamed-app --lines 100

# Limpiar logs
pm2 flush
```

### **Troubleshooting:**
```bash
# Verificar que el puerto 3000 esté libre
sudo lsof -i :3000

# Verificar espacio en disco
df -h

# Ver procesos de Node.js
ps aux | grep node

# Reiniciar PM2 completamente
pm2 kill
pm2 start /apps/prod/vittamed-app/ecosystem.config.js
```

---

## 🎉 Ventajas vs Vercel

| Característica | Auto-Deployment | Vercel |
|----------------|-----------------|--------|
| **Control total** | ✅ Tu servidor | ❌ Limitado |
| **Costo** | ✅ Solo tu servidor | ❌ Plans pagos |
| **Performance** | ✅ Configuración optimizada | ❌ Edge functions limitadas |
| **Escalabilidad** | ✅ Puedes escalar cuando quieras | ❌ Límites de plan |
| **Debugging** | ✅ Acceso completo a logs | ❌ Logs limitados |
| **Base de datos** | ✅ Conexión directa | ❌ Puede tener latencia |

---

## 🚨 Configuración de Alertas (Bonus)

### **Slack Notifications (Opcional):**

Agrega este step al final del workflow para recibir notificaciones:

```yaml
- name: 📱 Slack Notification
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    channel: '#deployments'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### **Email Notifications:**
GitHub te envía emails automáticamente si el deployment falla.

---

## ✅ Checklist de Configuración

- [ ] SSH key generada y configurada en el servidor
- [ ] Todos los GitHub Secrets configurados
- [ ] Node.js 20 y PM2 instalados en el servidor
- [ ] Directorio `/apps/prod/vittamed-app` creado
- [ ] PM2 startup configurado
- [ ] Nginx configurado (opcional)
- [ ] Primer deployment exitoso
- [ ] Health check funcionando
- [ ] Monitoreo configurado

---

## 🎯 Resultado Final

Una vez configurado, cada vez que hagas push a main:

1. **⏱️ 2-3 minutos** → Deployment automático completo
2. **🔄 Zero downtime** → PM2 reinicia sin interrumpir servicio
3. **✅ Health checks** → Verificación automática de que todo funciona
4. **📊 Logs detallados** → Visibilidad completa del proceso
5. **🚀 Production ready** → Aplicación lista para usuarios reales

**¡Es como Vercel pero mejor porque tienes control total!** 🎉