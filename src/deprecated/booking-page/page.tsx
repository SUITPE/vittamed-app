// 'use client'

// DEPRECATED: Esta página ha sido deshabilitada
// La funcionalidad de crear citas ahora se maneja desde la página de appointments
// con modales y flujos específicos por rol (admin, receptionist, doctor, staff)

export default function BookingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Página No Disponible</h1>
        <p className="text-gray-600 mb-6">
          Esta función ha sido movida. Por favor, crea citas desde la página de Gestión de Citas.
        </p>
        <a
          href="/appointments"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ir a Gestión de Citas
        </a>
      </div>
    </div>
  )
}
