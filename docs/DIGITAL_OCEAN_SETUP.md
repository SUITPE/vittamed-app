# Guía de Configuración - Digital Ocean

## 📋 Resumen de Arquitectura

```
vittasami.com           → Landing, Pricing, Invest (Marketing)
app.vittasami.lat       → Dashboard, Agenda, Patients (SaaS App)
                ↓
        [Digital Ocean Droplet]
                ↓
        [Nginx Reverse Proxy]
                ↓
        [Next.js App Container]
        (Mismo código, routing por middleware)
```

---

## 1️⃣ CONFIGURACIÓN DE DNS (Digital Ocean)

### A. Crear DNS Records en Digital Ocean

**Panel:** Networking → Domains

#### Para vittasami.com:
```
Tipo    Host    Apunta a              TTL
A       @       YOUR_DROPLET_IP       3600
A       www     YOUR_DROPLET_IP       3600
```

#### Para vittasami.lat (o el dominio que tengas):
```
Tipo    Host    Apunta a              TTL
A       @       YOUR_DROPLET_IP       3600
A       app     YOUR_DROPLET_IP       3600
```

### B. Verificar DNS (espera 5-15 minutos)
```bash
# Desde tu máquina local
dig vittasami.com
dig app.vittasami.lat

# Ambos deben apuntar a tu IP del droplet
```

---

## 2️⃣ ACTUALIZAR NGINX (En el Droplet)

### A. Conectarse al Droplet
```bash
ssh root@YOUR_DROPLET_IP
cd /ruta/a/tu/proyecto
```

### B. Actualizar nginx.conf

El archivo ya fue actualizado en este commit. Principales cambios:

**Dos server blocks separados:**
- `vittasami.com` → Server block 1 (marketing)
- `app.vittasami.lat` → Server block 2 (SaaS app)

**Ambos apuntan al mismo upstream** (vittasami_app) porque Next.js maneja el routing internamente mediante middleware.

### C. Crear directorio para certificados SSL
```bash
mkdir -p /ruta/a/tu/proyecto/ssl
```

---

## 3️⃣ CONFIGURAR SSL/TLS CON CERTBOT

### A. Instalar Certbot (si no lo tienes)
```bash
# En Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### B. Generar certificados para ambos dominios

**Opción 1: Dejar que Certbot maneje Nginx automáticamente**
```bash
sudo certbot --nginx -d vittasami.com -d www.vittasami.com
sudo certbot --nginx -d app.vittasami.lat
```

**Opción 2: Solo generar certificados (manual)**
```bash
sudo certbot certonly --standalone -d vittasami.com -d www.vittasami.com
sudo certbot certonly --standalone -d app.vittasami.lat
```

Los certificados se guardarán en:
```
/etc/letsencrypt/live/vittasami.com/fullchain.pem
/etc/letsencrypt/live/vittasami.com/privkey.pem
/etc/letsencrypt/live/app.vittasami.lat/fullchain.pem
/etc/letsencrypt/live/app.vittasami.lat/privkey.pem
```

### C. Actualizar rutas en nginx.conf

Si usaste la opción 2, actualiza las rutas SSL en `nginx.conf`:

```nginx
# Para vittasami.com
ssl_certificate /etc/letsencrypt/live/vittasami.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/vittasami.com/privkey.pem;

# Para app.vittasami.lat
ssl_certificate /etc/letsencrypt/live/app.vittasami.lat/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/app.vittasami.lat/privkey.pem;
```

### D. Renovación automática
```bash
# Test de renovación
sudo certbot renew --dry-run

# Configurar cron para renovación automática (ya debería estar configurado)
sudo systemctl status certbot.timer
```

---

## 4️⃣ VARIABLES DE ENTORNO EN PRODUCCIÓN

### A. Crear/actualizar archivo .env en el droplet
```bash
cd /ruta/a/tu/proyecto
nano .env
```

### B. Agregar variables de dominio
```env
# Dominios (NUEVAS VARIABLES)
NEXT_PUBLIC_DOMAIN_MAIN=https://vittasami.com
NEXT_PUBLIC_DOMAIN_APP=https://app.vittasami.lat

# Supabase (ya existentes)
NEXT_PUBLIC_SUPABASE_URL=https://mvvxeqhsatkqtsrulcil.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
SUPABASE_SERVICE_ROLE_KEY=tu_key

# Stripe (ya existentes)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (ya existentes)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=tu@email.com
EMAIL_PASSWORD=tu_password

# WhatsApp (ya existentes)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=tu_token
TWILIO_WHATSAPP_NUMBER=+14155238886
```

---

## 5️⃣ ACTUALIZAR DOCKER COMPOSE

El archivo `docker-compose.yml` ya fue actualizado para incluir:
- Variables de dominio
- Nombres de contenedor actualizados

### A. Verificar variables
```bash
docker-compose config
```

---

## 6️⃣ ACTUALIZAR GITHUB ACTIONS

### A. Agregar secretos en GitHub

**Repository → Settings → Secrets and variables → Actions**

Agregar nuevos secretos:
```
NEXT_PUBLIC_DOMAIN_MAIN = https://vittasami.com
NEXT_PUBLIC_DOMAIN_APP = https://app.vittasami.lat
```

### B. Actualizar workflow (ya actualizado en este commit)

El archivo `.github/workflows/deploy.yml` ahora incluye estas variables.

---

## 7️⃣ DEPLOYMENT - PASOS FINALES

### A. En tu máquina local
```bash
# 1. Asegurarte que todos los commits están pusheados
git push origin feature/enterprise-restructure-freemium

