'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    clarity?: (command: string, ...args: any[]) => void
  }
}

export function useInvestorTracking() {
  useEffect(() => {
    // Track investor page view
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('set', 'page', 'investor')
      window.clarity('event', 'investor_page_view')
    }
  }, [])

  const trackPitchDeckRequest = () => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', 'investor_pitch_deck_request')
    }
  }

  const trackMeetingRequest = () => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', 'investor_meeting_request')
    }
  }

  const trackEmailClick = () => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', 'investor_email_click')
    }
  }

  const trackSectionView = (section: string) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', `investor_view_${section}`)
    }
  }

  return {
    trackPitchDeckRequest,
    trackMeetingRequest,
    trackEmailClick,
    trackSectionView,
  }
}
