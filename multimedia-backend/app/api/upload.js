const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegura que exista la carpeta
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => {
    const unique = Date.now() + path.extname(file.originalname);
    cb(null, unique);
  }
});

const upload = multer({ storage });

module.exports = function uploadHandler(req, res) {
  upload.single('file')(req, res, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al subir archivo' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ message: 'Subido', url: fileUrl });
  });
};
