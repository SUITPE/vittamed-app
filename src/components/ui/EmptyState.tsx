'use client'

import { cn } from "@/lib/utils"
import { Button } from "./Button"
import { Icons } from "./Icons"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * EmptyState component for when there's no data to display
 * Shows an icon, title, description, and optional action buttons
 */
export function EmptyState({
  icon: Icon = Icons.inbox,
  title,
  description,
  action,
  secondaryAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      {/* Icon container with VittaSami primary color */}
      <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#40C9C6]" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-[#003A47] mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-500 text-sm max-w-sm mb-6">
        {description}
      </p>

      {/* Action buttons */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button onClick={action.onClick}>
              {action.icon && <action.icon className="w-4 h-4 mr-2" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Pre-built empty states for common scenarios
 */

export function EmptyPatients({ onAddPatient }: { onAddPatient: () => void }) {
  return (
    <EmptyState
      icon={Icons.users}
      title="No hay pacientes registrados"
      description="Comienza agregando tu primer paciente para gestionar sus citas y expedientes."
      action={{
        label: "Agregar Paciente",
        onClick: onAddPatient,
        icon: Icons.userPlus
      }}
    />
  )
}

export function EmptyAppointments({ onCreateAppointment }: { onCreateAppointment: () => void }) {
  return (
    <EmptyState
      icon={Icons.calendarDays}
      title="Sin citas programadas"
      description="No hay citas para mostrar. Agenda una nueva cita para comenzar."
      action={{
        label: "Nueva Cita",
        onClick: onCreateAppointment,
        icon: Icons.plus
      }}
    />
  )
}

export function EmptyServices({ onAddService }: { onAddService: () => void }) {
  return (
    <EmptyState
      icon={Icons.stethoscope}
      title="No hay servicios configurados"
      description="Configura los servicios que ofreces para que tus pacientes puedan agendar citas."
      action={{
        label: "Agregar Servicio",
        onClick: onAddService,
        icon: Icons.plus
      }}
    />
  )
}

export function EmptySearch({ searchTerm, onClear }: { searchTerm: string; onClear: () => void }) {
  return (
    <EmptyState
      icon={Icons.search}
      title="Sin resultados"
      description={`No encontramos resultados para "${searchTerm}". Intenta con otros términos.`}
      action={{
        label: "Limpiar búsqueda",
        onClick: onClear
      }}
    />
  )
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={Icons.bell}
      title="Sin notificaciones"
      description="No tienes notificaciones nuevas. Te avisaremos cuando haya algo importante."
    />
  )
}

export function EmptyMedicalRecords({ onCreateRecord }: { onCreateRecord: () => void }) {
  return (
    <EmptyState
      icon={Icons.fileText}
      title="Sin historial médico"
      description="Este paciente aún no tiene registros médicos. Crea el primer registro de consulta."
      action={{
        label: "Crear Registro",
        onClick: onCreateRecord,
        icon: Icons.plus
      }}
    />
  )
}

export function ErrorState({
  title = "Algo salió mal",
  description = "Ocurrió un error al cargar los datos. Intenta de nuevo.",
  onRetry
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <EmptyState
      icon={Icons.alertCircle}
      title={title}
      description={description}
      action={onRetry ? {
        label: "Reintentar",
        onClick: onRetry,
        icon: Icons.refreshCw
      } : undefined}
    />
  )
}
