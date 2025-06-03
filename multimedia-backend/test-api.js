// Script de pruebas para el backend multimedia
import fetch from "node-fetch"

const BASE_URL = "http://localhost:3000/api"
let authToken = ""

// Función helper para hacer requests
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    console.log(`\n🔗 ${options.method || "GET"} ${endpoint}`)
    console.log(`📊 Status: ${response.status}`)
    console.log(`📄 Response:`, JSON.stringify(data, null, 2))

    return { response, data }
  } catch (error) {
    console.error(`❌ Error en ${endpoint}:`, error.message)
    return { error }
  }
}

// Test de login
async function testLogin() {
  console.log("\n🔐 === TESTING LOGIN ===")

  const loginData = {
    correo: "admin@medio.com",
    contraseña: "hash123", // En producción, esta sería la contraseña real
  }

  const { data } = await makeRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(loginData),
  })

  if (data && data.token) {
    authToken = data.token
    console.log("✅ Login exitoso, token guardado")
    return true
  } else {
    console.log("❌ Login falló")
    return false
  }
}

// Test de obtener usuarios
async function testGetUsers() {
  console.log("\n👥 === TESTING GET USERS ===")
  await makeRequest("/usuarios")
}

// Test de obtener categorías
async function testGetCategories() {
  console.log("\n📁 === TESTING GET CATEGORIES ===")
  await makeRequest("/categorias")
}

// Test de crear categoría
async function testCreateCategory() {
  console.log("\n➕ === TESTING CREATE CATEGORY ===")

  const categoryData = {
    nombre: "Prueba API",
    id_padre: null,
  }

  await makeRequest("/categorias", {
    method: "POST",
    body: JSON.stringify(categoryData),
  })
}

// Test de obtener archivos
async function testGetFiles() {
  console.log("\n📄 === TESTING GET FILES ===")
  await makeRequest("/archivos?page=1&limit=5")
}

// Test de obtener tags
async function testGetTags() {
  console.log("\n🏷️ === TESTING GET TAGS ===")
  await makeRequest("/tags")
}

// Test de crear tag
async function testCreateTag() {
  console.log("\n🆕 === TESTING CREATE TAG ===")

  const tagData = {
    nombre: "test-api",
  }

  await makeRequest("/tags", {
    method: "POST",
    body: JSON.stringify(tagData),
  })
}

// Test de búsqueda
async function testSearch() {
  console.log("\n🔍 === TESTING SEARCH ===")
  await makeRequest("/buscar?q=presidente")
}

// Test de estadísticas
async function testStats() {
  console.log("\n📊 === TESTING STATISTICS ===")
  await makeRequest("/estadisticas")
}

// Test de endpoint inexistente
async function testNotFound() {
  console.log("\n❓ === TESTING 404 ===")
  await makeRequest("/endpoint-inexistente")
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log("🚀 Iniciando pruebas del API...")
  console.log("📍 URL Base:", BASE_URL)

  // Verificar que el servidor esté corriendo
  try {
    const healthCheck = await fetch("http://localhost:3000")
    if (!healthCheck.ok) {
      throw new Error("Servidor no responde")
    }
  } catch (error) {
    console.error("❌ Error: El servidor no está corriendo en http://localhost:3000")
    console.log("💡 Asegúrate de ejecutar: npm run dev")
    return
  }

  // Ejecutar pruebas en orden
  const loginSuccess = await testLogin()

  if (loginSuccess) {
    await testGetUsers()
    await testGetCategories()
    await testCreateCategory()
    await testGetFiles()
    await testGetTags()
    await testCreateTag()
    await testSearch()
    await testStats()
  }

  await testNotFound()

  console.log("\n✅ Pruebas completadas")
}

// Ejecutar las pruebas
runAllTests()
