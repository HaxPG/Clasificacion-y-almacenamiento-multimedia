const express = require("express")
const { authenticateToken, authorizeRoles } = require("../middlewares/auth")
const upload = require("../middlewares/upload")
const { uploadFile, getFiles, getFileById, updateFile, deleteFile } = require("../controllers/fileController")

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Rutas
router.post("/", upload.single("file"), uploadFile)
router.get("/", getFiles)
router.get("/:id", getFileById)
router.put("/:id", updateFile)
router.delete("/:id", deleteFile)

module.exports = router
