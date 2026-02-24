const router = require('express').Router()
const multer = require('multer')
const fotosController = require('../controllers/fotos.controller')
const authMiddleware = require('../middlewares/auth.middleware')

// Configurar multer para armazenar na memória
const upload = multer({ storage: multer.memoryStorage() })

router.use(authMiddleware)

// Upload de foto para Cloudinary
router.post('/', upload.single('foto'), fotosController.upload)

// Listar fotos de uma obra
router.get('/obra/:obra_id', fotosController.listByObra)

// Obter foto
router.get('/:id', fotosController.getById)

// Atualizar descrição da foto
router.patch('/:id', fotosController.update)

// Deletar foto
router.delete('/:id', fotosController.delete)

module.exports = router

// Deletar foto
router.delete('/:id', fotosController.delete)

module.exports = router
