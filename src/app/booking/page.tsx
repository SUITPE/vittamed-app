'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tenant, Service, Doctor, Appointment } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Icons } from '@/components/ui/Icons'

interface BookingForm {
  tenant_id: string
  service_id: string
  provider_type: 'doctor' | 'member' | '' // VT-37: Provider type selection
  doctor_id: string
  member_id: string // VT-37: Member selection support
  appointment_date: string
  start_time: string
  patient_first_name: string
  patient_last_name: string
  patient_email: string
  patient_phone: string
}

// VT-37: Member interface for booking
interface Member {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  full_name: string
}

// Interface for member data from API
interface AvailableMember {
  member_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  full_name: string
}

// Interface for time slot data from API
interface TimeSlot {
  time: string
  is_available: boolean
}

interface FormErrors {
  patient_first_name?: string
  patient_last_name?: string
  patient_email?: string
}

export default function BookingPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [members, setMembers] = useState<Member[]>([]) // VT-37: Member state
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [appointment, setAppointment] = useState<Appointment | null>(null)

  const [form, setForm] = useState<BookingForm>({
    tenant_id: '',
    service_id: '',
    provider_type: '', // VT-37: Provider type selection
    doctor_id: '',
    member_id: '', // VT-37: Member selection support
    appointment_date: '',
    start_time: '',
    patient_first_name: '',
    patient_last_name: '',
    patient_email: '',
    patient_phone: ''
  })

  // Load tenants on component mount
  useEffect(() => {
    fetchTenants()
  }, [])

  // Load services when tenant changes
  useEffect(() => {
    if (form.tenant_id) {
      fetchServices(form.tenant_id)
      setForm(prev => ({ ...prev, service_id: '', provider_type: '', doctor_id: '', member_id: '', start_time: '' }))
      setServices([])
      setDoctors([])
      setMembers([]) // VT-37: Reset members
      setTimeSlots([])
      setSelectedService(null)
    }
  }, [form.tenant_id])

  // VT-37: Load providers (doctors and members) when service changes
  useEffect(() => {
    if (form.tenant_id && form.service_id) {
      // Reset provider selection
      setForm(prev => ({ ...prev, provider_type: '', doctor_id: '', member_id: '', start_time: '' }))
      setTimeSlots([])

      // Find selected service
      const service = services.find(s => s.id === form.service_id)
      setSelectedService(service || null)

      // Fetch both doctors and members for this service
      fetchDoctors(form.tenant_id)
      fetchAvailableMembers(form.service_id, form.tenant_id)
    }
  }, [form.service_id, services, form.tenant_id])

  // VT-37: Load time slots when provider and date change
  useEffect(() => {
    if (form.tenant_id && form.appointment_date) {
      if (form.provider_type === 'doctor' && form.doctor_id) {
        fetchDoctorAvailability(form.doctor_id, form.appointment_date, form.tenant_id)
        setForm(prev => ({ ...prev, start_time: '' }))
      } else if (form.provider_type === 'member' && form.member_id) {
        fetchMemberAvailability(form.member_id, form.appointment_date, form.tenant_id)
        setForm(prev => ({ ...prev, start_time: '' }))
      }
    }
  }, [form.provider_type, form.doctor_id, form.member_id, form.appointment_date, form.tenant_id])

  async function fetchTenants() {
    try {
      const response = await fetch('/api/tenants')
      const data = await response.json()
      setTenants(data)
    } catch (error) {
      console.error('Error fetching tenants:', error)
    }
  }

  async function fetchServices(tenantId: string) {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/services`)
      const data = await response.json()
      setServices(data)
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  async function fetchDoctors(tenantId: string) {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/doctors`)
      const data = await response.json()
      setDoctors(data)
    } catch (error) {
      console.error('Error fetching doctors:', error)
    }
  }

  // VT-37: Fetch doctor availability (existing logic)
  async function fetchDoctorAvailability(doctorId: string, date: string, tenantId: string) {
    try {
      const response = await fetch(
        `/api/availability?doctorId=${doctorId}&date=${date}&tenantId=${tenantId}`
      )
      const data = await response.json()
      setTimeSlots(data)
    } catch (error) {
      console.error('Error fetching doctor availability:', error)
    }
  }

  // VT-37: Fetch available members for a service (using VT-36 API)
  async function fetchAvailableMembers(serviceId: string, tenantId: string) {
    try {
      const response = await fetch(
        `/api/services/${serviceId}/available-members?tenant_id=${tenantId}`
      )
      const data = await response.json()

      if (data.available_members) {
        // Format members for the UI
        const formattedMembers = data.available_members.map((member: AvailableMember) => ({
          id: member.member_id,
          first_name: member.first_name,
          last_name: member.last_name,
          email: member.email,
          full_name: member.full_name
        }))
        setMembers(formattedMembers)
      }
    } catch (error) {
      console.error('Error fetching available members:', error)
      setMembers([])
    }
  }

  // VT-37: Fetch member availability (using VT-18 API)
  async function fetchMemberAvailability(memberId: string, date: string, tenantId: string) {
    try {
      const response = await fetch(
        `/api/members/${memberId}/availability?date=${date}&tenant_id=${tenantId}&generate_slots=true`
      )
      const data = await response.json()

      if (data.time_slots) {
        // Extract only available time slots
        const availableSlots = data.time_slots
          .filter((slot: TimeSlot) => slot.is_available)
          .map((slot: TimeSlot) => slot.time)
        setTimeSlots(availableSlots)
      }
    } catch (error) {
      console.error('Error fetching member availability:', error)
      setTimeSlots([])
    }
  }

  function validateForm(): boolean {
    const newErrors: FormErrors = {}

    if (!form.patient_first_name.trim()) {
      newErrors.patient_first_name = 'Nombre es requerido'
    }

    if (!form.patient_last_name.trim()) {
      newErrors.patient_last_name = 'Apellido es requerido'
    }

    if (!form.patient_email.trim()) {
      newErrors.patient_email = 'Email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(form.patient_email)) {
      newErrors.patient_email = 'Email no es válido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Use Context7 flow for appointment booking
      const { flowEngine } = await import('@/flows/FlowEngine')
      await import('@/flows/AppointmentBookingFlow') // Ensure flow is registered

      // Prepare flow context
      const flowContext = {
        user: {
          id: 'temp-user', // In real app, this would come from auth
          email: form.patient_email,
          role: 'patient' as const
        },
        tenant: {
          id: form.tenant_id,
          name: tenants.find(t => t.id === form.tenant_id)?.name || '',
          type: tenants.find(t => t.id === form.tenant_id)?.tenant_type || 'clinic'
        },
        appointment: {
          id: '', // Will be set by flow
          doctor_id: form.provider_type === 'doctor' ? form.doctor_id : undefined, // VT-37: Conditional doctor_id
          member_id: form.provider_type === 'member' ? form.member_id : undefined, // VT-37: Support member_id
          patient_id: '', // Will be set by flow
          service_id: form.service_id,
          date: form.appointment_date,
          time: form.start_time,
          status: 'pending' as const
        },
        payment: {
          amount: selectedService?.price || 0,
          currency: 'usd',
          status: 'pending' as const
        }
      }

      // Execute the appointment booking flow
      const result = await flowEngine.executeFlow('appointment_booking', flowContext)

      // Convert result to expected format for UI
      const appointmentData = {
        id: result.appointment?.id,
        patient: {
          first_name: form.patient_first_name,
          last_name: form.patient_last_name
        },
        doctor: form.provider_type === 'doctor' ? {
          first_name: doctors.find(d => d.id === form.doctor_id)?.first_name,
          last_name: doctors.find(d => d.id === form.doctor_id)?.last_name
        } : undefined, // VT-37: Conditional doctor data
        member: form.provider_type === 'member' ? {
          first_name: members.find(m => m.id === form.member_id)?.first_name,
          last_name: members.find(m => m.id === form.member_id)?.last_name
        } : undefined, // VT-37: Member data
        service: {
          name: selectedService?.name
        },
        appointment_date: result.appointment?.date,
        start_time: result.appointment?.time,
        total_amount: result.payment?.amount
      }

      setAppointment(appointmentData)
    } catch (error) {
      console.error('Error in appointment booking flow:', error)
      alert('Error al crear la cita. Por favor intente nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-12">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-elegant">
              <CardContent className="p-8">
                <div data-testid="booking-success" className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 bg-gradient-success rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <Icons.checkCircle className="w-8 h-8 text-white" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-gray-900 mb-6"
                  >
                    ¡Cita reservada exitosamente!
                  </motion.h2>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    data-testid="appointment-details"
                    className="bg-gray-50 rounded-xl p-6 space-y-4 text-left mb-6"
                  >
                    <div className="flex items-center space-x-3">
                      <Icons.user className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Paciente</p>
                        <p className="font-medium">{appointment.patient?.first_name} {appointment.patient?.last_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Icons.stethoscope className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Doctor</p>
                        <p className="font-medium">{appointment.doctor?.first_name} {appointment.doctor?.last_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Icons.activity className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Servicio</p>
                        <p className="font-medium">{appointment.service?.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Icons.calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Fecha y Hora</p>
                        <p className="font-medium">{appointment.appointment_date} a las {appointment.start_time}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Icons.dollarSign className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="font-medium text-lg">${appointment.total_amount}</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      onClick={() => {
                        setAppointment(null)
                        setForm({
                          tenant_id: '',
                          service_id: '',
                          doctor_id: '',
                          appointment_date: '',
                          start_time: '',
                          patient_first_name: '',
                          patient_last_name: '',
                          patient_email: '',
                          patient_phone: ''
                        })
                      }}
                      className="w-full gradient-primary text-white shadow-lg hover:shadow-xl"
                      size="lg"
                    >
                      <Icons.plus className="mr-2 h-5 w-5" />
                      Reservar otra cita
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Reservar Cita Médica
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete el formulario a continuación para reservar su cita. Nuestro proceso es rápido, seguro y fácil de usar.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Icons.calendar className="mr-3 h-6 w-6 text-primary-600" />
                Información de la Cita
              </CardTitle>
              <CardDescription>
                Seleccione la clínica, servicio, doctor y horario preferido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Tenant Selection */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3"
                >
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Icons.building className="mr-2 h-4 w-4" />
                    Clínica / Centro Médico
                  </label>
                  <select
                    data-testid="tenant-select"
                    value={form.tenant_id}
                    onChange={(e) => setForm(prev => ({ ...prev, tenant_id: e.target.value }))}
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl bg-white text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
                    required
                  >
                    <option value="">Seleccionar clínica...</option>
                    {tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                </motion.div>

                {/* Service Selection */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3"
                >
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Icons.activity className="mr-2 h-4 w-4" />
                    Servicio Médico
                  </label>
                  <select
                    data-testid="service-select"
                    value={form.service_id}
                    onChange={(e) => setForm(prev => ({ ...prev, service_id: e.target.value }))}
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl bg-white text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                    required
                    disabled={!form.tenant_id}
                  >
                    <option value="">Seleccionar servicio...</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                  {selectedService && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-primary-50 border border-primary-100 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icons.dollarSign className="h-4 w-4 text-primary-600" />
                          <span data-testid="service-price" className="text-sm font-medium text-primary-900">
                            Precio: ${selectedService.price?.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Icons.clock className="h-4 w-4 text-primary-600" />
                          <span className="text-sm font-medium text-primary-900">
                            {selectedService.duration_minutes} min
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Doctor Selection */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Icons.stethoscope className="mr-2 h-4 w-4" />
                    Doctor Especialista
                  </label>
                  <select
                    data-testid="doctor-select"
                    value={form.doctor_id}
                    onChange={(e) => setForm(prev => ({ ...prev, doctor_id: e.target.value }))}
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl bg-white text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                    required
                    disabled={!form.service_id}
                  >
                    <option value="">Seleccionar doctor...</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialty}
                      </option>
                    ))}
                  </select>
                </motion.div>

                {/* Date Selection */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Icons.calendarDays className="mr-2 h-4 w-4" />
                    Fecha de la Cita
                  </label>
                  <Input
                    data-testid="date-picker"
                    type="date"
                    value={form.appointment_date}
                    onChange={(e) => setForm(prev => ({ ...prev, appointment_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    disabled={!form.doctor_id}
                    className="h-12"
                  />
                </motion.div>

                {/* Time Slots */}
                {timeSlots.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-4"
                  >
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Icons.clock3 className="mr-2 h-4 w-4" />
                      Horarios Disponibles
                    </label>
                    <div data-testid="time-slots" className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {timeSlots.map((slot, index) => (
                        <motion.button
                          key={slot}
                          type="button"
                          data-testid={`time-slot-${slot}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 + index * 0.05 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setForm(prev => ({ ...prev, start_time: slot }))}
                          className={`p-3 border-2 rounded-xl font-medium transition-all duration-200 ${
                            form.start_time === slot
                              ? 'bg-gradient-primary text-white border-primary-600 shadow-lg'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                          }`}
                        >
                          {slot}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Total Amount */}
                {selectedService && form.start_time && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-success rounded-xl flex items-center justify-center">
                          <Icons.dollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total a pagar</p>
                          <p data-testid="total-amount" className="text-2xl font-bold text-gray-900">
                            ${selectedService.price?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="success" className="text-sm">
                        Precio fijo
                      </Badge>
                    </div>
                  </motion.div>
                )}

              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Patient Information Section */}
        {form.start_time && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8"
          >
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <Icons.user className="mr-3 h-6 w-6 text-primary-600" />
                  Información del Paciente
                </CardTitle>
                <CardDescription>
                  Complete sus datos personales para confirmar la reserva
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div data-testid="patient-form" className="space-y-6">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-2"
                    >
                      <label className="text-sm font-medium text-gray-700">
                        Nombre *
                      </label>
                      <Input
                        data-testid="patient-first-name"
                        type="text"
                        value={form.patient_first_name}
                        onChange={(e) => setForm(prev => ({ ...prev, patient_first_name: e.target.value }))}
                        placeholder="Ingrese su nombre"
                        className="h-12"
                      />
                      {errors.patient_first_name && (
                        <p data-testid="error-first-name" className="text-red-500 text-sm flex items-center">
                          <Icons.alertCircle className="w-4 h-4 mr-1" />
                          {errors.patient_first_name}
                        </p>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-2"
                    >
                      <label className="text-sm font-medium text-gray-700">
                        Apellido *
                      </label>
                      <Input
                        data-testid="patient-last-name"
                        type="text"
                        value={form.patient_last_name}
                        onChange={(e) => setForm(prev => ({ ...prev, patient_last_name: e.target.value }))}
                        placeholder="Ingrese su apellido"
                        className="h-12"
                      />
                      {errors.patient_last_name && (
                        <p data-testid="error-last-name" className="text-red-500 text-sm flex items-center">
                          <Icons.alertCircle className="w-4 h-4 mr-1" />
                          {errors.patient_last_name}
                        </p>
                      )}
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-2"
                  >
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Icons.mail className="mr-2 h-4 w-4" />
                      Correo Electrónico *
                    </label>
                    <Input
                      data-testid="patient-email"
                      type="email"
                      value={form.patient_email}
                      onChange={(e) => setForm(prev => ({ ...prev, patient_email: e.target.value }))}
                      placeholder="ejemplo@correo.com"
                      className="h-12"
                    />
                    {errors.patient_email && (
                      <p data-testid="error-email" className="text-red-500 text-sm flex items-center">
                        <Icons.alertCircle className="w-4 h-4 mr-1" />
                        {errors.patient_email}
                      </p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-2"
                  >
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Icons.phone className="mr-2 h-4 w-4" />
                      Teléfono (opcional)
                    </label>
                    <Input
                      data-testid="patient-phone"
                      type="tel"
                      value={form.patient_phone}
                      onChange={(e) => setForm(prev => ({ ...prev, patient_phone: e.target.value }))}
                      placeholder="+1 234 567 8900"
                      className="h-12"
                    />
                  </motion.div>
                </div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="pt-6 border-t border-gray-200"
                >
                  <Button
                    data-testid="submit-booking"
                    type="submit"
                    disabled={isLoading || !form.start_time}
                    className="w-full gradient-primary text-white shadow-lg hover:shadow-xl button-press"
                    size="lg"
                    onClick={handleSubmit}
                  >
                    {isLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <Icons.clock className="h-5 w-5" />
                        </motion.div>
                        Procesando reserva...
                      </>
                    ) : (
                      <>
                        <Icons.checkCircle className="mr-2 h-5 w-5" />
                        Confirmar Reserva
                      </>
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}