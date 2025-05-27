const express = require("express")
const { body } = require("express-validator")
const { authenticateToken } = require("../middlewares/auth")
const { login, register, verifyToken } = require("../controllers/authController")

const router = express.Router()

// Validaciones
const loginValidation = [body("email").isEmail().normalizeEmail(), body("password").isLength({ min: 6 })]

const registerValidation = [
  body("nombre").isLength({ min: 2 }).trim(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("rol").optional().isIn(["Administrador", "Periodista", "Visualizador"]),
]

// Rutas
router.post("/login", loginValidation, login)
router.post("/register", registerValidation, register)
router.get("/verify", authenticateToken, verifyToken)

module.exports = router
