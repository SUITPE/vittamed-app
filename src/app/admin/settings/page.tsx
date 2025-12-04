import { redirect } from 'next/navigation'

// Force dynamic rendering for pages using cookies
export const dynamic = 'force-dynamic'

// Redirect /admin/settings to /settings?tab=general
export default function AdminSettingsPage() {
  redirect('/settings?tab=general')
}
