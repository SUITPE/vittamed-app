'use client'

import { Icons } from '@/components/ui/Icons'
import { RECORD_TYPE_CONFIG, SEVERITY_CONFIG } from '@/types/medical-history'
import type { MedicalRecordWithRelations, VitalSigns } from '@/types/medical-history'

interface MedicalRecordViewProps {
  record: MedicalRecordWithRelations
  onEdit?: () => void
  canEdit?: boolean
  showHeader?: boolean
  compact?: boolean
}

const VITAL_LABELS: Record<keyof VitalSigns, { label: string; unit: string; color: string }> = {
  temperature: { label: 'Temperatura', unit: '°C', color: 'blue' },
  blood_pressure_systolic: { label: 'Presión Sistólica', unit: 'mmHg', color: 'red' },
  blood_pressure_diastolic: { label: 'Presión Diastólica', unit: 'mmHg', color: 'red' },
  heart_rate: { label: 'Frecuencia Cardíaca', unit: 'bpm', color: 'pink' },
  respiratory_rate: { label: 'Frecuencia Respiratoria', unit: 'rpm', color: 'purple' },
  oxygen_saturation: { label: 'Saturación O₂', unit: '%', color: 'cyan' },
  weight: { label: 'Peso', unit: 'kg', color: 'green' },
  height: { label: 'Altura', unit: 'cm', color: 'teal' },
  bmi: { label: 'IMC', unit: '', color: 'indigo' }
}

