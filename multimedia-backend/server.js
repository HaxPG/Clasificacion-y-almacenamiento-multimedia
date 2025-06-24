import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mysql from "mysql2/promise"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import multer from "multer"
import path from "path"
import fs from "fs/promises" // Importa la versión de promesas de fs
import { fileURLToPath } from "url"

// Cargar variables de entorno desde .env
dotenv.config()

// Obtener __filename y __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Inicializar la aplicación Express
const app = express()
const PORT = process.env.PORT || 3000

// --- Middleware Globales ---
console.log('Ruta base del servidor (__dirname):', __dirname);
const uploadsPath = path.join(__dirname, "uploads");
console.log('Ruta de la carpeta uploads que se intenta servir:', uploadsPath);

app.use(
  cors({
    origin: ["http://localhost:4200", "http://localhost:3000"], // Asegúrate de que esto coincide con tu frontend
    credentials: true,
  }),
)
// Middleware para parsear JSON y URL-encoded bodies con límite de tamaño
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// Middleware para servir archivos estáticos desde la carpeta 'uploads'
// Esto permite acceder directamente a los archivos si se conoce la ruta completa (menos seguro para descargas controladas)
app.use("/api/uploads", express.static(uploadsPath));

// --- Configuración de la Base de Datos ---
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

// Función para probar la conexión a la base de datos
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

// --- Configuración de Multer para Subida de Archivos ---
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads")
    try {
      await fs.access(uploadDir) // Verifica si el directorio existe
    } catch {
      await fs.mkdir(uploadDir, { recursive: true }) // Si no, lo crea
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
    fileSize: 100 * 1024 * 1024, // Límite de 100MB por archivo
  },
  fileFilter: (req, file, cb) => {
    // Expresión regular para tipos de archivo permitidos
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mov|mkv|pdf|doc|docx|txt|xlsx|pptx|mp3|wav/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    console.log("🧪 Archivo recibido para filtro:", file.originalname, "→", file.mimetype)

    if (mimetype && extname) {
      return cb(null, true) // Aceptar el archivo
    } else {
      cb(new Error("Tipo de archivo no permitido")) // Rechazar el archivo
    }
  },
})

// --- Middleware de Autenticación JWT ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Token de acceso requerido" })
  }

  jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", (err, user) => {
    if (err) {
      // Si el token es inválido o ha expirado
      return res.status(403).json({ error: "Token inválido o expirado" })
    }
    req.user = user // Adjuntar la información del usuario al objeto de solicitud
    next()
  })
}

// --- Middleware de Autorización por Rol ---
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: "No tienes permisos para esta acción" })
    }
    next()
  }
}

