const router = require('express').Router()
const worksController = require('../controllers/works.controller')
const financeiroController = require('../controllers/financeiro.controller')
const estruturaController = require('../controllers/estrutura.controller')
const atividadesController = require('../controllers/atividades.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware)

// Rotas de obras
router.post('/', worksController.create)
router.get('/', worksController.list)
router.get('/dashboard/alertas', financeiroController.alertasDashboard)
router.get('/:id/estrutura', estruturaController.listByObra)
router.post('/:id/estrutura', estruturaController.create)
router.get('/:id/atividades', atividadesController.listByObra)
router.post('/:id/atividades', atividadesController.create)
router.get('/:id', worksController.getById)
router.patch('/:id', worksController.update)
router.delete('/:id', worksController.delete)

// Rotas de saúde financeira
router.get('/:id/saude', financeiroController.saudeObra)

module.exports = router
