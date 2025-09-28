# 🚀 Guía de Ejecución de Scripts para Configurar Autenticación

## ⚠️ IMPORTANTE
Ejecuta estos scripts **UNO POR UNO** en el orden indicado. No ejecutes varios a la vez.

## 📋 Orden de Ejecución

### 1. Configurar Supabase
```bash
./setup-supabase.sh
```
**Qué hace:**
- Te guía para linkear el proyecto local con Supabase remoto
- Proporciona las credenciales necesarias
- Te indica los comandos exactos a ejecutar

**IMPORTANTE:** Cuando te pida la database password, usa: `NdV2lVgNHzxXq2ZH`

### 2. Poblar Base de Datos
```bash
./populate-database.sh
```
**Qué hace:**
- Crea el tenant "Clínica San Rafael"
- Crea el doctor "Ana Rodríguez" con especialidad Cardiología
- Crea el servicio "Consulta Cardiología"

**Resultado esperado:** Datos básicos insertados en las tablas principales

### 3. Crear Usuarios de Autenticación
```bash
./create-users.sh
```
**Qué hace:**
- Crea 3 usuarios en Supabase Auth:
  - Admin: admin@clinicasanrafael.com / password
  - Doctor: ana.rodriguez@email.com / password
  - Paciente: patient@example.com / password
- Crea los perfiles correspondientes en user_profiles

**Resultado esperado:** 3 usuarios creados con IDs únicos

### 4. Probar Autenticación
```bash
./test-auth.sh
```
**Qué hace:**
- Verifica que los usuarios existen
- Prueba login con cada usuario
- Confirma que todos los datos están correctos

**Resultado esperado:** Todos los logins deben mostrar ✅

## 🔍 Verificación Final

Si todos los scripts se ejecutan correctamente, deberías ver:

```
🎯 RESUMEN:
================================
✅ Admin: OK
✅ Doctor: OK
✅ Paciente: OK

🚀 Si todos los usuarios están OK, ejecuta:
   npm test
```

## 🐛 Resolución de Problemas

### Si setup-supabase.sh falla:
```bash
# Instalar Supabase CLI si no está instalado
npm install -g @supabase/cli

# Login en Supabase
npx supabase login
```

### Si populate-database.sh falla:
- Revisa que el proyecto esté linkeado correctamente
- Verifica las credenciales en el script

### Si create-users.sh falla:
- Verifica que los datos básicos se crearon en el paso 2
- Revisa los logs de error en la respuesta

### Si test-auth.sh falla:
- Ejecuta cada script anterior nuevamente
- Verifica las credenciales manualmente en Supabase dashboard

## 🎯 Objetivo Final

Una vez que todos los scripts pasen:

```bash
npm test
```

Debería mostrar **100% de tests pasando** ✅

## 📞 Scripts Creados

1. `setup-supabase.sh` - Configuración inicial
2. `populate-database.sh` - Datos básicos
3. `create-users.sh` - Usuarios de auth
4. `test-auth.sh` - Verificación

**Total:** 4 scripts para configuración completa desde cero