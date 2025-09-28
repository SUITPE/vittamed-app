// Enhanced wrapper para detectar errores de fetch específicos de Supabase
const originalFetch = globalThis.fetch

if (typeof window !== 'undefined') {
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      // Enhanced validation and logging
      console.log('Fetch call details:', {
        inputType: typeof input,
        inputValue: input,
        inputLength: typeof input === 'string' ? input.length : 'N/A',
        hasInit: !!init,
        userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'
      })

      // Validate input more thoroughly
      if (input === undefined || input === null) {
        const error = new Error(`Fetch input is ${input}`)
        console.error('❌ FETCH ERROR - Null/undefined input:', error)
        throw error
      }

      if (typeof input === 'string') {
        if (!input.trim()) {
          const error = new Error('Fetch input is empty string')
          console.error('❌ FETCH ERROR - Empty string:', error)
          throw error
        }

        // Check for malformed URLs
        if (input.includes('undefined') || input.includes('null')) {
          const error = new Error(`Fetch URL contains undefined/null: ${input}`)
          console.error('❌ FETCH ERROR - Malformed URL:', error)
          throw error
        }
      }

      // Additional validation for URL objects
      if (input instanceof URL) {
        if (!input.href || input.href === 'undefined' || input.href === 'null') {
          const error = new Error(`Invalid URL object: ${input.href}`)
          console.error('❌ FETCH ERROR - Invalid URL object:', error)
          throw error
        }
      }

      // Call original fetch
      const response = await originalFetch(input, init)

      // Log successful requests in production for debugging
      if (typeof input === 'string' && input.includes('supabase')) {
        console.log('✅ Supabase fetch successful:', input.substring(0, 50) + '...')
      }

      return response

    } catch (error) {
      // Enhanced error logging
      console.error('🚨 FETCH ERROR DETAILS:', {
        input: typeof input === 'string' ? input : 'Non-string input',
        inputType: typeof input,
        inputConstructor: input?.constructor?.name,
        init,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })

      throw error
    }
  }
}

export {}