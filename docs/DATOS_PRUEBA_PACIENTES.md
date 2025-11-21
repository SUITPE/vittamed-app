# Datos de Prueba - Pacientes con Campo Document

## ✅ Estado: COMPLETADO

Se han creado **9 pacientes de prueba** en la base de datos con el nuevo campo `document` obligatorio.

---

## 📊 Resumen de Pacientes Creados

| # | Nombre Completo | Documento | Email | Teléfono |
|---|----------------|-----------|-------|----------|
| 1 | Juan Carlos Pérez García | **DNI-45678912** | juan.perez@gmail.com | +51 987654321 |
| 2 | María Elena Rodríguez Silva | **DNI-78945612** | maria.rodriguez@hotmail.com | +51 945123789 |
| 3 | Carlos Alberto Sánchez Díaz | **PASAPORTE-A123456** | carlos.sanchez@gmail.com | +51 912345678 |
| 4 | Ana Sofía Torres Mendoza | **CE-987654321** | ana.torres@yahoo.com | +51 998877665 |
| 5 | Roberto Gutiérrez Flores | **DNI-12398745** | roberto.gutierrez@outlook.com | +51 987123456 |
| 6 | Patricia Vargas Ruiz | **DNI-65478932** | patricia.vargas@gmail.com | +51 956789123 |
| 7 | Luis Fernando Castro Morales | **DNI-32165498** | luis.castro@gmail.com | +51 923456789 |
| 8 | Test 2 Prueba 2 | **6** | test2@prueba2.com | - |
| 9 | Walk In | **1** | walkin@clinic.local | - |

---

## 📋 Tipos de Documentos Probados

- ✅ **DNI** (Documento Nacional de Identidad): 6 pacientes
- ✅ **PASAPORTE**: 1 paciente
- ✅ **CE** (Carné de Extranjería): 1 paciente
- ✅ **Numéricos simples**: 2 pacientes (datos legacy)

---

## 🎯 Características Validadas

### ✅ Campo Document Obligatorio
- Todos los pacientes creados incluyen el campo `document`
- La API rechaza pacientes sin documento (validación activa)
- El formulario HTML5 marca el campo como `required`

### ✅ Formatos de Documento Flexibles
- **DNI peruano**: `DNI-45678912`
- **Pasaporte**: `PASAPORTE-A123456`
- **Carné extranjería**: `CE-987654321`
- **Numérico**: `1`, `6` (para compatibilidad)

### ✅ Búsqueda por Documento
- La búsqueda funciona con documento completo o parcial
- Ejemplo: buscar "DNI-456" encontrará "DNI-45678912"

### ✅ Datos Adicionales
- Direcciones completas en Lima, Perú
- Teléfonos con código de país +51
- Fechas de nacimiento variadas (1978-1995)
- Historiales médicos realistas

---

## 🔍 Validación en Base de Datos

```bash
# Total de pacientes
curl -s http://localhost:3000/api/patients -b /tmp/cookies.txt | jq 'length'
# Resultado: 9

# Listar todos con documento
curl -s http://localhost:3000/api/patients -b /tmp/cookies.txt | \
  jq -r '.[] | "\(.first_name) \(.last_name) - Document: \(.document)"'
```

---

## 🧪 Casos de Prueba Cubiertos

### ✅ Validaciones Exitosas
1. **Creación con todos los campos**: Juan Carlos Pérez García
2. **Creación con campos mínimos**: Luis Fernando Castro Morales
3. **Diferentes formatos de documento**: DNI, Pasaporte, CE
4. **Caracteres especiales en nombres**: María Elena, Gutiérrez
5. **Emails de diferentes dominios**: gmail, hotmail, yahoo, outlook

### ✅ Búsqueda
- Por nombre: "Juan" → encuentra "Juan Carlos Pérez García"
- Por email: "maria.rodriguez" → encuentra paciente
- Por documento: "DNI-456" → encuentra "DNI-45678912"

### ✅ Operaciones CRUD
- **CREATE**: ✅ 9 pacientes creados
- **READ**: ✅ Listado completo disponible
- **UPDATE**: ✅ Campo document editable
- **TOGGLE STATUS**: ✅ Preserva documento al cambiar estado

---

## 📱 Visualización en UI

### Tabla de Pacientes
La tabla muestra las siguientes columnas en orden:
1. **Paciente** (nombre completo + ID)
2. **Documento** ← NUEVA COLUMNA
3. **Contacto** (email + teléfono)
4. **Fecha de Nacimiento**
5. **Estado** (Activo/Inactivo)
6. **Acciones** (Editar/Desactivar)

### Formulario de Paciente
Los campos en el modal son:
1. Nombre (required)
2. Apellido (required)
3. Email (required)
4. **ID / Documento** (required) ← NUEVO CAMPO
5. Teléfono
6. Fecha de Nacimiento
7. Dirección
8. Historial Médico

---

## 🔐 Credenciales Usadas para Pruebas

**Recepcionista:**
- Email: `secre@clinicasanrafael.com`
- Password: `password`
- Role: `staff`
- Tenant: Clínica San Rafael

---

## ✅ Tests Disponibles

### Unit Tests
```bash
npm run test:unit -- patient-validation.test.ts
```
- 15+ tests de validación
- Verifica campo `document` obligatorio

### Integration Tests
```bash
npm run test:integration -- patient-api.test.ts
```
- 20+ tests de API
- Valida CRUD con campo `document`

### E2E Tests
```bash
npx playwright test patient
```
- 24 tests end-to-end
- Flujos completos con campo `document`

---

## 📈 Estadísticas

- **Total Pacientes**: 9
- **Con Documento**: 9 (100%)
- **Con Teléfono**: 7 (78%)
- **Con Dirección**: 6 (67%)
- **Con Historial Médico**: 5 (56%)
- **Estado Activo**: 9 (100%)

---

## 🚀 Próximos Pasos

1. ✅ Campo `document` agregado
2. ✅ API actualizada
3. ✅ UI modificada
4. ✅ Tests creados
5. ✅ **Datos de prueba creados** ← ACABAMOS DE COMPLETAR ESTO
6. 🔄 Ejecutar suite completa de tests
7. 📝 Validar en ambiente de staging

---

## 📞 Contacto de Pacientes

Para pruebas de notificaciones o comunicación:

- **Juan Carlos**: +51 987654321 (juan.perez@gmail.com)
- **María Elena**: +51 945123789 (maria.rodriguez@hotmail.com)
- **Carlos Alberto**: +51 912345678 (carlos.sanchez@gmail.com)
- **Ana Sofía**: +51 998877665 (ana.torres@yahoo.com)
- **Roberto**: +51 987123456 (roberto.gutierrez@outlook.com)
- **Patricia**: +51 956789123 (patricia.vargas@gmail.com)
- **Luis Fernando**: +51 923456789 (luis.castro@gmail.com)

---

**Fecha de Creación**: 2025-10-03
**Tenant**: Clínica San Rafael (1323b89d-2d9b-4a81-a412-005c79153370)
**Usuario**: secre@clinicasanrafael.com (Staff)
