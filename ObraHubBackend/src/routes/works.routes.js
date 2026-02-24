const router = require('express').Router()
const worksController = require('../controllers/works.controller')
const financeiroController = require('../controllers/financeiro.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware)

// Rotas de obras
router.post('/', worksController.create)
router.get('/', worksController.list)
router.get('/:id', worksController.getById)
router.patch('/:id', worksController.update)
router.delete('/:id', worksController.delete)

// Rotas de saúde financeira
router.get('/:id/saude', financeiroController.saudeObra)

// Rotas de dashboard/alertas
router.get('/dashboard/alertas', financeiroController.alertasDashboard)

module.exports = router
