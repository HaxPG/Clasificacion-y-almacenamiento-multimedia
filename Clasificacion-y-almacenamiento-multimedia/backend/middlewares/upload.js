const multer = require("multer")
const path = require("path")
const fs = require("fs-extra")

// Configurar almacenamiento
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, "0")

      // Determinar tipo de archivo
      let fileType = "otros"
      if (file.mimetype.startsWith("image/")) fileType = "imagenes"
      else if (file.mimetype.startsWith("video/")) fileType = "videos"
      else if (file.mimetype.startsWith("audio/")) fileType = "audios"
      else if (file.mimetype.includes("pdf") || file.mimetype.includes("document")) fileType = "documentos"

      const uploadPath = path.join(process.env.UPLOAD_PATH, fileType, year.toString(), month)

      // Crear directorio si no existe
      await fs.ensureDir(uploadPath)

      cb(null, uploadPath)
    } catch (error) {
      cb(error)
    }
  },
  filename: (req, file, cb) => {
    // Generar nombre único
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const extension = path.extname(file.originalname)
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50)

    cb(null, `${baseName}_${uniqueSuffix}${extension}`)
  },
})

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Imágenes
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    // Videos
    "video/mp4",
    "video/avi",
    "video/mov",
    "video/wmv",
    // Audios
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/mpeg",
    // Documentos
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: Number.parseInt(process.env.MAX_FILE_SIZE) || 50000000, // 50MB por defecto
  },
})

module.exports = upload
