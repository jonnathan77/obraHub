const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middlewares/auth.middleware');
const financeiroController = require('../controllers/financeiro.controller');

const router = express.Router();
router.use(authMiddleware);

// Upload planilha previsão caixa
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Apenas XLSX, XLS ou CSV permitidos'), false);
    }
  }
});

router.post('/upload', upload.single('planilha'), financeiroController.uploadPlanilha);

module.exports = router;

