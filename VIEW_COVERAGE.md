# 📊 Cómo Ver el Reporte de Coverage

## ✅ El coverage SÍ está funcionando

El mensaje que viste es normal - muestra que solo el **0.48%** del código total tiene tests, porque solo hemos testeado 2 archivos de ~150.

---

## 🎯 Ver el Reporte Visual

### Opción 1: Abrir en el Navegador

```bash
# Generar reporte
npm run test:coverage

# Abrir en el navegador
open coverage/index.html
```

O manualmente: Abre el archivo `coverage/index.html` en tu navegador.

---

## 📊 Lo que Verás en el Reporte

### Archivos Testeados ✅

1. **Button.tsx** - 100% coverage
   - Todas las líneas cubiertas
   - Todos los branches cubiertos

2. **custom-auth.ts** - 26.4% coverage
   - Password hashing: ✅ Testeado
   - JWT generation: ✅ Testeado
   - Redirect logic: ✅ Testeado
   - Database calls: ❌ Mockeadas (no cuentan)

### Estadísticas Generales

```
Total Files: ~150
Tested Files: 2
Coverage: 0.48%

Breakdown:
├─ Lines: 0.48%
├─ Functions: 40.11%
├─ Branches: 42.85%
└─ Statements: 0.48%
```

---

## 🎨 Leyenda de Colores

En el reporte HTML verás:

- 🟢 **Verde** - Código cubierto por tests
- 🔴 **Rojo** - Código sin tests
- 🟡 **Amarillo** - Código parcialmente cubierto

---

## 📈 Interpretación

### Es Normal que sea Bajo

La cobertura del 0.48% es **normal** porque:

1. Solo tenemos 2 archivos con tests
2. El proyecto tiene ~150 archivos
3. **Acabamos de empezar** con los tests

### Progreso Esperado

| Etapa | Archivos Testeados | Coverage |
|-------|-------------------|----------|
| **Ahora** | 2 | 0.48% |
| Semana 1 | 10 | ~5% |
| Semana 2 | 25 | ~15% |
| Mes 1 | 50 | ~30% |
| **Meta Q4** | 90+ | **60%** |

---

## 🚀 Siguiente Paso

Para aumentar el coverage, agrega tests para:

```bash
# Prioridad 1
src/lib/tenant-utils.ts
src/lib/stripe.ts
src/lib/notifications.ts

# Prioridad 2
src/components/AdminSidebar.tsx
src/components/AdminHeader.tsx
src/components/ui/Badge.tsx
```

---

## 🔍 Ver Coverage de un Archivo Específico

En el reporte HTML:

1. Haz click en cualquier carpeta (ej: `src/lib/`)
2. Haz click en un archivo (ej: `custom-auth.ts`)
3. Verás el código con colores mostrando qué está cubierto

---

## 📊 Coverage en la Terminal

Si prefieres ver en la terminal:

```bash
npm run test:coverage 2>&1 | grep -A 50 "% Coverage"
```

Verás una tabla como esta:

```
File                | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|--------
custom-auth.ts      |   26.4  |    58.33 |   47.05 |   26.4
Button.tsx          |    100  |      100 |     100 |    100
```

---

## ✨ Resumen

✅ **Coverage está funcionando correctamente**
✅ **Reporte HTML generado en `coverage/index.html`**
✅ **0.48% es normal para 2 archivos testeados**
✅ **A medida que agreguemos tests, subirá**

**Comando rápido:**
```bash
npm run test:coverage && open coverage/index.html
```

---

*Actualizado: October 1, 2025*
