import { customAuth } from '@/lib/custom-auth'

async function testLogin() {
  console.log('\n=== Probando login de guscass@gmail.com ===\n')

  const passwords = ['password', 'Password123', 'vittasami123']

  for (const pwd of passwords) {
    console.log(`\nProbando password: "${pwd}"`)
    const user = await customAuth.authenticateUser('guscass@gmail.com', pwd)

    if (user) {
      console.log('✅ LOGIN EXITOSO con password:', pwd)
      console.log('   User ID:', user.id)
      console.log('   Email:', user.email)
      console.log('   Role:', user.role)
      console.log('   Tenant ID:', user.tenant_id)
      return
    } else {
      console.log('❌ Login falló con password:', pwd)
    }
  }

  console.log('\n⚠️  Ningún password funcionó')
}

testLogin()
  .then(() => {
    console.log('\n✅ Test completado\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
