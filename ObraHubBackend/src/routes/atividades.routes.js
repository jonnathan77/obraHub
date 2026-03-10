const router = require('express').Router()
const atividadesController = require('../controllers/atividades.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware)

router.put('/:id', atividadesController.update)
router.delete('/:id', atividadesController.delete)

module.exports = router
