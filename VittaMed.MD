# Prompt Maestro - VittaMed con módulo Fresha

## Objetivo
Rehacer **VittaMed** integrando un sistema de reservas tipo **Fresha**, usando **Next.js + Supabase**.  
Debe incluir: gestión de citas, agenda de doctores, pagos online, ficha de pacientes y notificaciones.  

## Reglas de Desarrollo
- **Framework principal:** Next.js (App Router).
- **Base de datos y auth:** Supabase.
- **Testing:** Playwright (e2e y pruebas de integración) bajo enfoque TDD.
- **Gestión de flujos y dependencias:** Context7.
- **Lenguaje:** TypeScript.
- **Infraestructura:** Arquitectura modular, multi-tenant.

## Funcionalidades iniciales (MVP Fresha by VittaMed)
1. **Gestión de Agenda**
   - Doctores definen horarios disponibles.
   - Pacientes pueden reservar online.
   - Reglas de disponibilidad (turnos, vacaciones).

2. **Reservas**
   - Selección de servicio + especialista + horario.
   - Confirmación automática.
   - Cancelación/reprogramación según políticas.

3. **Pagos**
   - Integración con Stripe (o equivalente).
   - Pago total o parcial al reservar.

4. **Pacientes**
   - Ficha básica integrada a la historia clínica.
   - Datos de contacto + notas de consultas previas.

5. **Notificaciones**
   - Recordatorio por email y/o WhatsApp.
   - Confirmación y follow-up post consulta.

## Arquitectura Multi-Tenant
- Cada clínica/consultorio es un **tenant**.
- La tabla `doctors` almacena datos generales del doctor.
- La tabla `tenants` almacena clínicas/consultorios.
- La tabla `doctor_tenants` define la relación muchos-a-muchos:
  - Permite asignar un mismo doctor a varios tenants.
  - Cada tenant ve solo su agenda y reservas.
- La tabla `appointments` referencia:
  - doctor_id
  - tenant_id
  - patient_id
  - servicio y horario
- **Clasificación de tenants:**
  - La tabla `tenants` tiene un campo `tenant_type` (ej: clínica, spa, consultorio).  
  - Permite filtrar dashboards, aplicar reglas de negocio por tipo y diferenciar reportes.
  - Opcionalmente, se puede crear un catálogo `tenant_types` para metadatos adicionales por tipo.

## Estándares de Código
- Usar **TDD**: primero escribir los tests, luego el código.
- Cada módulo debe incluir:
  - Test unitarios y de integración con Playwright.
  - Modelado de flujos y dependencias en Context7.

## Casos de prueba iniciales (ejemplos)

### Agenda
- Un doctor puede definir sus horarios de atención.
- Un paciente no puede reservar fuera de los horarios definidos.
- No se permite doble reserva en el mismo slot.

### Reservas
- Un paciente puede reservar una cita seleccionando doctor, servicio y horario.
- Al reservar, la cita se guarda en Supabase y queda pendiente de confirmación.
- Si otro paciente intenta reservar el mismo horario, debe fallar.

### Pagos
- Un paciente puede pagar una reserva con Stripe.
- Si el pago falla, la reserva no se confirma.
- Si el pago es exitoso, la reserva pasa a estado "confirmada".

### Notificaciones
- Al confirmar una cita, se envía un email de confirmación.
- 24 horas antes de la cita, se envía un recordatorio automático.

## Entregables
- Código modular en Next.js con Supabase.
- Carpeta `/tests` con todos los casos en Playwright.
- Modelado de flujos en Context7.
- Scripts de seed para la base de datos (ej: doctores demo, pacientes demo).
- Documentación técnica (README con setup local y tests).