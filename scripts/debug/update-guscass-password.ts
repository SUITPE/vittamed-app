import { customAuth } from '@/lib/custom-auth'

async function updatePassword() {
  console.log('\n=== Actualizando password de guscass@gmail.com ===\n')

  const userId = '86aa4aa2-da4a-4575-aeba-3b456feda2d5'
  const newPassword = 'wasaberto'

  console.log('Usuario ID:', userId)
  console.log('Nuevo password:', newPassword)

  const result = await customAuth.updatePassword(userId, newPassword)

  if (result.error) {
    console.log('\n❌ Error actualizando password:', result.error)
  } else {
    console.log('\n✅ Password actualizado exitosamente!')

    // Test login with new password
    console.log('\n=== Probando login con nuevo password ===\n')
    const user = await customAuth.authenticateUser('guscass@gmail.com', newPassword)

    if (user) {
      console.log('✅ LOGIN EXITOSO!')
      console.log('   Email:', user.email)
      console.log('   Role:', user.role)
      console.log('   Tenant ID:', user.tenant_id)
      console.log('   Name:', user.first_name, user.last_name)
    } else {
      console.log('❌ Login falló - algo salió mal')
    }
  }
}

updatePassword()
  .then(() => {
    console.log('\n✅ Actualización completada\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
