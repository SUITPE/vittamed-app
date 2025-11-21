# Agregar Redirect: vittasami.lat → app.vittasami.lat

## Problema

`https://vittasami.lat/` está respondiendo con un backend en `/get` en lugar de la aplicación.

## Solución

Redirigir `vittasami.lat` y `www.vittasami.lat` → `app.vittasami.lat`

---

## 🚀 Pasos para Aplicar

### Paso 1: Generar Certificado SSL para vittasami.lat

**En el droplet:**

```bash
# Generar certificado para vittasami.lat
sudo certbot --nginx -d vittasami.lat -d www.vittasami.lat

# Seguir instrucciones:
# 1. Enter email
# 2. Agree to terms (Y)
# 3. Redirect HTTP to HTTPS? (2)
```

### Paso 2: Actualizar Configuración de Nginx

**Desde tu Mac:**

```bash
# Copiar configuración actualizada al droplet
scp docs/nginx-sites-available-vittasami.conf root@178.128.148.111:/etc/nginx/sites-available/vittasami
```

**En el droplet:**

```bash
# Test de configuración
sudo nginx -t

# Si pasa, reload
sudo systemctl reload nginx
```

### Paso 3: Verificar

**Desde tu Mac:**

```bash
curl -I http://vittasami.lat
# Debe mostrar: 301 → https://app.vittasami.lat

curl -I https://vittasami.lat
# Debe mostrar: 301 → https://app.vittasami.lat

curl -I https://www.vittasami.lat
# Debe mostrar: 301 → https://app.vittasami.lat
```

**En navegador:**
- http://vittasami.lat → https://app.vittasami.lat ✅
- https://vittasami.lat → https://app.vittasami.lat ✅
- https://www.vittasami.lat → https://app.vittasami.lat ✅

---

## 📋 Configuración Agregada

```nginx
# =========================================
# VITTASAMI.LAT → APP.VITTASAMI.LAT Redirect
# =========================================
server {
    listen 80;
    listen [::]:80;
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name vittasami.lat www.vittasami.lat;

    # SSL Configuration (if accessed via HTTPS)
    ssl_certificate /etc/letsencrypt/live/vittasami.lat/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vittasami.lat/privkey.pem;
    include snippets/ssl-params.conf;

    # Redirect everything to app.vittasami.lat
    return 301 https://app.vittasami.lat$request_uri;
}
```

---

## 🔍 Troubleshooting

### Error: "SSL certificate not found"

Si al hacer `nginx -t` sale error de certificado:

```bash
# El certificado aún no existe
# Primero genera el certificado (Paso 1)
sudo certbot --nginx -d vittasami.lat -d www.vittasami.lat
```

### Error: "Domain validation failed"

Si Certbot no puede validar el dominio:

```bash
# 1. Verifica que el DNS apunte al droplet
dig vittasami.lat +short
# Debe mostrar: 178.128.148.111

# 2. Si DNS no está configurado, agrégalo en Digital Ocean:
# - Tipo: A
# - Hostname: @
# - Value: 178.128.148.111
# - TTL: 3600

# - Tipo: A
# - Hostname: www
# - Value: 178.128.148.111
# - TTL: 3600
```

### Opción Temporal (Sin SSL)

Si quieres que funcione YA sin esperar SSL:

```nginx
# Solo HTTP redirect (temporal)
server {
    listen 80;
    listen [::]:80;
    server_name vittasami.lat www.vittasami.lat;

    return 301 https://app.vittasami.lat$request_uri;
}
```

---

## ✅ Resultado Esperado

Todos estos dominios redirigen a `app.vittasami.lat`:
- ✅ http://vittasami.lat
- ✅ https://vittasami.lat
- ✅ http://www.vittasami.lat
- ✅ https://www.vittasami.lat

Mientras que estos funcionan normalmente:
- ✅ https://vittasami.com → Landing page de marketing
- ✅ https://www.vittasami.com → Landing page de marketing
- ✅ https://app.vittasami.lat → Aplicación SaaS