export default function MedicalRecordView({
  record,
  onEdit,
  canEdit = false,
  showHeader = true,
  compact = false
}: MedicalRecordViewProps) {
  const config = RECORD_TYPE_CONFIG[record.record_type]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderVitalSigns = () => {
    if (!record.vital_signs || Object.keys(record.vital_signs).length === 0) {
      return null
    }

    const vitals = record.vital_signs

    // Handle blood pressure specially
    const hasBloodPressure = vitals.blood_pressure_systolic || vitals.blood_pressure_diastolic

    return (
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Icons.activity className="w-4 h-4 text-red-500" />
          Signos Vitales
        </h4>
        <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-3`}>
          {vitals.temperature && (
            <VitalCard
              label="Temperatura"
              value={`${vitals.temperature}°C`}
              color="blue"
            />
          )}
          {hasBloodPressure && (
            <VitalCard
              label="Presión Arterial"
              value={`${vitals.blood_pressure_systolic || '-'}/${vitals.blood_pressure_diastolic || '-'}`}
              color="red"
            />
          )}
          {vitals.heart_rate && (
            <VitalCard
              label="Frecuencia Cardíaca"
              value={`${vitals.heart_rate} bpm`}
              color="pink"
            />
          )}
          {vitals.respiratory_rate && (
            <VitalCard
              label="Frecuencia Respiratoria"
              value={`${vitals.respiratory_rate} rpm`}
              color="purple"
            />
          )}
          {vitals.oxygen_saturation && (
            <VitalCard
              label="Saturación O₂"
              value={`${vitals.oxygen_saturation}%`}
              color="cyan"
            />
          )}
          {vitals.weight && (
            <VitalCard
              label="Peso"
              value={`${vitals.weight} kg`}
              color="green"
            />
          )}
          {vitals.height && (
            <VitalCard
              label="Altura"
              value={`${vitals.height} cm`}
              color="teal"
            />
          )}
          {vitals.bmi && (
            <VitalCard
              label="IMC"
              value={vitals.bmi.toFixed(1)}
              color="indigo"
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Record Header */}
      {showHeader && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{config.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {config.label}
                </h3>
                <p className="text-sm text-gray-600">
                  {formatDate(record.record_date)}
                  {record.doctor_name && ` • Dr. ${record.doctor_name}`}
                </p>
              </div>
            </div>
            {canEdit && onEdit && (
              <button
                onClick={onEdit}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
              >
                <Icons.edit className="w-4 h-4" />
                Editar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Record Content */}
      <div className={`${compact ? 'p-4' : 'p-6'} space-y-4`}>
        {/* Chief Complaint */}
        {record.chief_complaint && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Icons.alertCircle className="w-4 h-4 text-orange-500" />
              Motivo de Consulta
            </h4>
            <p className="text-gray-700 bg-orange-50 p-3 rounded-lg border border-orange-100">
              {record.chief_complaint}
            </p>
          </div>
        )}

        {/* SOAP Notes */}
        <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
          {record.subjective && (
            <SOAPSection
              letter="S"
              title="Subjetivo"
              content={record.subjective}
              color="blue"
            />
          )}
          {record.objective && (
            <SOAPSection
              letter="O"
              title="Objetivo"
              content={record.objective}
              color="green"
            />
          )}
          {record.assessment && (
            <SOAPSection
              letter="A"
              title="Evaluación"
              content={record.assessment}
              color="purple"
            />
          )}
          {record.plan && (
            <SOAPSection
              letter="P"
              title="Plan"
              content={record.plan}
              color="orange"
            />
          )}
        </div>

        {/* Vital Signs */}
        {renderVitalSigns()}

        {/* Prescriptions */}
        {record.prescriptions && record.prescriptions.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-lg">💊</span>
              Recetas ({record.prescriptions.length})
            </h4>
            <div className="space-y-2">
              {record.prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="bg-purple-50 border border-purple-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {prescription.medication_name}
                      </div>
                      <div className="text-sm text-gray-700 mt-1">
                        {prescription.dosage} • {prescription.frequency}
                        {prescription.duration && ` • ${prescription.duration}`}
                        {prescription.quantity && ` • ${prescription.quantity}`}
                      </div>
                      {prescription.instructions && (
                        <div className="text-sm text-gray-600 mt-2 italic">
                          📝 {prescription.instructions}
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      prescription.status === 'active' ? 'bg-green-100 text-green-800' :
                      prescription.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      prescription.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {prescription.status === 'active' ? 'Activo' :
                       prescription.status === 'completed' ? 'Completado' :
                       prescription.status === 'cancelled' ? 'Cancelado' :
                       'Renovado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diagnoses */}
        {record.diagnoses && record.diagnoses.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-lg">🔬</span>
              Diagnósticos ({record.diagnoses.length})
            </h4>
            <div className="space-y-2">
              {record.diagnoses.map((diagnosis) => (
                <div
                  key={diagnosis.id}
                  className="bg-indigo-50 border border-indigo-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {diagnosis.diagnosis_name}
                      </div>
                      {diagnosis.diagnosis_code && (
                        <div className="text-sm text-gray-600 mt-1">
                          Código CIE-10: <span className="font-mono bg-gray-100 px-1 rounded">{diagnosis.diagnosis_code}</span>
                        </div>
                      )}
                      {diagnosis.notes && (
                        <div className="text-sm text-gray-700 mt-2">
                          {diagnosis.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {diagnosis.severity && SEVERITY_CONFIG[diagnosis.severity] && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${SEVERITY_CONFIG[diagnosis.severity].color}-100 text-${SEVERITY_CONFIG[diagnosis.severity].color}-800`}>
                          {SEVERITY_CONFIG[diagnosis.severity].label}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        diagnosis.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                        diagnosis.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        diagnosis.status === 'chronic' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {diagnosis.status === 'active' ? 'Activo' :
                         diagnosis.status === 'resolved' ? 'Resuelto' :
                         diagnosis.status === 'chronic' ? 'Crónico' :
                         'Descartado'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        {record.attachments && record.attachments.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Icons.fileText className="w-4 h-4" />
              Archivos Adjuntos ({record.attachments.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {record.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {attachment.type === 'image' && <Icons.eye className="w-4 h-4 text-blue-500" />}
                  {attachment.type === 'pdf' && <Icons.fileText className="w-4 h-4 text-red-500" />}
                  {attachment.type === 'document' && <Icons.fileText className="w-4 h-4 text-green-500" />}
                  {attachment.type === 'other' && <Icons.download className="w-4 h-4 text-gray-500" />}
                  <span className="text-sm text-gray-700">{attachment.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Record Metadata */}
        <div className="border-t border-gray-200 pt-4 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>
              Creado: {new Date(record.created_at).toLocaleString('es-ES')}
            </span>
            {record.updated_at !== record.created_at && (
              <span>
                Actualizado: {new Date(record.updated_at).toLocaleString('es-ES')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Sub-components
function SOAPSection({ letter, title, content, color }: {
  letter: string
  title: string
  content: string
  color: string
}) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  }

  return (
    <div>
      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <span className={`${colorClasses[color]} font-bold`}>{letter}</span>
        {title}
      </h4>
      <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
        {content}
      </p>
    </div>
  )
}

function VitalCard({ label, value, color }: {
  label: string
  value: string
  color: string
}) {
  const bgClasses: Record<string, string> = {
    blue: 'bg-blue-50',
    red: 'bg-red-50',
    pink: 'bg-pink-50',
    purple: 'bg-purple-50',
    cyan: 'bg-cyan-50',
    green: 'bg-green-50',
    teal: 'bg-teal-50',
    indigo: 'bg-indigo-50'
  }

  return (
    <div className={`${bgClasses[color]} p-3 rounded-lg`}>
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
    </div>
  )
}

// Export named for convenience
export { MedicalRecordView }
