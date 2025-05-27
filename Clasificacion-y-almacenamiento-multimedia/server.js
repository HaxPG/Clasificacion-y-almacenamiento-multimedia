const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

const db = require("./config/database")
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const fileRoutes = require("./routes/files")
const tagRoutes = require("./routes/tags")
const categoryRoutes = require("./routes/categories")
const collectionRoutes = require("./routes/collections")
const sectionRoutes = require("./routes/sections")
const searchRoutes = require("./routes/search")

const app = express()

// Middlewares de seguridad
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
})
app.use(limiter)

// Middlewares generales
app.use(morgan("combined"))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Servir archivos estáticos
app.use("/uploads", express.static("uploads"))

// Rutas
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/files", fileRoutes)
app.use("/api/tags", tagRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/collections", collectionRoutes)
app.use("/api/sections", sectionRoutes)
app.use("/api/search", searchRoutes)

// Ruta de prueba
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Servidor funcionando correctamente",
    timestamp: new Date().toISOString(),
  })
})

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: "Error interno del servidor",
    message: process.env.NODE_ENV === "development" ? err.message : "Algo salió mal",
  })
})

// Ruta no encontrada
app.use("*", (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`)
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`)
  console.log(`🗄️  Base de datos: ${process.env.DB_NAME}`)
})
