// Debug wrapper specifically for Supabase auth issues
export function debugSupabaseAuth() {
  if (typeof window === 'undefined') return

  // Override the original console.error to catch Supabase specific errors
  const originalConsoleError = console.error
  console.error = (...args) => {
    if (args.some(arg => typeof arg === 'string' && arg.includes('fetch'))) {
      console.log('🚨 FETCH-RELATED ERROR CAUGHT:', args)
    }
    return originalConsoleError.apply(console, args)
  }

  // Try to intercept XMLHttpRequest as well (in case Supabase uses it)
  const originalOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function(
    method: string,
    url: string | URL,
    async: boolean = true,
    username?: string | null,
    password?: string | null
  ) {
    console.log('📡 XMLHttpRequest detected:', { method, url })

    if (typeof url === 'string') {
      if (url.includes('undefined') || url.includes('null')) {
        console.error('❌ MALFORMED XHR URL:', url)
        throw new Error(`XMLHttpRequest: Invalid URL detected: ${url}`)
      }
    }

    return originalOpen.call(this, method, url, async, username, password)
  }

  // Monitor URL construction
  const originalURL = window.URL
  window.URL = class extends originalURL {
    constructor(url: string | URL, base?: string | URL) {
      console.log('🔗 URL Constructor called:', { url, base })

      if (typeof url === 'string') {
        if (url.includes('undefined') || url.includes('null')) {
          console.error('❌ MALFORMED URL CONSTRUCTION:', { url, base })
          throw new Error(`URL constructor: Invalid URL: ${url}`)
        }
      }

      super(url, base)
    }
  }

  console.log('🐛 Supabase auth debugging enabled')
}