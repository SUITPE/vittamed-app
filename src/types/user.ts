// Multi-tenant user types for VittaSami platform

export type UserRole = 'super_admin' | 'admin_tenant' | 'doctor' | 'patient' | 'staff' | 'receptionist' | 'member' | 'client';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  current_tenant_id?: string;
  schedulable?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTenantRole {
  id: string;
  user_id: string;
  tenant_id: string;
  role: UserRole;
  doctor_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTenant {
  tenant_id: string;
  tenant_name: string;
  tenant_type: string;
  role: UserRole;
  is_current: boolean;
}

export interface UserWithRoles extends UserProfile {
  tenants: UserTenant[];
  current_tenant?: UserTenant;
}

export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialty?: string;
  license_number?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRoleView {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  tenant_id: string;
  tenant_name: string;
  tenant_type: string;
  role: UserRole;
  is_active: boolean;
  schedulable?: boolean;
  doctor_id?: string;
  doctor_first_name?: string;
  doctor_last_name?: string;
  is_current_tenant: boolean;
  role_assigned_at: string;
}

// Helper functions
export function getUserFullName(user: { first_name?: string; last_name?: string }): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  return user.first_name || user.last_name || 'Usuario';
}

export function getUserInitials(user: { first_name?: string; last_name?: string }): string {
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
}

export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    super_admin: 'Super Administrador',
    admin_tenant: 'Administrador',
    doctor: 'Doctor',
    patient: 'Paciente',
    staff: 'Personal',
    receptionist: 'Recepcionista',
    member: 'Miembro del Equipo',
    client: 'Cliente'
  };
  return roleNames[role];
}

export function getRoleColor(role: UserRole): string {
  const roleColors: Record<UserRole, string> = {
    super_admin: 'bg-gray-900 text-white',
    admin_tenant: 'bg-red-100 text-red-800',
    doctor: 'bg-blue-100 text-blue-800',
    patient: 'bg-green-100 text-green-800',
    staff: 'bg-yellow-100 text-yellow-800',
    receptionist: 'bg-purple-100 text-purple-800',
    member: 'bg-indigo-100 text-indigo-800',
    client: 'bg-teal-100 text-teal-800'
  };
  return roleColors[role];
}

export function canUserAccessTenant(userTenants: UserTenant[], tenantId: string): boolean {
  return userTenants.some(tenant => tenant.tenant_id === tenantId && tenant.role !== 'patient');
}

export function getUserRoleInTenant(userTenants: UserTenant[], tenantId: string): UserRole | null {
  const tenant = userTenants.find(t => t.tenant_id === tenantId);
  return tenant?.role || null;
}

export function isUserAdminOfTenant(userTenants: UserTenant[], tenantId: string): boolean {
  const role = getUserRoleInTenant(userTenants, tenantId);
  return role === 'admin_tenant';
}

export function isUserDoctorInTenant(userTenants: UserTenant[], tenantId: string): boolean {
  const role = getUserRoleInTenant(userTenants, tenantId);
  return role === 'doctor';
}

export function isUserReceptionistInTenant(userTenants: UserTenant[], tenantId: string): boolean {
  const role = getUserRoleInTenant(userTenants, tenantId);
  return role === 'receptionist';
}

export function canUserManageAppointments(userTenants: UserTenant[], tenantId: string): boolean {
  const role = getUserRoleInTenant(userTenants, tenantId);
  return role === 'admin_tenant' || role === 'receptionist' || role === 'doctor';
}

export function canUserViewAgenda(userTenants: UserTenant[], tenantId: string): boolean {
  const role = getUserRoleInTenant(userTenants, tenantId);
  return role === 'admin_tenant' || role === 'receptionist' || role === 'doctor';
}

export function canUserManagePatients(userTenants: UserTenant[], tenantId: string): boolean {
  const role = getUserRoleInTenant(userTenants, tenantId);
  return role === 'admin_tenant' || role === 'receptionist';
}

export function isUserMemberInTenant(userTenants: UserTenant[], tenantId: string): boolean {
  const role = getUserRoleInTenant(userTenants, tenantId);
  return role === 'member';
}

export function canUserManageOwnSchedule(userTenants: UserTenant[], tenantId: string): boolean {
  const role = getUserRoleInTenant(userTenants, tenantId);
  return role === 'doctor' || role === 'member';
}

export function canUserViewOwnPatients(userTenants: UserTenant[], tenantId: string): boolean {
  const role = getUserRoleInTenant(userTenants, tenantId);
  return role === 'doctor' || role === 'member' || role === 'admin_tenant' || role === 'receptionist';
}

export function canUserManageOwnAppointments(userTenants: UserTenant[], tenantId: string): boolean {
  const role = getUserRoleInTenant(userTenants, tenantId);
  return role === 'doctor' || role === 'member' || role === 'admin_tenant' || role === 'receptionist';
}

// Type guards
export function isValidUserRole(role: string): role is UserRole {
  return ['super_admin', 'admin_tenant', 'doctor', 'patient', 'staff', 'receptionist', 'member', 'client'].includes(role);
}

export function hasMultipleTenants(userTenants: UserTenant[]): boolean {
  return userTenants.length > 1;
}

// Request types for API endpoints
export interface AddUserToTenantRequest {
  user_id: string;
  tenant_id: string;
  role: UserRole;
  doctor_id?: string;
}

export interface RemoveUserFromTenantRequest {
  user_id: string;
  tenant_id: string;
}

export interface SwitchTenantRequest {
  tenant_id: string;
}

// Response types
export interface UserTenantsResponse {
  tenants: UserTenant[];
  current_tenant?: UserTenant;
}

export interface AddUserToTenantResponse {
  success: boolean;
  role_id: string;
  message: string;
}

export interface SwitchTenantResponse {
  success: boolean;
  current_tenant: UserTenant;
  message: string;
}

// Client-specific permission functions
export function isUserClient(role: UserRole): boolean {
  return role === 'client';
}

export function canUserBookAppointments(role: UserRole): boolean {
  return role === 'client' || role === 'patient';
}

export function canUserManageOwnProfile(role: UserRole): boolean {
  return role === 'client' || role === 'patient' || role === 'doctor' || role === 'member';
}

export function canUserViewOwnAppointments(role: UserRole): boolean {
  return role === 'client' || role === 'patient' || role === 'doctor' || role === 'member' || role === 'admin_tenant' || role === 'receptionist';
}

export function canUserManagePayments(role: UserRole): boolean {
  return role === 'client' || role === 'patient';
}

export function hasClientAccess(role: UserRole): boolean {
  return role === 'client';
}