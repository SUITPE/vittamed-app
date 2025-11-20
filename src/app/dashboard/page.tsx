import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
// Force dynamic rendering for pages using cookies
export const dynamic = 'force-dynamic'


// Server Component - Simple redirect based on role
export default async function DashboardPage() {
  // Server-side authentication
  const user = await customAuth.getCurrentUser()

  if (!user || !user.profile) {
    redirect('/auth/login')
  }

  const role = user.profile.role
  const tenantId = user.profile.tenant_id

  console.log('🔍 Dashboard redirect - User profile:', {
    role,
    tenant_id: tenantId,
    email: user.email
  })

  // Redirect based on user role
  switch (role) {
    case 'super_admin':
      console.log('✅ Redirecting super_admin to manage-users')
      redirect('/admin/manage-users')
    case 'admin_tenant':
    case 'staff':
    case 'receptionist':
      if (tenantId) {
        console.log('✅ Redirecting to dashboard with tenant:', tenantId)
        redirect(`/dashboard/${tenantId}`)
      } else {
        console.log('⚠️ No tenant_id, redirecting to create-tenant')
        redirect('/admin/create-tenant')
      }
    case 'doctor':
      console.log('✅ Redirecting doctor to agenda')
      redirect('/agenda')
    case 'patient':
      console.log('✅ Redirecting patient to appointments')
      redirect('/my-appointments')
    default:
      console.log('❌ Unknown role, redirecting to login')
      redirect('/auth/login')
  }
}
