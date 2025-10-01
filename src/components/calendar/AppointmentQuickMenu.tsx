'use client'

import { Icons } from '@/components/ui/Icons'

interface AppointmentQuickMenuProps {
  position: { x: number; y: number }
  onClose: () => void
  onAddAppointment: () => void
  onAddGroupAppointment: () => void
  onAddBlockedTime: () => void
}

export default function AppointmentQuickMenu({
  position,
  onClose,
  onAddAppointment,
  onAddGroupAppointment,
  onAddBlockedTime
}: AppointmentQuickMenuProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Menu */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-64"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
      >
        <button
          onClick={() => {
            onAddAppointment()
            onClose()
          }}
          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
        >
          <Icons.calendar className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Add appointment</span>
        </button>

        <button
          onClick={() => {
            onAddGroupAppointment()
            onClose()
          }}
          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
        >
          <Icons.users className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Add group appointment</span>
        </button>

        <button
          onClick={() => {
            onAddBlockedTime()
            onClose()
          }}
          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
        >
          <Icons.xCircle className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Add blocked time</span>
        </button>

        <div className="border-t border-gray-200 mt-2 pt-2">
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-blue-600">Quick actions settings</span>
          </button>
        </div>
      </div>
    </>
  )
}
