const router = require('express').Router()
const worksController = require('../controllers/works.controller')
const financeiroController = require('../controllers/financeiro.controller')
const estruturaController = require('../controllers/estrutura.controller')
const atividadesController = require('../controllers/atividades.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware)

// Obras
router.post('/', worksController.create)
router.get('/', worksController.list)
router.get('/:id', worksController.getById)
router.patch('/:id', worksController.update)
router.delete('/:id', worksController.delete)

// Estrutura
router.get('/:id/estrutura', estruturaController.listByObra)
router.post('/:id/estrutura', estruturaController.create)

// Atividades
router.get('/:id/atividades', atividadesController.listByObra)
router.post('/:id/atividades', atividadesController.create)

// Checklist visual
router.get('/:id/checklist', atividadesController.checklist)
router.patch('/atividades/status', atividadesController.updateStatus)

// Financeiro
router.get('/dashboard/alertas', financeiroController.alertasDashboard)
router.get('/:id/saude', financeiroController.saudeObra)

module.exports = router