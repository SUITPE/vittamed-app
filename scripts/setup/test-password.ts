import bcrypt from 'bcryptjs'

const passwordToTest = 'VittaSami2025!Admin'
const hashFromDB = '$2b$12$UZDmRWB4QizqBvwMlJb7GerqAkVisPf6FCTFyY5nA5Mk3LuveVkiK'

async function testPassword() {
  console.log('🔍 Testing password against hash...')
  console.log('Password:', passwordToTest)
  console.log('Hash:', hashFromDB)

  const isMatch = await bcrypt.compare(passwordToTest, hashFromDB)

  if (isMatch) {
    console.log('✅ Password MATCHES the hash!')
  } else {
    console.log('❌ Password DOES NOT MATCH the hash')
  }
}

testPassword()
