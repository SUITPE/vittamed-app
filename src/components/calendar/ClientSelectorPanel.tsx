'use client'

import { useState, useEffect } from 'react'
import { Icons } from '@/components/ui/Icons'
import NewClientModal from './NewClientModal'

interface Client {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  created_at: string
}

interface ClientSelectorPanelProps {
  isOpen: boolean
  onClose: () => void
  onSelectClient: (client: Client | 'walk-in') => void
  tenantId: string
}

export default function ClientSelectorPanel({
  isOpen,
  onClose,
  onSelectClient,
  tenantId
}: ClientSelectorPanelProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNewClientModal, setShowNewClientModal] = useState(false)

  useEffect(() => {
    if (isOpen && tenantId) {
      fetchClients()
    }
  }, [isOpen, tenantId])

  const fetchClients = async () => {
    try {
      setLoading(true)
      // Use /api/patients to get actual patients from the patients table
      const response = await fetch(`/api/patients?tenantId=${tenantId}`)
      if (response.ok) {
        const data = await response.json()
        // API returns array directly, not wrapped in { users: [] }
        setClients(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  )

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed left-0 top-0 bottom-0 w-[400px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Select a client</h2>
              <p className="text-sm text-gray-500 mt-1">Or leave empty for walk-ins</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Icons.x className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search client or leave empty"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Clients List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-3">
            {/* Add new client */}
            <button
              onClick={() => setShowNewClientModal(true)}
              className="w-full p-4 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3 border border-gray-200"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Icons.plus className="w-6 h-6 text-blue-600" />
              </div>
              <span className="font-medium text-gray-900">Add new client</span>
            </button>

            {/* Walk-In */}
            <button
              onClick={() => {
                onSelectClient('walk-in')
                onClose()
              }}
              className="w-full p-4 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3 border border-gray-200"
            >
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                <Icons.user className="w-6 h-6 text-purple-600" />
              </div>
              <span className="font-medium text-gray-900">Walk-In</span>
            </button>

            {/* Divider */}
            {filteredClients.length > 0 && (
              <div className="border-t border-gray-200 my-4"></div>
            )}

            {/* Clients */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {filteredClients.map((client) => (
                  <button
                    key={client.user_id || client.id}
                    onClick={() => {
                      onSelectClient(client)
                      onClose()
                    }}
                    className="w-full p-4 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3 text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-semibold text-blue-600">
                        {getInitials(client.first_name, client.last_name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        {client.first_name} {client.last_name}
                      </div>
                      {client.phone && (
                        <div className="text-sm text-gray-500">{client.phone}</div>
                      )}
                    </div>
                  </button>
                ))}

                {filteredClients.length === 0 && !loading && searchQuery && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-2">
                      <Icons.search className="w-12 h-12 mx-auto" />
                    </div>
                    <p className="text-gray-600">No clients found</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* New Client Modal */}
      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        onClientCreated={(newClient) => {
          // Add new client to the list
          setClients([newClient, ...clients])
          // Select the new client
          onSelectClient(newClient)
          onClose()
        }}
        tenantId={tenantId}
      />
    </>
  )
}
