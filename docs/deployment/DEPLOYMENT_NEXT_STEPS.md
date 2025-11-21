# 🚀 VittaSami - Pasos Inmediatos de Deployment

## ⚠️ Estado Actual

Tu código está merged en `main` y GitHub Actions ha ejecutado el deployment automático. Sin embargo, hay un **conflicto en Nginx** que necesitas resolver en el droplet.

---

## 🔴 PASO 1A: Resolver Conflicto de Nginx (URGENTE)

### Error Actual:
```
nginx: [emerg] limit_req_zone "api" is already bound to key "$binary_remote_addr"
in /etc/nginx/sites-enabled/vittamed:2
```

### Solución (5 minutos):

```bash
# 1. SSH a tu droplet
ssh root@YOUR_DROPLET_IP

# 2. Verificar qué configs tienes
ls -la /etc/nginx/sites-enabled/

# 3. Eliminar el archivo VIEJO (vittamed)
sudo rm /etc/nginx/sites-enabled/vittamed

# 4. (Opcional) Hacer backup del archivo viejo
sudo mv /etc/nginx/sites-available/vittamed /etc/nginx/sites-available/vittamed.backup

# 5. Verificar que solo quede vittasami
ls -la /etc/nginx/sites-enabled/
# Debe mostrar SOLO: vittasami -> /etc/nginx/sites-available/vittasami

# 6. Test de configuración
sudo nginx -t
# Debe decir: "syntax is ok" y "test is successful"

# 7. Reload Nginx
sudo systemctl reload nginx

# 8. Verificar status
sudo systemctl status nginx
```

**📋 Documentación completa:** Ver `docs/FIX_NGINX_CONFLICT.md`

---

## 🔴 PASO 1B: Resolver Error SSL Cipher (URGENTE)

### Error Actual:
```bash
curl -I https://vittasami.com
# curl: (35) LibreSSL/3.3.6: error:1404B417:SSL routines:ST_CONNECT:sslv3 alert illegal parameter
```