// --- Rutas de Autenticación ---
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

    // Generar JWT
    const token = jwt.sign(
      {
        id: user.id_usuario,
        correo: user.correo,
        rol: user.rol,
        nombre: user.nombre,
      },
      process.env.JWT_SECRET || "your-secret-key", // ¡Usar una clave secreta fuerte y única!
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

    // Verificar si el usuario ya existe
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

// --- Rutas de Usuarios ---
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

    // Los usuarios solo pueden acceder a sus propios datos a menos que sean administradores
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

// --- Rutas de Categorías ---
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

// --- Rutas de Archivos ---
app.get("/api/archivos", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, tipo, categoria, tag, nivel_acceso } = req.query
    const offset = (Number.parseInt(page) - 1) * Number.parseInt(limit) // Asegúrate de parsear a número

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

    // Aplicar filtros basados en el rol del usuario para la visualización
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
    // Si se busca por tag, se necesita un JOIN adicional o subconsulta
    // Por simplicidad, si `tag` se usa en un LIKE en la consulta principal,
    // Asegúrate de que los `GROUP_CONCAT` se manejen bien con la paginación.
    // Para tags, quizás sea mejor un `HAVING` o una subconsulta compleja si necesitas filtrar por tags específicos
    if (tag) {
      // Para buscar archivos que tienen un tag específico, puedes unirte a la tabla de tags
      // y filtrar por el nombre del tag. Esto es más robusto que un LIKE en GROUP_CONCAT.
      query += ' AND a.id_archivo IN (SELECT at2.id_archivo FROM archivo_tags at2 JOIN tags t2 ON at2.id_tag = t2.id_tag WHERE t2.nombre LIKE ?)'
      params.push(`%${tag}%`)
    }


    if (nivel_acceso && req.user.rol === "Administrador") {
      query += " AND a.nivel_acceso = ?"
      params.push(nivel_acceso)
    }

    query += " GROUP BY a.id_archivo ORDER BY a.fecha_subida DESC LIMIT ? OFFSET ?"
    params.push(Number.parseInt(limit), offset)

    const [rows] = await pool.execute(query, params)

    // Obtener el conteo total para la paginación
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
    if (tag) {
      countQuery += ' AND a.id_archivo IN (SELECT at2.id_archivo FROM archivo_tags at2 JOIN tags t2 ON at2.id_tag = t2.id_tag WHERE t2.nombre LIKE ?)'
      countParams.push(`%${tag}%`)
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
        pages: Math.ceil(total / Number.parseInt(limit)),
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
  upload.single("archivo"), // Maneja la subida de un solo archivo con el nombre de campo "archivo"
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se ha subido ningún archivo" })
      }

      // Desestructurar los campos del body y el archivo
      const {
        titulo_archivo,
        tipo,
        fuente,
        lugar_captura,
        fecha_captura,
        derechos_uso,
        nivel_acceso,
        id_categoria,
        tags,        // Vienen como string JSON o string simple
        colecciones, // Vienen como string JSON o string simple
        secciones,   // Vienen como string JSON o string simple
      } = req.body

      const ruta_storage = `uploads/${req.file.filename}` // Ruta relativa para guardar en BD

      // Determinar el tipo de archivo si no se proporciona explícitamente
      const fileType = tipo || getFileType(req.file.mimetype)

      // Insertar información del archivo en la base de datos
      const [result] = await pool.execute(
        `
          INSERT INTO archivos (
            nombre_archivo, tipo, ruta_storage, fuente, lugar_captura,
            fecha_captura, derechos_uso, nivel_acceso, id_usuario, id_categoria,
            titulo_archivo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          req.file.originalname,
          fileType,
          ruta_storage,
          fuente,
          lugar_captura,
          fecha_captura || null, // Permite nulo si no se proporciona fecha
          derechos_uso,
          nivel_acceso || "público", // Valor por defecto
          req.user.id, // ID del usuario que sube el archivo (del token JWT)
          id_categoria || null, // Permite nulo
          titulo_archivo,
        ],
      )

      const archivoId = result.insertId

      // Manejo de Tags
      if (tags) {
        let tagArray;
        try {
          tagArray = JSON.parse(tags); // Intenta parsear como JSON
        } catch (e) {
          console.warn("Error parsing tags, treating as single tag string:", tags);
          tagArray = [tags]; // Si falla, lo trata como un solo tag string
        }
        for (const tagName of tagArray) {
          // Insertar tag si no existe (INSERT IGNORE)
          await pool.execute("INSERT IGNORE INTO tags (nombre) VALUES (?)", [tagName])
          // Obtener el ID del tag
          const [tagResult] = await pool.execute("SELECT id_tag FROM tags WHERE nombre = ?", [tagName])
          // Vincular archivo con tag
          await pool.execute("INSERT INTO archivo_tags (id_archivo, id_tag) VALUES (?, ?)", [
            archivoId,
            tagResult[0].id_tag,
          ])
        }
      }

      // Manejo de Colecciones
      if (colecciones) {
        let coleccionArray;
        try {
          coleccionArray = JSON.parse(colecciones);
        } catch (e) {
          console.warn("Error parsing colecciones, treating as single coleccion string:", colecciones);
          coleccionArray = [colecciones];
        }
        for (const coleccionId of coleccionArray) {
          await pool.execute("INSERT INTO archivo_coleccion (id_archivo, id_coleccion) VALUES (?, ?)", [
            archivoId,
            coleccionId,
          ])
        }
      }

      // Manejo de Secciones
      if (secciones) {
        let seccionArray;
        try {
          seccionArray = JSON.parse(secciones);
        } catch (e) {
          console.warn("Error parsing secciones, treating as single seccion string:", secciones);
          seccionArray = [secciones];
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

// Función auxiliar para determinar el tipo de archivo basado en MIME type
function getFileType(mimetype) {
  if (mimetype.startsWith("image/")) return "imagen"
  if (mimetype.startsWith("video/")) return "video"
  if (mimetype.startsWith("audio/")) return "audio"
  return "documento" // Tipo por defecto
}

// --- Rutas de Tags ---
app.get("/api/tags", async (req, res) => { // Considera si necesita autenticación o si es público
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
    if (error.code === "ER_DUP_ENTRY") { // Manejo de error para entradas duplicadas
      return res.status(400).json({ error: "El tag ya existe" })
    }
    console.error("Create tag error:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// --- Rutas de Colecciones ---
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

// --- Rutas de Secciones de Periódico ---
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

// --- Ruta de Búsqueda General ---
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
        a.titulo_archivo LIKE ?
      )
    `

    const params = [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]

    // Aplicar restricciones de nivel de acceso
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

// --- Ruta de Estadísticas ---
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

// --- Ruta para Registrar una Descarga (PATCH) ---
// Esta ruta es útil si necesitas incrementar el contador SIN necesariamente enviar el archivo
// por ejemplo, si el archivo ya se está sirviendo directamente o por otro mecanismo.
// Sin embargo, para la descarga activa, la ruta GET /api/descargar/:id es más completa.
app.patch("/api/archivos/:id/descarga", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el archivo existe
    const [rows] = await pool.execute("SELECT id_archivo FROM archivos WHERE id_archivo = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    // Actualizar el contador de descargas
    await pool.execute(
      "UPDATE archivos SET downloads = COALESCE(downloads, 0) + 1 WHERE id_archivo = ?",
      [id]
    );

    res.json({ message: "Descarga registrada correctamente" });
  } catch (error) {
    console.error("Error registrando descarga (PATCH):", error);
    res.status(500).json({ error: "Error interno al registrar la descarga" });
  }
});

// --- Ruta Principal de Descarga de Archivos (GET) ---
// Esta ruta gestiona la autenticación, autorización, incrementa el contador y envía el archivo.
// Es la ruta preferida para iniciar una descarga desde el frontend.
app.get("/api/descargar/:id", authenticateToken, async (req, res) => {
  const fileId = req.params.id;
  console.log(`[Descarga] Solicitud de descarga para ID: ${fileId}`);

  try {
    // 1. Obtener información del archivo de la base de datos
    const [rows] = await pool.execute('SELECT ruta_storage, nombre_archivo, nivel_acceso, id_usuario FROM archivos WHERE id_archivo = ?', [fileId]);

    if (rows.length === 0) {
      console.log(`[Descarga] Archivo con ID ${fileId} no encontrado en la BD.`);
      return res.status(404).json({ error: 'Archivo no encontrado.' });
    }

    const file = rows[0];
    console.log(`[Descarga] Información de archivo obtenida: ${JSON.stringify(file)}`);

    // Lógica de control de acceso basada en rol
    // Nota: req.user.id es el id_usuario del usuario logueado
    // file.id_usuario es el id_usuario propietario del archivo
    if (req.user.rol === "Visualizador" && file.nivel_acceso !== "público") {
      console.warn(`[Descarga] Acceso denegado para Visualizador a archivo ${fileId} (${file.nivel_acceso}).`);
      return res.status(403).json({ error: 'Acceso denegado. Solo puedes descargar archivos públicos.' });
    }
    if (req.user.rol === "Periodista" && !(file.nivel_acceso === "público" || file.nivel_acceso === "restringido" || file.id_usuario === req.user.id)) {
        console.warn(`[Descarga] Acceso denegado para Periodista a archivo ${fileId} (${file.nivel_acceso}, propietario ${file.id_usuario}, usuario ${req.user.id}).`);
        return res.status(403).json({ error: 'Acceso denegado. No tienes permisos para descargar este archivo.' });
    }
    // El Administrador tiene acceso a todo por defecto si pasa los middlewares anteriores

    // 2. Incrementar el contador de descargas en la base de datos
    await pool.execute('UPDATE archivos SET downloads = COALESCE(downloads, 0) + 1 WHERE id_archivo = ?', [fileId]);
    console.log(`[Descarga] Contador de descargas incrementado para ID: ${fileId}.`);


    // 3. Construir la ruta absoluta al archivo en el sistema de archivos
    // path.basename(file.ruta_storage) extraerá solo el nombre del archivo
    // e.g., de "uploads/archivo-1700000000-123.jpg" -> "archivo-1700000000-123.jpg"
    const fileNameInStorage = path.basename(file.ruta_storage);
    const filePath = path.join(__dirname, 'uploads', fileNameInStorage);
    console.log(`[Descarga] Ruta física del archivo a descargar: ${filePath}`);

    // Verificar si el archivo existe físicamente en el servidor
    const fileExists = await fs.access(filePath)
                               .then(() => true)
                               .catch(() => false);

    if (!fileExists) {
        console.error(`[Descarga] Archivo no encontrado físicamente en el sistema: ${filePath}`);
        return res.status(500).json({ error: 'El archivo no está disponible para descarga en el servidor (físicamente no encontrado).' });
    }

    // 4. Enviar el archivo al cliente
    // res.download() establecerá automáticamente Content-Disposition para forzar la descarga
    res.download(filePath, file.nombre_archivo, (err) => {
      if (err) {
        // Manejar errores durante el envío del archivo
        console.error(`[Descarga] Error al enviar el archivo ${file.nombre_archivo} (ID: ${fileId}):`, err);
        // Evitar enviar cabeceras dos veces si ya se han enviado
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error al iniciar la descarga del archivo.' });
        }
      } else {
        console.log(`[Descarga] Archivo ${file.nombre_archivo} (ID: ${fileId}) enviado exitosamente.`);
      }
    });

  } catch (error) {
    console.error("[Descarga] Error general en la ruta de descarga:", error);
    if (!res.headersSent) {
        res.status(500).json({ error: "Error interno del servidor al procesar la descarga." });
    }
  }
});


// --- Manejador de Errores General ---
// Este middleware captura cualquier error no manejado en las rutas
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Error interno del servidor" });
});

// --- Manejador 404 (para rutas no definidas) ---
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint no encontrado" });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`)
})
