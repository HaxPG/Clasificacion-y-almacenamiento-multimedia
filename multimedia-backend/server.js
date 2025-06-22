import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mysql from "mysql2/promise"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import multer from "multer"
import path from "path"
import fs from "fs/promises"
import { fileURLToPath } from "url"
// const { statSync } = require('fs'); // <--- Elimina o comenta esta línea si no la usas, ya que estás usando fs/promises

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Mueve la declaración de 'app' aquí, antes de cualquier 'app.use'
const app = express()
const PORT = process.env.PORT || 3000

// Middleware
console.log('Ruta base del servidor (__dirname):', __dirname);
const uploadsPath = path.join(__dirname, "uploads");
console.log('Ruta de la carpeta uploads que se intenta servir:', uploadsPath);

app.use(
  cors({
    origin: ["http://localhost:4200", "http://localhost:3000"], // Asegúrate de que esto coincide con tu frontend
    credentials: true,
  }),
)
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use("/api/uploads", express.static(uploadsPath)); // Ahora los archivos estáticos también estarán bajo /api/uploads

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "multimedia",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

const pool = mysql.createPool(dbConfig)

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log("✅ Database connected successfully")
    connection.release()
  } catch (error) {
    console.error("❌ Database connection failed:", error.message)
  }
}

testConnection()

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads")
    try {
      await fs.access(uploadDir)
    } catch {
      await fs.mkdir(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
fileFilter: (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mov|mkv|pdf|doc|docx|txt|xlsx|pptx|mp3|wav/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  console.log("🧪 Archivo recibido:", file.originalname, "→", file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error("Tipo de archivo no permitido"))
  }
}
,
})

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Token de acceso requerido" })
  }

  jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido" })
    }
    req.user = user
    next()
  })
}

// Authorization middleware
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: "No tienes permisos para esta acción" })
    }
    next()
  }
}

// Routes

