const mysql = require("mysql2")

// Crear pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
})

// Promisificar para usar async/await
const promisePool = pool.promise()

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection()
    console.log("✅ Conexión a MySQL establecida correctamente")
    connection.release()
  } catch (error) {
    console.error("❌ Error conectando a MySQL:", error.message)
  }
}

testConnection()

module.exports = promisePool
