const jwt = require("jsonwebtoken")
const db = require("../config/database")

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({ error: "Token de acceso requerido" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Verificar que el usuario existe y está activo
    const [users] = await db.execute("SELECT id, email, rol, activo FROM usuarios WHERE id = ?", [decoded.userId])

    if (users.length === 0 || !users[0].activo) {
      return res.status(401).json({ error: "Usuario no válido o inactivo" })
    }

    req.user = users[0]
    next()
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" })
    }
    return res.status(403).json({ error: "Token no válido" })
  }
}

// Middleware para verificar roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" })
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        error: "No tienes permisos para realizar esta acción",
        requiredRoles: roles,
        userRole: req.user.rol,
      })
    }

    next()
  }
}

module.exports = {
  authenticateToken,
  authorizeRoles,
}
