// Script para configurar la base de datos de prueba
import mysql from "mysql2/promise"
import bcrypt from "bcryptjs"

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "", // Cambia por tu contraseña
  multipleStatements: true,
}

async function setupDatabase() {
  console.log("🗄️ Configurando base de datos de prueba...")

  try {
    // Conectar sin especificar base de datos
    const connection = await mysql.createConnection(dbConfig)

    // Crear base de datos si no existe
    await connection.execute("CREATE DATABASE IF NOT EXISTS Multimedia")
    console.log("✅ Base de datos Multimedia creada/verificada")

    // Usar la base de datos
    await connection.execute("USE Multimedia")

    // Crear tablas
    const createTables = `
      CREATE TABLE IF NOT EXISTS usuarios (
          id_usuario INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          correo VARCHAR(100) NOT NULL UNIQUE,
          contraseña_hash TEXT NOT NULL,
          rol ENUM('Administrador', 'Periodista', 'Visualizador') NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categorias (
          id_categoria INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          id_padre INT DEFAULT NULL,
          FOREIGN KEY (id_padre) REFERENCES categorias(id_categoria) ON DELETE SET NULL
      );

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
      );

      CREATE TABLE IF NOT EXISTS tags (
          id_tag INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(50) NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS archivo_tags (
          id_archivo INT,
          id_tag INT,
          PRIMARY KEY (id_archivo, id_tag),
          FOREIGN KEY (id_archivo) REFERENCES archivos(id_archivo) ON DELETE CASCADE,
          FOREIGN KEY (id_tag) REFERENCES tags(id_tag) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS colecciones (
          id_coleccion INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          descripcion TEXT
      );

      CREATE TABLE IF NOT EXISTS archivo_coleccion (
          id_archivo INT,
          id_coleccion INT,
          PRIMARY KEY (id_archivo, id_coleccion),
          FOREIGN KEY (id_archivo) REFERENCES archivos(id_archivo) ON DELETE CASCADE,
          FOREIGN KEY (id_coleccion) REFERENCES colecciones(id_coleccion) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS secciones_periodico (
          id_seccion INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS archivo_seccion (
          id_archivo INT,
          id_seccion INT,
          PRIMARY KEY (id_archivo, id_seccion),
          FOREIGN KEY (id_archivo) REFERENCES archivos(id_archivo) ON DELETE CASCADE,
          FOREIGN KEY (id_seccion) REFERENCES secciones_periodico(id_seccion) ON DELETE CASCADE
      );
    `

    await connection.execute(createTables)
    console.log("✅ Tablas creadas exitosamente")

    // Insertar datos de prueba
    const adminPassword = await bcrypt.hash("admin123", 10)
    const periodistaPassword = await bcrypt.hash("periodista123", 10)
    const visualizadorPassword = await bcrypt.hash("visualizador123", 10)

    // Verificar si ya existen usuarios
    const [existingUsers] = await connection.execute("SELECT COUNT(*) as count FROM usuarios")

    if (existingUsers[0].count === 0) {
      // Insertar usuarios de prueba
      await connection.execute(
        `
        INSERT INTO usuarios (nombre, correo, contraseña_hash, rol) VALUES
        ('Admin Principal', 'admin@medio.com', ?, 'Administrador'),
        ('Juana Periodista', 'periodista@medio.com', ?, 'Periodista'),
        ('Pedro Visualizador', 'visualizador@medio.com', ?, 'Visualizador')
      `,
        [adminPassword, periodistaPassword, visualizadorPassword],
      )

      console.log("✅ Usuarios de prueba creados:")
      console.log("   📧 admin@medio.com / admin123 (Administrador)")
      console.log("   📧 periodista@medio.com / periodista123 (Periodista)")
      console.log("   📧 visualizador@medio.com / visualizador123 (Visualizador)")

      // Insertar datos de prueba adicionales
      await connection.execute(`
        INSERT INTO categorias (nombre, id_padre) VALUES
        ('Imágenes', NULL),
        ('Videos', NULL),
        ('Documentos', NULL),
        ('Audios', NULL),
        ('Reportajes', 1),
        ('Portadas', 1);
        
        INSERT INTO tags (nombre) VALUES
        ('elecciones'),
        ('deportes'),
        ('protesta'),
        ('cultura'),
        ('entrevista');
        
        INSERT INTO secciones_periodico (nombre) VALUES
        ('Nacional'),
        ('Internacional'),
        ('Cultura'),
        ('Deportes'),
        ('Opinión');
        
        INSERT INTO colecciones (nombre, descripcion) VALUES
        ('Elecciones 2024', 'Archivos relacionados con las elecciones presidenciales'),
        ('Deportes Locales', 'Cobertura deportiva local');
      `)

      console.log("✅ Datos de prueba insertados")
    } else {
      console.log("ℹ️ Los usuarios ya existen, saltando inserción")
    }

    await connection.end()
    console.log("🎉 Base de datos configurada correctamente")
  } catch (error) {
    console.error("❌ Error configurando la base de datos:", error.message)
    process.exit(1)
  }
}

setupDatabase()