### Diagnóstico:
- ✅ Certificados SSL válidos (Let's Encrypt)
- ✅ DNS correcto
- ❌ SSL Ciphers incompatibles

### Solución (10 minutos):

```bash
# 1. SSH a tu droplet
ssh root@178.128.148.111

# 2. Generar DH params (tarda 2-3 minutos)
sudo openssl dhparam -out /etc/nginx/dhparam.pem 2048

# 3. Copiar configuración actualizada con ciphers correctos
# Desde tu máquina local:
scp docs/nginx-sites-available-vittasami.conf root@178.128.148.111:/etc/nginx/sites-available/vittasami

# 4. Test de configuración
sudo nginx -t

# 5. Si todo OK, reload
sudo systemctl reload nginx

# 6. Verificar desde tu Mac
curl -I https://vittasami.com
# Debe mostrar: HTTP/2 200
```

**📋 Documentación completa:** Ver `docs/FIX_SSL_CIPHER_ERROR.md`

---

## 🟡 PASO 2: Verificar Deployment de GitHub Actions

```bash
# En tu máquina local
cd /Users/alvaro/Projects/VittaSamiApp

# Verificar último commit en main
git log main -1 --oneline

# Ver logs de GitHub Actions en:
# https://github.com/YOUR_USERNAME/VittaSamiApp/actions
```

**Buscar mensaje:** "✅ VittaSami deployed successfully!"

---

## 🟢 PASO 3: Configurar DNS (Si aún no lo hiciste)

### En Digital Ocean Dashboard:

1. **Ir a Networking → Domains**
2. **Agregar dominio:** `vittasami.com`
3. **Crear A records:**

| Type | Hostname | Value | TTL |
|------|----------|-------|-----|
| A | @ | YOUR_DROPLET_IP | 3600 |
| A | www | YOUR_DROPLET_IP | 3600 |
| A | app | YOUR_DROPLET_IP | 3600 |

4. **Esperar 5-15 minutos** para propagación DNS

### Verificar DNS:
```bash
# En tu máquina local
dig vittasami.com +short
dig www.vittasami.com +short
dig app.vittasami.lat +short

# Todos deben mostrar tu DROPLET_IP
```

---

## 🔐 PASO 4: Generar Certificados SSL

**IMPORTANTE:** Solo ejecutar DESPUÉS de que DNS esté propagado.

```bash
# SSH al droplet
ssh root@YOUR_DROPLET_IP

# 1. Instalar Certbot (si no lo tienes)
sudo apt install certbot python3-certbot-nginx -y

# 2. Generar certificados para vittasami.com
sudo certbot --nginx -d vittasami.com -d www.vittasami.com

# 3. Generar certificados para app.vittasami.lat
sudo certbot --nginx -d app.vittasami.lat

# 4. Seguir instrucciones en pantalla:
#    - Enter email
#    - Agree to terms (Y)
#    - Redirect HTTP to HTTPS? (2)

# 5. Test de configuración
sudo nginx -t

# 6. Reload Nginx
sudo systemctl reload nginx
```

**📋 Documentación completa:** Ver `docs/NGINX_SETUP_QUICK.md`

---

## ✅ PASO 5: Verificación Final

### 1. Verificar sitios en navegador:

**Marketing Site:**
- ✅ http://vittasami.com → debe redirigir a HTTPS
- ✅ https://vittasami.com
- ✅ https://vittasami.com/pricing
- ✅ https://vittasami.com/invest

**SaaS App:**
- ✅ http://app.vittasami.lat → debe redirigir a HTTPS
- ✅ https://app.vittasami.lat
- ✅ https://app.vittasami.lat/auth/login
- ✅ https://app.vittasami.lat/dashboard

### 2. Verificar SSL:
```bash
# Test desde tu máquina local
curl -I https://vittasami.com
curl -I https://app.vittasami.lat

# Debes ver: "HTTP/2 200" y headers de seguridad
```

### 3. Verificar Headers de Seguridad:
```bash
curl -I https://vittasami.com | grep -E "(X-Frame|Strict-Transport|X-Content-Type)"

# Debes ver:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
```

### 4. Verificar PM2 está corriendo:
```bash
# En el droplet
pm2 status

# Debe mostrar: vittasami-app | online
```

### 5. Ver logs en tiempo real:
```bash
# En el droplet

# Logs de PM2 (Next.js app)
pm2 logs vittasami-app

# Logs de Nginx
sudo tail -f /var/log/nginx/vittasami-marketing-access.log
sudo tail -f /var/log/nginx/vittasami-app-access.log
```

---

## 📊 Checklist de Deployment

- [ ] **Nginx conflict resuelto** (PASO 1A)
- [ ] **SSL ciphers actualizados** (PASO 1B)
- [ ] **GitHub Actions deployment exitoso** (PASO 2)
- [ ] **DNS configurado y propagado** (PASO 3)
- [ ] **Certificados SSL generados** (PASO 4)
- [ ] **Sitios accesibles vía HTTPS** (PASO 5.1)
- [ ] **SSL funcionando correctamente** (PASO 5.2)
- [ ] **Headers de seguridad presentes** (PASO 5.3)
- [ ] **PM2 corriendo la app** (PASO 5.4)
- [ ] **Logs sin errores** (PASO 5.5)

---

## 🚨 Troubleshooting Rápido

### Error: "502 Bad Gateway"
```bash
# La app de Next.js no está corriendo
pm2 restart vittasami-app
pm2 logs vittasami-app
```

### Error: "Connection refused"
```bash
# Verificar que Next.js esté escuchando en puerto 3000
sudo netstat -tulpn | grep :3000
pm2 restart vittasami-app
```

### Error: "SSL certificate not found"
```bash
# Los certificados aún no existen o DNS no está propagado
# 1. Verificar DNS primero
dig vittasami.com +short

# 2. Si DNS está OK, generar certificados
sudo certbot --nginx -d vittasami.com -d www.vittasami.com
```

### Error: "nginx: [emerg] bind() to 0.0.0.0:80 failed"
```bash
# Otro proceso está usando puerto 80
sudo lsof -i :80
sudo systemctl stop apache2  # Si Apache está corriendo
sudo systemctl restart nginx
```

---

## 📚 Documentación de Referencia

| Documento | Propósito |
|-----------|-----------|
| `FIX_NGINX_CONFLICT.md` | Resolver conflicto de zonas duplicadas |
| `NGINX_SETUP_QUICK.md` | Guía completa de instalación Nginx |
| `nginx-sites-available-vittasami.conf` | Archivo de configuración Nginx |
| `DIGITAL_OCEAN_SETUP.md` | Setup completo de Digital Ocean |

---

## 🎯 Próximos Pasos (Post-Deployment)

Una vez que todo esté funcionando:

1. **Configurar renovación automática SSL:**
   ```bash
   sudo certbot renew --dry-run
   ```

2. **Configurar monitoreo:**
   - Digital Ocean Monitoring
   - Uptime checks para ambos dominios

3. **Configurar backups:**
   - PM2 startup script: `pm2 startup`
   - PM2 save: `pm2 save`

4. **Variables de entorno:**
   - Verificar `.env` en el droplet tiene todas las variables
   - Especialmente: `NEXT_PUBLIC_DOMAIN_MAIN`, `NEXT_PUBLIC_DOMAIN_APP`

5. **Testing completo:**
   - Flujos de autenticación
   - Creación de tenants
   - Booking de citas
   - Procesamiento de pagos

---

## ✨ Estado Esperado Final

```
✅ GitHub Actions: Deployment exitoso
✅ Nginx: Configurado y corriendo
✅ SSL: Certificados válidos para ambos dominios
✅ DNS: Apuntando al droplet
✅ PM2: App corriendo en puerto 3000
✅ Seguridad: Headers configurados, rate limiting activo
✅ Logs: Organizados por dominio
✅ Redirects: HTTP → HTTPS funcionando
✅ Marketing: https://vittasami.com accesible
✅ SaaS App: https://app.vittasami.lat accesible
```

---

**💡 Tip:** Ejecuta los pasos en orden. No saltes al PASO 4 (SSL) hasta que DNS esté propagado (PASO 3).

**🆘 Ayuda:** Si encuentras errores, consulta `docs/FIX_NGINX_CONFLICT.md` o `docs/NGINX_SETUP_QUICK.md` para troubleshooting detallado.
