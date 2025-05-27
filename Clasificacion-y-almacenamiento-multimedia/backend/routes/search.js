const express = require("express")
const { authenticateToken } = require("../middlewares/auth")
const db = require("../config/database")

const router = express.Router()
router.use(authenticateToken)

// Búsqueda avanzada
router.get("/", async (req, res) => {
  try {
    const {
      q = "",
      tipo_archivo,
      categoria_id,
      seccion_id,
      fecha_desde,
      fecha_hasta,
      nivel_acceso,
      tags,
      page = 1,
      limit = 20,
    } = req.query

    const offset = (page - 1) * limit
    const whereConditions = []
    const queryParams = []

    // Búsqueda por texto
    if (q) {
      whereConditions.push("(a.titulo LIKE ? OR a.descripcion LIKE ? OR a.nombre_original LIKE ?)")
      const searchTerm = `%${q}%`
      queryParams.push(searchTerm, searchTerm, searchTerm)
    }

    // Filtros adicionales
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

    if (fecha_desde) {
      whereConditions.push("DATE(a.fecha_subida) >= ?")
      queryParams.push(fecha_desde)
    }

    if (fecha_hasta) {
      whereConditions.push("DATE(a.fecha_subida) <= ?")
      queryParams.push(fecha_hasta)
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

    // Búsqueda por tags
    let joinClause = ""
    if (tags) {
      const tagList = tags.split(",").map((tag) => tag.trim())
      joinClause = `
        JOIN archivo_tags at ON a.id = at.archivo_id
        JOIN tags t ON at.tag_id = t.id
      `
      whereConditions.push(`t.nombre IN (${tagList.map(() => "?").join(",")})`)
      queryParams.push(...tagList)
    }

    const whereClause = whereConditions.length > 0 ? "WHERE " + whereConditions.join(" AND ") : ""

    // Consulta principal
    const [files] = await db.execute(
      `
      SELECT DISTINCT a.*, c.nombre as categoria_nombre, s.nombre as seccion_nombre,
             u.nombre as usuario_nombre,
             GROUP_CONCAT(DISTINCT t2.nombre) as tags
      FROM archivos a
      LEFT JOIN categorias c ON a.categoria_id = c.id
      LEFT JOIN secciones_periodico s ON a.seccion_id = s.id
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN archivo_tags at2 ON a.id = at2.archivo_id
      LEFT JOIN tags t2 ON at2.tag_id = t2.id
      ${joinClause}
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
      ${joinClause}
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
      searchParams: req.query,
    })
  } catch (error) {
    console.error("Error en búsqueda:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

module.exports = router
