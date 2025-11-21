#!/bin/bash

# =========================================
# VittaSami - Quick SSL Fix Script
# =========================================
# Este script automatiza el fix del error de SSL cipher
#
# IMPORTANTE: Ejecutar esto EN EL DROPLET, no en tu Mac
#
# Uso:
#   chmod +x fix-ssl-quick.sh
#   ./fix-ssl-quick.sh
# =========================================

set -e  # Exit on error

echo "🔧 VittaSami - SSL Cipher Fix"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  Este script debe ejecutarse como root"
    echo "Por favor ejecuta: sudo ./fix-ssl-quick.sh"
    exit 1
fi

echo "✅ Corriendo como root"
echo ""

# Step 1: Check if dhparam exists
echo "📋 Paso 1: Verificando DH params..."
if [ ! -f /etc/nginx/dhparam.pem ]; then
    echo "⏳ Generando dhparam.pem (esto tarda 2-3 minutos)..."
    openssl dhparam -out /etc/nginx/dhparam.pem 2048
    echo "✅ dhparam.pem generado"
else
    echo "✅ dhparam.pem ya existe"
fi
echo ""

# Step 2: Backup current config
echo "📋 Paso 2: Backup de configuración actual..."
if [ -f /etc/nginx/sites-available/vittasami ]; then
    cp /etc/nginx/sites-available/vittasami /etc/nginx/sites-available/vittasami.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup creado"
else
    echo "⚠️  No se encontró configuración de vittasami"
    echo "El archivo debería estar en: /etc/nginx/sites-available/vittasami"
    exit 1
fi
echo ""

# Step 3: Update SSL ciphers
echo "📋 Paso 3: Actualizando SSL ciphers..."

# Define new cipher configuration
NEW_CIPHERS="'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384'"

# Backup and update config using sed
sed -i.bak \
    -e "s|ssl_ciphers.*|ssl_ciphers $NEW_CIPHERS;|g" \
    -e "/ssl_prefer_server_ciphers/a\    ssl_dhparam /etc/nginx/dhparam.pem;  # Added by fix script" \
    /etc/nginx/sites-available/vittasami

echo "✅ Configuración actualizada"
echo ""

# Step 4: Test nginx configuration
echo "📋 Paso 4: Testing configuración de Nginx..."
if nginx -t; then
    echo "✅ Configuración válida"
else
    echo "❌ Error en configuración de Nginx"
    echo "Restaurando backup..."
    mv /etc/nginx/sites-available/vittasami.backup.* /etc/nginx/sites-available/vittasami
    exit 1
fi
echo ""

# Step 5: Reload nginx
echo "📋 Paso 5: Reloading Nginx..."
systemctl reload nginx
echo "✅ Nginx reloaded"
echo ""

# Step 6: Verify
echo "📋 Paso 6: Verificando SSL..."
sleep 2  # Wait for reload to complete

# Test local connection
if curl -k -I https://localhost > /dev/null 2>&1; then
    echo "✅ SSL funcionando localmente"
else
    echo "⚠️  No se pudo verificar SSL localmente"
fi
echo ""

# Display summary
echo "================================"
echo "✨ Fix completado exitosamente!"
echo "================================"
echo ""
echo "Próximos pasos:"
echo "1. Desde tu Mac, ejecuta: curl -I https://vittasami.com"
echo "2. Deberías ver: HTTP/2 200"
echo "3. Prueba en navegador: https://vittasami.com"
echo ""
echo "Backups creados en:"
echo "- /etc/nginx/sites-available/vittasami.backup.*"
echo ""
echo "Ver logs:"
echo "- sudo tail -f /var/log/nginx/error.log"
echo "- sudo tail -f /var/log/nginx/vittasami-marketing-access.log"
echo ""
