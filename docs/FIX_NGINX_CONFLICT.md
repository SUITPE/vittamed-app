# Solución: Conflicto de Nginx - Rate Limiting Zones

## 🚨 Error:
```
nginx: [emerg] limit_req_zone "api" is already bound to key "$binary_remote_addr" in /etc/nginx/sites-enabled/vittamed:2
nginx: configuration file /etc/nginx/nginx.conf test failed
```

## 🔍 Causa:
Tienes DOS archivos de configuración que definen las mismas zonas de rate limiting:
1. `/etc/nginx/sites-enabled/vittamed` (viejo)
2. `/etc/nginx/sites-enabled/vittasami` (nuevo)

Nginx no permite zonas duplicadas.

---

## ✅ SOLUCIÓN - Paso a Paso

### 1️⃣ Ver qué archivos tienes en sites-enabled

```bash
# SSH al droplet
ssh root@YOUR_IP

# Listar archivos habilitados
ls -la /etc/nginx/sites-enabled/

# Deberías ver algo como:
# vittamed -> /etc/nginx/sites-available/vittamed
# vittasami -> /etc/nginx/sites-available/vittasami
```

### 2️⃣ Deshabilitar el archivo VIEJO (vittamed)

```bash
# Eliminar el enlace simbólico viejo
sudo rm /etc/nginx/sites-enabled/vittamed

# Verificar que se eliminó
ls -la /etc/nginx/sites-enabled/
```

### 3️⃣ (Opcional) Backup del archivo viejo

Si quieres conservarlo para referencia:

```bash
# Mover el archivo viejo a backup
sudo mv /etc/nginx/sites-available/vittamed /etc/nginx/sites-available/vittamed.backup

# O solo renombrarlo
sudo mv /etc/nginx/sites-available/vittamed /etc/nginx/sites-available/vittamed.old
```

### 4️⃣ Verificar que SOLO quede vittasami

```bash
# Listar sites-enabled
ls -la /etc/nginx/sites-enabled/

# Debería mostrar SOLO:
# vittasami -> /etc/nginx/sites-available/vittasami
```

### 5️⃣ Test de Configuración

```bash
# Probar configuración
sudo nginx -t

# Ahora debería pasar sin errores:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 6️⃣ Reload Nginx

```bash
# Si el test pasó, reload
sudo systemctl reload nginx

# Verificar status
sudo systemctl status nginx
```

---

## 🔧 SOLUCIÓN ALTERNATIVA - Mover Rate Limiting a nginx.conf

Si prefieres mantener ambos archivos, mueve las definiciones de rate limiting al archivo principal:

### Opción B1: Editar nginx.conf

```bash
# Editar nginx.conf
sudo nano /etc/nginx/nginx.conf

# Dentro del bloque http { ... }, ANTES de los includes, agregar:
```

```nginx
http {
    # ... otras configuraciones ...

    # Rate limiting zones (GLOBAL)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

    # Include configs
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

### Opción B2: Eliminar de vittasami.conf

```bash
# Editar el archivo vittasami
sudo nano /etc/nginx/sites-available/vittasami

# ELIMINAR estas 3 líneas del inicio:
# limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
# limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
# (línea en blanco)

# El archivo debe empezar directamente con:
# Upstream to PM2 application
# upstream vittasami_app {
```

---

## ✅ RECOMENDACIÓN

**Usa la Solución 1** (eliminar vittamed viejo) porque:
- ✅ Más limpio
- ✅ Evita confusión
- ✅ vittamed es la versión vieja
- ✅ vittasami es la versión actualizada

---

## 🔍 Verificación Final

```bash
# 1. Ver qué está habilitado
ls -la /etc/nginx/sites-enabled/

# 2. Test de configuración
sudo nginx -t

# 3. Ver procesos Nginx
ps aux | grep nginx

# 4. Ver puertos
sudo netstat -tulpn | grep nginx

# 5. Test con curl
curl -I http://YOUR_DROPLET_IP
```

---

## 📋 Checklist

- [ ] Eliminado `/etc/nginx/sites-enabled/vittamed`
- [ ] Solo existe `/etc/nginx/sites-enabled/vittasami`
- [ ] `sudo nginx -t` pasa sin errores
- [ ] `sudo systemctl reload nginx` exitoso
- [ ] Sitio accesible en http://YOUR_IP
- [ ] Logs sin errores: `sudo tail /var/log/nginx/error.log`

---

## 🚨 Si Aún Hay Errores

### Error: "nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)"

```bash
# Otro proceso usa puerto 80
sudo lsof -i :80

# Si es Apache u otro servidor web
sudo systemctl stop apache2
sudo systemctl disable apache2

# Restart Nginx
sudo systemctl restart nginx
```

### Error: "could not build server_names_hash"

```bash
# Editar nginx.conf
sudo nano /etc/nginx/nginx.conf

# Dentro de http { ... }, agregar:
server_names_hash_bucket_size 64;
```

### Ver logs en tiempo real

```bash
# Ver errores
sudo tail -f /var/log/nginx/error.log

# Ver accesos
sudo tail -f /var/log/nginx/access.log

# Ver todo junto
sudo tail -f /var/log/nginx/*.log
```

---

## 🎯 Comandos Rápidos de Recuperación

```bash
# Reinicio completo de Nginx
sudo systemctl stop nginx
sudo systemctl start nginx
sudo systemctl status nginx

# Ver configuración actual
nginx -V

# Ver qué archivos se están cargando
sudo nginx -T

# Verificar sintaxis sin aplicar
sudo nginx -t -c /etc/nginx/nginx.conf
```
