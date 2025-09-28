// Wrapper para detectar errores de fetch
const originalFetch = globalThis.fetch

if (typeof window !== 'undefined') {
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      // Log fetch attempts in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Fetch attempt:', { input, init })
      }

      // Validate input
      if (!input) {
        throw new Error('Fetch input is undefined or null')
      }

      if (typeof input === 'string' && !input.trim()) {
        throw new Error('Fetch input is empty string')
      }

      return await originalFetch(input, init)
    } catch (error) {
      console.error('Fetch error captured:', {
        input,
        init,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }
}

export {}