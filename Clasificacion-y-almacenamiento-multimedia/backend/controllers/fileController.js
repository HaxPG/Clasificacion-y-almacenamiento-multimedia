const path = require("path")
const fs = require("fs-extra")
const db = require("../config/database")

// Subir archivo
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó ningún archivo" })
    }

    const { titulo, descripcion, categoria_id, seccion_id, nivel_acceso = "publico", tags = "" } = req.body

    // Obtener información del archivo
    const fileInfo = {
      nombre_original: req.file.originalname,
      nombre_archivo: req.file.filename,
      ruta_archivo: req.file.path,
      tipo_mime: req.file.mimetype,
      tamaño: req.file.size,
      extension: path.extname(req.file.originalname).toLowerCase(),
    }

    // Determinar tipo de archivo
    let tipo_archivo = "otro"
    if (fileInfo.tipo_mime.startsWith("image/")) tipo_archivo = "imagen"
    else if (fileInfo.tipo_mime.startsWith("video/")) tipo_archivo = "video"
    else if (fileInfo.tipo_mime.startsWith("audio/")) tipo_archivo = "audio"
    else if (fileInfo.tipo_mime.includes("pdf") || fileInfo.tipo_mime.includes("document")) tipo_archivo = "documento"

    // Insertar archivo en la base de datos
    const [result] = await db.execute(
      `
      INSERT INTO archivos (
        titulo, descripcion, nombre_original, nombre_archivo, ruta_archivo,
        tipo_archivo, tipo_mime, tamaño, extension, categoria_id, seccion_id,
        nivel_acceso, usuario_id, fecha_subida
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
      [
        titulo || fileInfo.nombre_original,
        descripcion || "",
        fileInfo.nombre_original,
        fileInfo.nombre_archivo,
        fileInfo.ruta_archivo,
        tipo_archivo,
        fileInfo.tipo_mime,
        fileInfo.tamaño,
        fileInfo.extension,
        categoria_id || null,
        seccion_id || null,
        nivel_acceso,
        req.user.id,
      ],
    )

    const archivoId = result.insertId

    // Procesar tags si se proporcionaron
    if (tags) {
      const tagList = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)

      for (const tagNombre of tagList) {
        // Buscar o crear tag
        const [existingTags] = await db.execute("SELECT id FROM tags WHERE nombre = ?", [tagNombre])

        let tagId
        if (existingTags.length === 0) {
          const [tagResult] = await db.execute("INSERT INTO tags (nombre, fecha_creacion) VALUES (?, NOW())", [
            tagNombre,
          ])
          tagId = tagResult.insertId
        } else {
          tagId = existingTags[0].id
        }

        // Asociar tag con archivo
        await db.execute("INSERT IGNORE INTO archivo_tags (archivo_id, tag_id) VALUES (?, ?)", [archivoId, tagId])
      }
    }

    // Obtener el archivo completo para la respuesta
    const [files] = await db.execute(
      `
      SELECT a.*, c.nombre as categoria_nombre, s.nombre as seccion_nombre,
             u.nombre as usuario_nombre
      FROM archivos a
      LEFT JOIN categorias c ON a.categoria_id = c.id
      LEFT JOIN secciones_periodico s ON a.seccion_id = s.id
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      WHERE a.id = ?
    `,
      [archivoId],
    )

    res.status(201).json({
      message: "Archivo subido exitosamente",
      archivo: files[0],
    })
  } catch (error) {
    // Eliminar archivo si hubo error en la base de datos
    if (req.file && req.file.path) {
      await fs.remove(req.file.path).catch(console.error)
    }

    console.error("Error subiendo archivo:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

// Listar archivos
const getFiles = async (req, res) => {
  try {
    const { page = 1, limit = 20, tipo_archivo, categoria_id, seccion_id, nivel_acceso } = req.query

    const offset = (page - 1) * limit
    const whereConditions = []
    const queryParams = []

    // Filtros
    if (tipo_archivo) {
      whereConditions.push("a.tipo_archivo = ?")
      queryParams.push(tipo_archivo)
    }

    if (categoria_id) {
      whereConditions.push("a.categoria_id = ?")
      queryParams.push(categoria_id)
    }

    if (seccion_id) {
      whereConditions.push("a.seccion_id = ?")
      queryParams.push(seccion_id)
    }

    if (nivel_acceso) {
      whereConditions.push("a.nivel_acceso = ?")
      queryParams.push(nivel_acceso)
    }

    // Control de acceso por rol
    if (req.user.rol === "Visualizador") {
      whereConditions.push("a.nivel_acceso = ?")
      queryParams.push("publico")
    }

    const whereClause = whereConditions.length > 0 ? "WHERE " + whereConditions.join(" AND ") : ""

    // Consulta principal
    const [files] = await db.execute(
      `
      SELECT a.*, c.nombre as categoria_nombre, s.nombre as seccion_nombre,
             u.nombre as usuario_nombre,
             GROUP_CONCAT(t.nombre) as tags
      FROM archivos a
      LEFT JOIN categorias c ON a.categoria_id = c.id
      LEFT JOIN secciones_periodico s ON a.seccion_id = s.id
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN archivo_tags at ON a.id = at.archivo_id
      LEFT JOIN tags t ON at.tag_id = t.id
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.fecha_subida DESC
      LIMIT ? OFFSET ?
    `,
      [...queryParams, Number.parseInt(limit), Number.parseInt(offset)],
    )

    // Contar total
    const [countResult] = await db.execute(
      `
      SELECT COUNT(DISTINCT a.id) as total
      FROM archivos a
      LEFT JOIN categorias c ON a.categoria_id = c.id
      LEFT JOIN secciones_periodico s ON a.seccion_id = s.id
      ${whereClause}
    `,
      queryParams,
    )

    const total = countResult[0].total
    const totalPages = Math.ceil(total / limit)

    res.json({
      files,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number.parseInt(limit),
      },
    })
  } catch (error) {
    console.error("Error obteniendo archivos:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

// Obtener archivo por ID
const getFileById = async (req, res) => {
  try {
    const { id } = req.params

    const [files] = await db.execute(
      `
      SELECT a.*, c.nombre as categoria_nombre, s.nombre as seccion_nombre,
             u.nombre as usuario_nombre
      FROM archivos a
      LEFT JOIN categorias c ON a.categoria_id = c.id
      LEFT JOIN secciones_periodico s ON a.seccion_id = s.id
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      WHERE a.id = ?
    `,
      [id],
    )

    if (files.length === 0) {
      return res.status(404).json({ error: "Archivo no encontrado" })
    }

    const archivo = files[0]

    // Control de acceso
    if (req.user.rol === "Visualizador" && archivo.nivel_acceso !== "publico") {
      return res.status(403).json({ error: "No tienes permisos para ver este archivo" })
    }

    // Obtener tags
    const [tags] = await db.execute(
      `
      SELECT t.id, t.nombre
      FROM tags t
      JOIN archivo_tags at ON t.id = at.tag_id
      WHERE at.archivo_id = ?
    `,
      [id],
    )

    archivo.tags = tags

    res.json(archivo)
  } catch (error) {
    console.error("Error obteniendo archivo:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

// Actualizar metadatos del archivo
const updateFile = async (req, res) => {
  try {
    const { id } = req.params
    const { titulo, descripcion, categoria_id, seccion_id, nivel_acceso, tags } = req.body

    // Verificar que el archivo existe
    const [files] = await db.execute("SELECT * FROM archivos WHERE id = ?", [id])

    if (files.length === 0) {
      return res.status(404).json({ error: "Archivo no encontrado" })
    }

    const archivo = files[0]

    // Control de permisos
    if (req.user.rol !== "Administrador" && archivo.usuario_id !== req.user.id) {
      return res.status(403).json({ error: "No tienes permisos para editar este archivo" })
    }

    // Actualizar archivo
    await db.execute(
      `
      UPDATE archivos 
      SET titulo = ?, descripcion = ?, categoria_id = ?, seccion_id = ?, nivel_acceso = ?
      WHERE id = ?
    `,
      [titulo, descripcion, categoria_id || null, seccion_id || null, nivel_acceso, id],
    )

    // Actualizar tags si se proporcionaron
    if (tags !== undefined) {
      // Eliminar tags existentes
      await db.execute("DELETE FROM archivo_tags WHERE archivo_id = ?", [id])

      // Agregar nuevos tags
      if (tags) {
        const tagList = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)

        for (const tagNombre of tagList) {
          const [existingTags] = await db.execute("SELECT id FROM tags WHERE nombre = ?", [tagNombre])

          let tagId
          if (existingTags.length === 0) {
            const [tagResult] = await db.execute("INSERT INTO tags (nombre, fecha_creacion) VALUES (?, NOW())", [
              tagNombre,
            ])
            tagId = tagResult.insertId
          } else {
            tagId = existingTags[0].id
          }

          await db.execute("INSERT INTO archivo_tags (archivo_id, tag_id) VALUES (?, ?)", [id, tagId])
        }
      }
    }

    res.json({ message: "Archivo actualizado exitosamente" })
  } catch (error) {
    console.error("Error actualizando archivo:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

// Eliminar archivo
const deleteFile = async (req, res) => {
  try {
    const { id } = req.params

    // Verificar que el archivo existe
    const [files] = await db.execute("SELECT * FROM archivos WHERE id = ?", [id])

    if (files.length === 0) {
      return res.status(404).json({ error: "Archivo no encontrado" })
    }

    const archivo = files[0]

    // Control de permisos
    if (req.user.rol !== "Administrador" && archivo.usuario_id !== req.user.id) {
      return res.status(403).json({ error: "No tienes permisos para eliminar este archivo" })
    }

    // Eliminar archivo físico
    try {
      await fs.remove(archivo.ruta_archivo)
    } catch (error) {
      console.error("Error eliminando archivo físico:", error)
    }

    // Eliminar relaciones
    await db.execute("DELETE FROM archivo_tags WHERE archivo_id = ?", [id])
    await db.execute("DELETE FROM archivo_coleccion WHERE archivo_id = ?", [id])

    // Eliminar registro de la base de datos
    await db.execute("DELETE FROM archivos WHERE id = ?", [id])

    res.json({ message: "Archivo eliminado exitosamente" })
  } catch (error) {
    console.error("Error eliminando archivo:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  uploadFile,
  getFiles,
  getFileById,
  updateFile,
  deleteFile,
}
