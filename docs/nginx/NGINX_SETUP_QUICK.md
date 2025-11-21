# Guía Rápida - Configuración Nginx en Digital Ocean

## 📋 Prerequisitos

- Droplet de Digital Ocean con Ubuntu
- Node.js y PM2 instalados
- Next.js app corriendo en puerto 3000
- Acceso SSH al droplet

---

## 🚀 Instalación Paso a Paso

### 1️⃣ Instalar Nginx (si no lo tienes)

```bash
# SSH al droplet
ssh root@YOUR_DROPLET_IP

# Actualizar paquetes
sudo apt update

# Instalar Nginx
sudo apt install nginx -y

# Verificar instalación
nginx -v

# Iniciar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

### 2️⃣ Copiar Archivo de Configuración

**Opción A: Desde tu máquina local**
```bash
# En tu máquina local (no en el droplet)
cd /Users/alvaro/Projects/VittaSamiApp

# Copiar el archivo al droplet
scp docs/nginx-sites-available-vittasami.conf root@YOUR_DROPLET_IP:/etc/nginx/sites-available/vittasami
```

**Opción B: Crear directamente en el droplet**
```bash
# En el droplet
sudo nano /etc/nginx/sites-available/vittasami

# Copiar TODO el contenido de docs/nginx-sites-available-vittasami.conf
# Guardar: Ctrl+O, Enter, Ctrl+X
```

---

### 3️⃣ Eliminar Configuración Default (si existe)

```bash
# Deshabilitar sitio default
sudo rm /etc/nginx/sites-enabled/default

# O simplemente renombrarlo
sudo mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak
```

---

### 4️⃣ Habilitar Sitio VittaSami

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/vittasami /etc/nginx/sites-enabled/vittasami

# Verificar que el enlace se creó
ls -la /etc/nginx/sites-enabled/
```

---

### 5️⃣ Crear Directorio para Certbot

```bash
# Crear directorio para ACME challenge
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
```

---

### 6️⃣ Test de Configuración

```bash
# Probar configuración (IMPORTANTE!)
sudo nginx -t

# Deberías ver:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Si hay errores:**
- Revisa las rutas SSL (todavía no existen, lo haremos después)
- Por ahora solo asegúrate que no haya errores de sintaxis

---

### 7️⃣ Ajuste Temporal para SSL (Antes de Certbot)

Como los certificados SSL todavía no existen, necesitamos comentar temporalmente las líneas SSL:

```bash
sudo nano /etc/nginx/sites-available/vittasami

# Comentar las líneas de HTTPS (servers en puerto 443)
# Busca las secciones que empiezan con:
# server {
#     listen 443 ssl http2;
#     ...
# }

# Comenta TODO desde "server {" hasta el "}" correspondiente
# Para ambos dominios (vittasami.com y app.vittasami.lat)

# O simplemente deja solo el server block de puerto 80
```

**Archivo temporal mínimo:**
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name vittasami.com www.vittasami.com app.vittasami.lat;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### 8️⃣ Reload Nginx

```bash
# Test nuevamente
sudo nginx -t

# Si todo OK, reload
sudo systemctl reload nginx

# Verificar status
sudo systemctl status nginx
```

---

### 9️⃣ Verificar que Nginx está corriendo

```bash
# Ver procesos Nginx
ps aux | grep nginx

# Ver puertos
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Test con curl
curl http://YOUR_DROPLET_IP
```

---

### 🔟 Generar Certificados SSL con Certbot

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generar certificados para vittasami.com
sudo certbot --nginx -d vittasami.com -d www.vittasami.com

# Generar certificados para app.vittasami.lat
sudo certbot --nginx -d app.vittasami.lat

# Seguir instrucciones en pantalla:
# 1. Enter email
# 2. Agree to terms (Y)
# 3. Share email? (N o Y, tu elección)
# 4. Redirect HTTP to HTTPS? (2 - Redirect)
```

---

### 1️⃣1️⃣ Restaurar Configuración Completa

Una vez que los certificados se generaron:

```bash
# Volver a poner la configuración completa
sudo nano /etc/nginx/sites-available/vittasami

# Descomentar los server blocks HTTPS que comentaste antes
# O volver a copiar el archivo completo:
scp docs/nginx-sites-available-vittasami.conf root@YOUR_DROPLET_IP:/etc/nginx/sites-available/vittasami
```

---

### 1️⃣2️⃣ Test Final y Reload

```bash
# Test de configuración
sudo nginx -t

# Si todo OK, reload
sudo systemctl reload nginx

# Verificar logs en tiempo real
sudo tail -f /var/log/nginx/vittasami-marketing-access.log
sudo tail -f /var/log/nginx/vittasami-app-access.log
```

---

## ✅ Verificación Final

### Probar en Navegador:

1. **HTTP → HTTPS Redirect:**
   - http://vittasami.com → https://vittasami.com ✅
   - http://app.vittasami.lat → https://app.vittasami.lat ✅

2. **Marketing Site:**
   - https://vittasami.com ✅
   - https://vittasami.com/pricing ✅
   - https://vittasami.com/invest ✅

3. **SaaS App:**
   - https://app.vittasami.lat ✅
   - https://app.vittasami.lat/auth/login ✅
   - https://app.vittasami.lat/dashboard ✅

### Verificar SSL:

```bash
# Test SSL con curl
curl -I https://vittasami.com
curl -I https://app.vittasami.lat

# Ver certificados
sudo certbot certificates
```

### Verificar Headers de Seguridad:

```bash
curl -I https://vittasami.com | grep -E "(X-Frame|Strict-Transport|X-Content-Type)"

# Deberías ver:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
```

---

## 🔄 Renovación Automática SSL

Certbot configura automáticamente la renovación, pero verifica:

```bash
# Test de renovación (no renueva, solo simula)
sudo certbot renew --dry-run

# Ver timer de renovación automática
sudo systemctl status certbot.timer

# Ver cuando se ejecutará próximamente
sudo systemctl list-timers | grep certbot
```

---

## 🚨 Troubleshooting

### Error: "nginx: [emerg] bind() to 0.0.0.0:80 failed"
```bash
# Otro proceso está usando puerto 80
sudo lsof -i :80
sudo kill -9 PID_DEL_PROCESO
sudo systemctl restart nginx
```

### Error: "SSL certificate not found"
```bash
# Los certificados aún no existen
# Usa la configuración temporal (solo HTTP) primero
# Luego genera certificados con certbot
```

### Error: "502 Bad Gateway"
```bash
# La app de Next.js no está corriendo
pm2 status
pm2 start vittasami-app
pm2 logs vittasami-app
```

### Error: "Connection refused"
```bash
# Verificar que Next.js esté escuchando en puerto 3000
sudo netstat -tulpn | grep :3000
pm2 restart vittasami-app
```

---

## 📊 Logs Útiles

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/vittasami-marketing-access.log
sudo tail -f /var/log/nginx/vittasami-app-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/vittasami-marketing-error.log
sudo tail -f /var/log/nginx/vittasami-app-error.log

# PM2 logs
pm2 logs vittasami-app

# System logs
sudo journalctl -u nginx -f
```

---

## 🎯 Resumen de Comandos Rápidos

```bash
# Test configuración
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Ver status
sudo systemctl status nginx

# Ver certificados
sudo certbot certificates

# Renovar certificados (manual)
sudo certbot renew
```

---

**✅ Una vez completados todos estos pasos, tu sitio estará:**
- Corriendo en HTTPS
- Con certificados SSL válidos
- Headers de seguridad configurados
- Rate limiting activo
- Compression habilitada
- Logs organizados por dominio
