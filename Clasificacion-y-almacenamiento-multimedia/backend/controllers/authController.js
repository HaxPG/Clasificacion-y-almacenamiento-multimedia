const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { validationResult } = require("express-validator")
const db = require("../config/database")

// Generar token JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
}

// Login
const login = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    // Buscar usuario
    const [users] = await db.execute("SELECT id, email, password, rol, activo, nombre FROM usuarios WHERE email = ?", [
      email,
    ])

    if (users.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    const user = users[0]

    if (!user.activo) {
      return res.status(401).json({ error: "Usuario inactivo" })
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    // Generar token
    const token = generateToken(user.id)

    // Actualizar último acceso
    await db.execute("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?", [user.id])

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
      },
    })
  } catch (error) {
    console.error("Error en login:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

// Registro
const register = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { nombre, email, password, rol = "Visualizador" } = req.body

    // Verificar si el usuario ya existe
    const [existingUsers] = await db.execute("SELECT id FROM usuarios WHERE email = ?", [email])

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "El usuario ya existe" })
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear usuario
    const [result] = await db.execute(
      "INSERT INTO usuarios (nombre, email, password, rol, activo, fecha_creacion) VALUES (?, ?, ?, ?, 1, NOW())",
      [nombre, email, hashedPassword, rol],
    )

    res.status(201).json({
      message: "Usuario creado exitosamente",
      userId: result.insertId,
    })
  } catch (error) {
    console.error("Error en registro:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

// Verificar token
const verifyToken = async (req, res) => {
  try {
    res.json({
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        rol: req.user.rol,
      },
    })
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

module.exports = {
  login,
  register,
  verifyToken,
}
