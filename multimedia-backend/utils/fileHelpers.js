import path from "path"

export const getFileType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "imagen"
  if (mimetype.startsWith("video/")) return "video"
  if (mimetype.startsWith("audio/")) return "audio"
  return "documento"
}

export const createThumbnail = async (filePath, outputPath) => {
  // Implementar generación de miniaturas según el tipo de archivo
  // Puedes usar librerías como sharp para imágenes o ffmpeg para videos
  try {
    // Placeholder implementation
    console.log(`Creating thumbnail for ${filePath} -> ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error("Error creating thumbnail:", error)
    return null
  }
}

export const validateFileType = (file, allowedTypes) => {
  const fileExtension = path.extname(file.originalname).toLowerCase()
  const mimeType = file.mimetype

  return allowedTypes.some((type) => fileExtension.includes(type) || mimeType.includes(type))
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
