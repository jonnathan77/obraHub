const router = require('express').Router()
const etapasController = require('../controllers/etapas.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware)

// Criar nova etapa
router.post('/', etapasController.create)

// Listar etapas de uma obra
router.get('/obra/:obra_id', etapasController.listByObra)

// Obter etapa por ID
router.get('/:id', etapasController.getById)

// Atualizar etapa
router.patch('/:id', etapasController.update)

// Deletar etapa
router.delete('/:id', etapasController.delete)

module.exports = router
