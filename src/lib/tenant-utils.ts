import { createBrowserClient } from '@supabase/ssr'

// Utility functions for dynamic tenant management
class TenantUtils {
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async getFirstAvailableTenant(): Promise<string | null> {
    try {
      const { data: tenants, error } = await this.supabase
        .from('tenants')
        .select('id')
        .limit(1)

      if (error) {
        console.error('Error fetching tenants:', error)
        return null
      }

      return tenants && tenants.length > 0 ? tenants[0].id : null
    } catch (error) {
      console.error('Error in getFirstAvailableTenant:', error)
      return null
    }
  }

  async getTenantById(tenantId: string) {
    try {
      const { data: tenant, error } = await this.supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

      if (error) {
        console.error('Error fetching tenant:', error)
        return null
      }

      return tenant
    } catch (error) {
      console.error('Error in getTenantById:', error)
      return null
    }
  }

  async getUserTenantId(userId: string): Promise<string | null> {
    try {
      // First check custom_users
      const { data: profile } = await this.supabase
        .from('custom_users')
        .select('tenant_id')
        .eq('id', userId)
        .single()

      if (profile?.tenant_id) {
        return profile.tenant_id
      }

      // If not found, check doctors table
      const { data: doctor } = await this.supabase
        .from('doctors')
        .select('tenant_id')
        .eq('id', userId)
        .single()

      if (doctor?.tenant_id) {
        return doctor.tenant_id
      }

      // Return first available tenant as fallback
      return await this.getFirstAvailableTenant()
    } catch (error) {
      console.error('Error in getUserTenantId:', error)
      return await this.getFirstAvailableTenant()
    }
  }

  // For pages that need a tenant ID but don't have one
  async getDefaultTenantId(): Promise<string> {
    const tenantId = await this.getFirstAvailableTenant()
    return tenantId || 'no-tenant-available'
  }
}

export const tenantUtils = new TenantUtils()