// Auth Routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { correo, contraseña } = req.body

    if (!correo || !contraseña) {
      return res.status(400).json({ error: "Correo y contraseña son requeridos" })
    }

    const [rows] = await pool.execute("SELECT * FROM usuarios WHERE correo = ?", [correo])

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    const user = rows[0]
    const isValidPassword = await bcrypt.compare(contraseña, user.contraseña_hash)

    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    const token = jwt.sign(
      {
        id: user.id_usuario,
        correo: user.correo,
        rol: user.rol,
        nombre: user.nombre,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" },
    )

    res.json({
      token,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

app.post("/api/auth/register", authenticateToken, authorize(["Administrador"]), async (req, res) => {
  try {
    const { nombre, correo, contraseña, rol } = req.body

    if (!nombre || !correo || !contraseña || !rol) {
      return res.status(400).json({ error: "Todos los campos son requeridos" })
    }

    // Check if user already exists
    const [existingUser] = await pool.execute("SELECT id_usuario FROM usuarios WHERE correo = ?", [correo])

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "El usuario ya existe" })
    }

    const hashedPassword = await bcrypt.hash(contraseña, 10)

    const [result] = await pool.execute(
      "INSERT INTO usuarios (nombre, correo, contraseña_hash, rol) VALUES (?, ?, ?, ?)",
      [nombre, correo, hashedPassword, rol],
    )

    res.status(201).json({
      message: "Usuario creado exitosamente",
      userId: result.insertId,
    })
  } catch (error) {
    console.error("Register error:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// User Routes
app.get("/api/usuarios", authenticateToken, authorize(["Administrador"]), async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT id_usuario, nombre, correo, rol FROM usuarios ORDER BY nombre")
    res.json(rows)
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

app.get("/api/usuarios/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Users can only access their own data unless they're admin
    if (req.user.rol !== "Administrador" && req.user.id !== Number.parseInt(id)) {
      return res.status(403).json({ error: "No tienes permisos para acceder a esta información" })
    }

    const [rows] = await pool.execute("SELECT id_usuario, nombre, correo, rol FROM usuarios WHERE id_usuario = ?", [id])

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    res.json(rows[0])
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// Category Routes
app.get("/api/categorias", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT c1.id_categoria, c1.nombre, c1.id_padre, c2.nombre as nombre_padre
      FROM categorias c1
      LEFT JOIN categorias c2 ON c1.id_padre = c2.id_categoria
      ORDER BY c1.nombre
    `)
    res.json(rows)
  } catch (error) {
    console.error("Get categories error:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

app.post("/api/categorias", authenticateToken, authorize(["Administrador", "Periodista"]), async (req, res) => {
  try {
    const { nombre, id_padre } = req.body

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es requerido" })
    }

    const [result] = await pool.execute("INSERT INTO categorias (nombre, id_padre) VALUES (?, ?)", [
      nombre,
      id_padre || null,
    ])

    res.status(201).json({
      message: "Categoría creada exitosamente",
      id: result.insertId,
    })
  } catch (error) {
    console.error("Create category error:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// File Routes
app.get("/api/archivos", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, tipo, categoria, tag, nivel_acceso } = req.query
    const offset = (page - 1) * limit

    let query = `
      SELECT a.*, c.nombre as categoria_nombre, u.nombre as usuario_nombre,
             GROUP_CONCAT(DISTINCT t.nombre) as tags,
             GROUP_CONCAT(DISTINCT col.nombre) as colecciones,
             GROUP_CONCAT(DISTINCT sp.nombre) as secciones
      FROM archivos a
      LEFT JOIN categorias c ON a.id_categoria = c.id_categoria
      LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
      LEFT JOIN archivo_tags at ON a.id_archivo = at.id_archivo
      LEFT JOIN tags t ON at.id_tag = t.id_tag
      LEFT JOIN archivo_coleccion ac ON a.id_archivo = ac.id_archivo
      LEFT JOIN colecciones col ON ac.id_coleccion = col.id_coleccion
      LEFT JOIN archivo_seccion ase ON a.id_archivo = ase.id_archivo
      LEFT JOIN secciones_periodico sp ON ase.id_seccion = sp.id_seccion
      WHERE 1=1
    `

    const params = []

    // Apply filters based on user role
    if (req.user.rol === "Visualizador") {
      query += ' AND a.nivel_acceso = "público"'
    } else if (req.user.rol === "Periodista") {
      query += ' AND (a.nivel_acceso IN ("público", "restringido") OR a.id_usuario = ?)'
      params.push(req.user.id)
    }

    if (tipo) {
      query += " AND a.tipo = ?"
      params.push(tipo)
    }

    if (categoria) {
      query += " AND a.id_categoria = ?"
      params.push(categoria)
    }

    if (nivel_acceso && req.user.rol === "Administrador") {
      query += " AND a.nivel_acceso = ?"
      params.push(nivel_acceso)
    }

    query += " GROUP BY a.id_archivo ORDER BY a.fecha_subida DESC LIMIT ? OFFSET ?"
    params.push(Number.parseInt(limit), Number.parseInt(offset))

    const [rows] = await pool.execute(query, params)

    // Get total count for pagination
    let countQuery = "SELECT COUNT(DISTINCT a.id_archivo) as total FROM archivos a WHERE 1=1"
    const countParams = []

    if (req.user.rol === "Visualizador") {
      countQuery += ' AND a.nivel_acceso = "público"'
    } else if (req.user.rol === "Periodista") {
      countQuery += ' AND (a.nivel_acceso IN ("público", "restringido") OR a.id_usuario = ?)'
      countParams.push(req.user.id)
    }

    if (tipo) {
      countQuery += " AND a.tipo = ?"
      countParams.push(tipo)
    }

    if (categoria) {
      countQuery += " AND a.id_categoria = ?"
      countParams.push(categoria)
    }

    if (nivel_acceso && req.user.rol === "Administrador") {
      countQuery += " AND a.nivel_acceso = ?"
      countParams.push(nivel_acceso)
    }

    const [countResult] = await pool.execute(countQuery, countParams)
    const total = countResult[0].total

    res.json({
      archivos: rows,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get files error:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

app.post(
  "/api/archivos",
  authenticateToken,
  authorize(["Administrador", "Periodista"]),
  upload.single("archivo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se ha subido ningún archivo" })
      }

      const {
        titulo_archivo, // <--- AÑADE ESTO AQUÍ
        tipo,
        fuente,
        lugar_captura,
        fecha_captura,
        derechos_uso,
        nivel_acceso,
        id_categoria,
        tags,
        colecciones,
        secciones,
      } = req.body

      const ruta_storage = `uploads/${req.file.filename}`

      // Determine file type based on extension if not provided
      const fileType = tipo || getFileType(req.file.mimetype)

      const [result] = await pool.execute(
        `
      INSERT INTO archivos (
        nombre_archivo, tipo, ruta_storage, fuente, lugar_captura, 
        fecha_captura, derechos_uso, nivel_acceso, id_usuario, id_categoria,
        titulo_archivo -- <--- AÑADE ESTO AQUÍ
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          req.file.originalname,
          fileType,
          ruta_storage,
          fuente,
          lugar_captura,
          fecha_captura || null,
          derechos_uso,
          nivel_acceso || "público",
          req.user.id,
          id_categoria || null,
          titulo_archivo, // <--- AÑADE ESTO AQUÍ
        ],
      )

      const archivoId = result.insertId

      // Add tags if provided
      if (tags) {
        let tagArray;
        try {
          tagArray = JSON.parse(tags);
        } catch (e) {
          console.warn("Error parsing tags, treating as single tag string:", tags);
          tagArray = [tags]; // Treat as a single tag if parsing fails
        }
        for (const tagName of tagArray) {
          // Insert tag if it doesn't exist
          await pool.execute("INSERT IGNORE INTO tags (nombre) VALUES (?)", [tagName])

          // Get tag ID
          const [tagResult] = await pool.execute("SELECT id_tag FROM tags WHERE nombre = ?", [tagName])

          // Link file to tag
          await pool.execute("INSERT INTO archivo_tags (id_archivo, id_tag) VALUES (?, ?)", [
            archivoId,
            tagResult[0].id_tag,
          ])
        }
      }

      // Add to collections if provided
      if (colecciones) {
        let coleccionArray;
        try {
          coleccionArray = JSON.parse(colecciones);
        } catch (e) {
          console.warn("Error parsing colecciones, treating as single coleccion string:", colecciones);
          coleccionArray = [colecciones]; // Treat as a single collection if parsing fails
        }
        for (const coleccionId of coleccionArray) {
          await pool.execute("INSERT INTO archivo_coleccion (id_archivo, id_coleccion) VALUES (?, ?)", [
            archivoId,
            coleccionId,
          ])
        }
      }

      // Add to sections if provided
      if (secciones) {
        let seccionArray;
        try {
          seccionArray = JSON.parse(secciones);
        } catch (e) {
          console.warn("Error parsing secciones, treating as single seccion string:", secciones);
          seccionArray = [secciones]; // Treat as a single section if parsing fails
        }
        for (const seccionId of seccionArray) {
          await pool.execute("INSERT INTO archivo_seccion (id_archivo, id_seccion) VALUES (?, ?)", [
            archivoId,
            seccionId,
          ])
        }
      }

      res.status(201).json({
        message: "Archivo subido exitosamente",
        id: archivoId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: ruta_storage,
      })
    } catch (error) {
      console.error("Upload file error:", error)
      res.status(500).json({ error: "Error interno del servidor" })
    }
  },
)

// Helper function to determine file type
function getFileType(mimetype) {
  if (mimetype.startsWith("image/")) return "imagen"
  if (mimetype.startsWith("video/")) return "video"
  if (mimetype.startsWith("audio/")) return "audio"
  return "documento"
}

// Tags Routes
app.get("/api/tags", async (req, res) => { // Removido authenticateToken si es para acceso público
  try {
    const [rows] = await pool.execute("SELECT * FROM tags ORDER BY nombre")
    res.json(rows)
  } catch (error) {
    console.error("Get tags error:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

app.post("/api/tags", authenticateToken, authorize(["Administrador", "Periodista"]), async (req, res) => {
  try {
    const { nombre } = req.body

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es requerido" })
    }

    const [result] = await pool.execute("INSERT INTO tags (nombre) VALUES (?)", [nombre])

    res.status(201).json({
      message: "Tag creado exitosamente",
      id: result.insertId,
    })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "El tag ya existe" })
    }
    console.error("Create tag error:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// Collections Routes
app.get("/api/colecciones", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM colecciones ORDER BY nombre")
    res.json(rows)
  } catch (error) {
    console.error("Get collections error:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

app.post("/api/colecciones", authenticateToken, authorize(["Administrador", "Periodista"]), async (req, res) => {
  try {
    const { nombre, descripcion } = req.body

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es requerido" })
    }

    const [result] = await pool.execute("INSERT INTO colecciones (nombre, descripcion) VALUES (?, ?)", [
      nombre,
      descripcion,
    ])

    res.status(201).json({
      message: "Colección creada exitosamente",
      id: result.insertId,
    })
  } catch (error) {
    console.error("Create collection error:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// Sections Routes
app.get("/api/secciones", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM secciones_periodico ORDER BY nombre")
    res.json(rows)
  } catch (error) {
    console.error("Get sections error:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

app.post("/api/secciones", authenticateToken, authorize(["Administrador"]), async (req, res) => {
  try {
    const { nombre } = req.body

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es requerido" })
    }

    const [result] = await pool.execute("INSERT INTO secciones_periodico (nombre) VALUES (?)", [nombre])

    res.status(201).json({
      message: "Sección creada exitosamente",
      id: result.insertId,
    })
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "La sección ya existe" })
    }
    console.error("Create section error:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// Search endpoint
app.get("/api/buscar", authenticateToken, async (req, res) => {
  try {
    const { q, tipo, categoria } = req.query

    if (!q) {
      return res.status(400).json({ error: "Parámetro de búsqueda requerido" })
    }

    let query = `
      SELECT DISTINCT a.*, c.nombre as categoria_nombre, u.nombre as usuario_nombre
      FROM archivos a
      LEFT JOIN categorias c ON a.id_categoria = c.id_categoria
      LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
      LEFT JOIN archivo_tags at ON a.id_archivo = at.id_archivo
      LEFT JOIN tags t ON at.id_tag = t.id_tag
      WHERE (
        a.nombre_archivo LIKE ? OR
        a.fuente LIKE ? OR
        a.lugar_captura LIKE ? OR
        t.nombre LIKE ? OR
        a.titulo_archivo LIKE ? -- <--- AÑADE ESTO AQUÍ
      )
    `

    const params = [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`] // <--- AÑADE UN PARÁMETRO AQUÍ

    // Apply access level restrictions
    if (req.user.rol === "Visualizador") {
      query += ' AND a.nivel_acceso = "público"'
    } else if (req.user.rol === "Periodista") {
      query += ' AND (a.nivel_acceso IN ("público", "restringido") OR a.id_usuario = ?)'
      params.push(req.user.id)
    }

    if (tipo) {
      query += " AND a.tipo = ?"
      params.push(tipo)
    }

    if (categoria) {
      query += " AND a.id_categoria = ?"
      params.push(categoria)
    }

    query += " ORDER BY a.fecha_subida DESC LIMIT 50"

    const [rows] = await pool.execute(query, params)
    res.json(rows)
  } catch (error) {
    console.error("Search error:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// Statistics endpoint
app.get("/api/estadisticas", authenticateToken, authorize(["Administrador"]), async (req, res) => {
  try {
    const [totalFiles] = await pool.execute("SELECT COUNT(*) as total FROM archivos")
    const [totalUsers] = await pool.execute("SELECT COUNT(*) as total FROM usuarios")
    const [filesByType] = await pool.execute(`
      SELECT tipo, COUNT(*) as cantidad 
      FROM archivos 
      GROUP BY tipo
    `)
    const [filesByAccess] = await pool.execute(`
      SELECT nivel_acceso, COUNT(*) as cantidad 
      FROM archivos 
      GROUP BY nivel_acceso
    `)

    res.json({
      totalArchivos: totalFiles[0].total,
      totalUsuarios: totalUsers[0].total,
      archivosPorTipo: filesByType,
      archivosPorAcceso: filesByAccess,
    })
  } catch (error) {
    console.error("Statistics error:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Error interno del servidor" });
});

// PATCH /api/archivos/:id/descarga → Registrar una descarga
app.patch("/api/archivos/:id/descarga", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica si el archivo existe primero
    const [rows] = await pool.execute("SELECT downloads FROM archivos WHERE id_archivo = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    // Actualiza el contador de descargas
    await pool.execute(
      "UPDATE archivos SET downloads = COALESCE(downloads, 0) + 1 WHERE id_archivo = ?",
      [id]
    );

    res.json({ message: "Descarga registrada correctamente" });
  } catch (error) {
    console.error("Error registrando descarga:", error);
    res.status(500).json({ error: "Error interno al registrar la descarga" });
  }

});

// Consolidado la lógica de descarga en una única ruta más robusta
app.get("/api/descargar/:id", authenticateToken, async (req, res) => {
  const fileId = req.params.id;

  try {
    // 1. Obtener información del archivo de la base de datos
    const [rows] = await pool.execute('SELECT ruta_storage, nombre_archivo, nivel_acceso, id_usuario FROM archivos WHERE id_archivo = ?', [fileId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Archivo no encontrado.' });
    }

    const file = rows[0];

    // Lógica de control de acceso basada en tu implementación (Visualizador, Periodista, Administrador)
    if (req.user.rol === "Visualizador" && file.nivel_acceso !== "público") {
      return res.status(403).json({ error: 'Acceso denegado. Solo puedes descargar archivos públicos.' });
    }
    if (req.user.rol === "Periodista" && !(file.nivel_acceso === "público" || file.nivel_acceso === "restringido" || file.id_usuario === req.user.id)) {
        return res.status(403).json({ error: 'Acceso denegado. No tienes permisos para descargar este archivo.' });
    }
    // Administrador tiene acceso a todo

    // 2. Incrementar el contador de descargas
    await pool.execute('UPDATE archivos SET downloads = COALESCE(downloads, 0) + 1 WHERE id_archivo = ?', [fileId]);

    // 3. Construir la ruta al archivo en el sistema de archivos
    const fileNameInStorage = path.basename(file.ruta_storage);
    const filePath = path.join(__dirname, 'uploads', fileNameInStorage);

    // Verificar si el archivo existe en el sistema de archivos
    const fileExists = await fs.access(filePath)
                               .then(() => true)
                               .catch(() => false);

    if (!fileExists) {
        console.error(`Archivo no encontrado en el sistema de archivos: ${filePath}`);
        return res.status(500).json({ error: 'El archivo no está disponible para descarga en el servidor.' });
    }

    // 4. Enviar el archivo al cliente
    res.download(filePath, file.nombre_archivo, (err) => {
      if (err) {
        console.error(`Error al enviar el archivo ${file.nombre_archivo}:`, err);
        if (!res.headersSent) { // Evitar enviar cabeceras dos veces
            res.status(500).json({ error: 'Error al iniciar la descarga del archivo.' });
        }
      } else {
        console.log(`Archivo ${file.nombre_archivo} descargado y contador incrementado.`);
      }
    });

  } catch (error) {
    console.error("Error en la ruta de descarga:", error);
    if (!res.headersSent) {
        res.status(500).json({ error: "Error interno del servidor al procesar la descarga." });
    }
  }
});

// manejador 404:
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint no encontrado" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`)
})