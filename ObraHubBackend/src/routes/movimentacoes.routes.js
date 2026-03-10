const router = require('express').Router()
const movimentacoesController = require('../controllers/movimentacoes.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware)

router.get('/', movimentacoesController.list)
router.post('/', movimentacoesController.create)

module.exports = router
