// Script para configurar la base de datos de prueba (versión corregida)
import mysql from "mysql2/promise"
import bcrypt from "bcryptjs"

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "", // Cambia por tu contraseña
  // Removemos multipleStatements para evitar el error
}

async function setupDatabase() {
  console.log("🗄️ Configurando base de datos de prueba...")

  try {
    // Conectar sin especificar base de datos
    const connection = await mysql.createConnection(dbConfig)

    // Crear base de datos si no existe
    await connection.execute("CREATE DATABASE IF NOT EXISTS Multimedia")
    console.log("✅ Base de datos Multimedia creada/verificada")

    // Cerrar conexión y reconectar a la base de datos específica
    await connection.end()

    // Conectar a la base de datos Multimedia
    const dbConnection = await mysql.createConnection({
      ...dbConfig,
      database: "Multimedia",
    })

    console.log("📋 Creando tablas...")

    // Crear tablas una por una (sin multipleStatements)
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
          id_usuario INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          correo VARCHAR(100) NOT NULL UNIQUE,
          contraseña_hash TEXT NOT NULL,
          rol ENUM('Administrador', 'Periodista', 'Visualizador') NOT NULL
      )
    `)

    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS categorias (
          id_categoria INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          id_padre INT DEFAULT NULL,
          FOREIGN KEY (id_padre) REFERENCES categorias(id_categoria) ON DELETE SET NULL
      )
    `)

    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS archivos (
          id_archivo INT AUTO_INCREMENT PRIMARY KEY,
          nombre_archivo VARCHAR(255) NOT NULL,
          tipo ENUM('imagen', 'documento', 'audio', 'video') NOT NULL,
          ruta_storage TEXT NOT NULL,
          miniatura TEXT,
          fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fuente VARCHAR(100),
          lugar_captura VARCHAR(100),
          fecha_captura DATE,
          derechos_uso TEXT,
          nivel_acceso ENUM('público', 'restringido', 'confidencial'),
          id_usuario INT,
          id_categoria INT,
          FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
          FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
      )
    `)

    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS tags (
          id_tag INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(50) NOT NULL UNIQUE
      )
    `)

    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS archivo_tags (
          id_archivo INT,
          id_tag INT,
          PRIMARY KEY (id_archivo, id_tag),
          FOREIGN KEY (id_archivo) REFERENCES archivos(id_archivo) ON DELETE CASCADE,
          FOREIGN KEY (id_tag) REFERENCES tags(id_tag) ON DELETE CASCADE
      )
    `)

    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS colecciones (
          id_coleccion INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          descripcion TEXT
      )
    `)

    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS archivo_coleccion (
          id_archivo INT,
          id_coleccion INT,
          PRIMARY KEY (id_archivo, id_coleccion),
          FOREIGN KEY (id_archivo) REFERENCES archivos(id_archivo) ON DELETE CASCADE,
          FOREIGN KEY (id_coleccion) REFERENCES colecciones(id_coleccion) ON DELETE CASCADE
      )
    `)

    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS secciones_periodico (
          id_seccion INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL UNIQUE
      )
    `)

    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS archivo_seccion (
          id_archivo INT,
          id_seccion INT,
          PRIMARY KEY (id_archivo, id_seccion),
          FOREIGN KEY (id_archivo) REFERENCES archivos(id_archivo) ON DELETE CASCADE,
          FOREIGN KEY (id_seccion) REFERENCES secciones_periodico(id_seccion) ON DELETE CASCADE
      )
    `)

    console.log("✅ Tablas creadas exitosamente")

    // Verificar si ya existen usuarios
    const [existingUsers] = await dbConnection.execute("SELECT COUNT(*) as count FROM usuarios")

    if (existingUsers[0].count === 0) {
      console.log("👥 Creando usuarios de prueba...")

      // Crear contraseñas hasheadas
      const adminPassword = await bcrypt.hash("admin123", 10)
      const periodistaPassword = await bcrypt.hash("periodista123", 10)
      const visualizadorPassword = await bcrypt.hash("visualizador123", 10)

      // Insertar usuarios uno por uno
      await dbConnection.execute("INSERT INTO usuarios (nombre, correo, contraseña_hash, rol) VALUES (?, ?, ?, ?)", [
        "Admin Principal",
        "admin@medio.com",
        adminPassword,
        "Administrador",
      ])

      await dbConnection.execute("INSERT INTO usuarios (nombre, correo, contraseña_hash, rol) VALUES (?, ?, ?, ?)", [
        "Juana Periodista",
        "periodista@medio.com",
        periodistaPassword,
        "Periodista",
      ])

      await dbConnection.execute("INSERT INTO usuarios (nombre, correo, contraseña_hash, rol) VALUES (?, ?, ?, ?)", [
        "Pedro Visualizador",
        "visualizador@medio.com",
        visualizadorPassword,
        "Visualizador",
      ])

      console.log("✅ Usuarios de prueba creados:")
      console.log("   📧 admin@medio.com / admin123 (Administrador)")
      console.log("   📧 periodista@medio.com / periodista123 (Periodista)")
      console.log("   📧 visualizador@medio.com / visualizador123 (Visualizador)")

      // Insertar categorías
      console.log("📁 Creando categorías...")
      await dbConnection.execute("INSERT INTO categorias (nombre, id_padre) VALUES (?, ?)", ["Imágenes", null])
      await dbConnection.execute("INSERT INTO categorias (nombre, id_padre) VALUES (?, ?)", ["Videos", null])
      await dbConnection.execute("INSERT INTO categorias (nombre, id_padre) VALUES (?, ?)", ["Documentos", null])
      await dbConnection.execute("INSERT INTO categorias (nombre, id_padre) VALUES (?, ?)", ["Audios", null])

      // Obtener ID de categoría Imágenes para subcategorías
      const [imagenesResult] = await dbConnection.execute("SELECT id_categoria FROM categorias WHERE nombre = ?", [
        "Imágenes",
      ])
      const imagenesId = imagenesResult[0].id_categoria

      await dbConnection.execute("INSERT INTO categorias (nombre, id_padre) VALUES (?, ?)", ["Reportajes", imagenesId])
      await dbConnection.execute("INSERT INTO categorias (nombre, id_padre) VALUES (?, ?)", ["Portadas", imagenesId])

      // Insertar tags
      console.log("🏷️ Creando tags...")
      const tags = ["elecciones", "deportes", "protesta", "cultura", "entrevista"]
      for (const tag of tags) {
        await dbConnection.execute("INSERT INTO tags (nombre) VALUES (?)", [tag])
      }

      // Insertar secciones
      console.log("📰 Creando secciones...")
      const secciones = ["Nacional", "Internacional", "Cultura", "Deportes", "Opinión"]
      for (const seccion of secciones) {
        await dbConnection.execute("INSERT INTO secciones_periodico (nombre) VALUES (?)", [seccion])
      }

      // Insertar colecciones
      console.log("📚 Creando colecciones...")
      await dbConnection.execute("INSERT INTO colecciones (nombre, descripcion) VALUES (?, ?)", [
        "Elecciones 2024",
        "Archivos relacionados con las elecciones presidenciales",
      ])
      await dbConnection.execute("INSERT INTO colecciones (nombre, descripcion) VALUES (?, ?)", [
        "Deportes Locales",
        "Cobertura deportiva local",
      ])

      console.log("✅ Datos de prueba insertados")
    } else {
      console.log("ℹ️ Los usuarios ya existen, saltando inserción")
    }

    await dbConnection.end()
    console.log("🎉 Base de datos configurada correctamente")

    console.log("\n🔑 Credenciales para probar:")
    console.log("Admin: admin@medio.com / admin123")
    console.log("Periodista: periodista@medio.com / periodista123")
    console.log("Visualizador: visualizador@medio.com / visualizador123")
  } catch (error) {
    console.error("❌ Error configurando la base de datos:", error.message)
    console.error("📋 Detalles del error:", error)
    process.exit(1)
  }
}

setupDatabase()
