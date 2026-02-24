const router = require('express').Router()
const ocorrenciasController = require('../controllers/ocorrencias.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware)

// Criar nova ocorrência
router.post('/', ocorrenciasController.create)

// Listar ocorrências de uma obra
router.get('/obra/:obra_id', ocorrenciasController.listByObra)

// Obter ocorrência por ID
router.get('/:id', ocorrenciasController.getById)

// Atualizar ocorrência
router.patch('/:id', ocorrenciasController.update)

// Deletar ocorrência
router.delete('/:id', ocorrenciasController.delete)

module.exports = router