# 2. Merge a main (o tu rama de producción)
git checkout main
git merge feature/enterprise-restructure-freemium
git push origin main
```

### B. En el droplet (o esperar a que GitHub Actions lo haga)

**Si tienes GitHub Actions configurado:** El workflow automáticamente:
1. Build de la nueva imagen Docker
2. Pull de la imagen en el droplet
3. Restart de containers

**Si despliegas manualmente:**
```bash
ssh root@YOUR_DROPLET_IP
cd /ruta/a/tu/proyecto

# Pull de cambios
git pull origin main

# Rebuild de containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Ver logs
docker-compose logs -f vittasami-app
```

### C. Restart de Nginx
```bash
# Test de configuración
sudo nginx -t

# Reload de Nginx
sudo systemctl reload nginx

# O si estás usando Docker Nginx:
docker-compose restart nginx
```

---

## 8️⃣ VERIFICACIÓN POST-DEPLOYMENT

### A. Verificar que los servicios están corriendo
```bash
# Docker containers
docker ps

# Nginx
sudo systemctl status nginx

# Logs de Next.js
docker logs vittasami-production -f
```

### B. Probar endpoints

```bash
# Marketing site
curl -I https://vittasami.com
curl -I https://vittasami.com/pricing
curl -I https://vittasami.com/invest

# SaaS app
curl -I https://app.vittasami.lat
curl -I https://app.vittasami.lat/auth/login
```

### C. Probar en navegador

**Marketing:**
- https://vittasami.com → Landing page
- https://vittasami.com/pricing → Pricing page
- https://vittasami.com/invest → Investor page

**SaaS:**
- https://app.vittasami.lat → Debe redirigir a /dashboard o /auth/login
- https://app.vittasami.lat/dashboard → Dashboard

### D. Verificar headers de seguridad
```bash
curl -I https://vittasami.com | grep -E "(X-Frame|Content-Security|X-Content-Type)"
```

---

## 9️⃣ TROUBLESHOOTING

### Error: "502 Bad Gateway"
```bash
# Verificar que Next.js está corriendo
docker logs vittasami-production

# Verificar upstream
docker exec -it vittasami-nginx nginx -t
```

### Error: "SSL Certificate not found"
```bash
# Listar certificados
sudo certbot certificates

# Re-generar si es necesario
sudo certbot --nginx -d vittasami.com -d www.vittasami.com
```

### Error: "DNS not resolving"
```bash
# Verificar DNS
dig vittasami.com
dig app.vittasami.lat

# Flush DNS local (en tu máquina)
sudo dscacheutil -flushcache (macOS)
```

### Error: "Port already in use"
```bash
# Ver qué está usando el puerto 80/443
sudo lsof -i :80
sudo lsof -i :443

# Matar proceso si es necesario
sudo kill -9 PID
```

### Logs útiles
```bash
# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log

# Next.js logs
docker logs -f vittasami-production

# Todos los containers
docker-compose logs -f
```

---

## 🔟 MONITOREO Y MANTENIMIENTO

### A. Health checks
```bash
# API health
curl https://app.vittasami.lat/health

# Uptime monitoring (configurar en Digital Ocean)
Digital Ocean → Monitoring → Uptime Checks
```

### B. Backups automáticos
```bash
# Habilitar backups en Digital Ocean
Droplet → Settings → Backups → Enable
```

### C. Firewall
```bash
# Configurar UFW (si no está configurado)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
sudo ufw status
```

---

## 📊 CHECKLIST FINAL

- [ ] DNS configurado para vittasami.com
- [ ] DNS configurado para app.vittasami.lat
- [ ] DNS verificado (dig commands)
- [ ] SSL/TLS generado para ambos dominios
- [ ] nginx.conf actualizado con server blocks
- [ ] Variables de entorno actualizadas en .env
- [ ] GitHub Actions secrets configurados
- [ ] docker-compose.yml actualizado
- [ ] Código pusheado a main
- [ ] Deployment ejecutado
- [ ] Nginx reloaded
- [ ] Pruebas en navegador exitosas
- [ ] Headers de seguridad verificados
- [ ] Monitoring configurado

---

## 🚀 PRÓXIMOS PASOS

Una vez que todo funcione:

1. **Configurar email real** para `/api/contact-investor`
2. **Configurar Google Analytics** (opcional)
3. **Configurar Sentry** para error tracking (opcional)
4. **Configurar CDN** con CloudFlare (opcional, para mejor performance)
5. **Habilitar backups automáticos** en Digital Ocean

---

**📝 Notas Importantes:**

- Ambos dominios apuntan al **mismo container** de Next.js
- El **middleware** en Next.js maneja el routing según el hostname
- Nginx solo hace **reverse proxy**, no maneja la lógica de routing
- Los certificados SSL se **renuevan automáticamente** con certbot
- GitHub Actions hace el **deployment automático** en push a main
