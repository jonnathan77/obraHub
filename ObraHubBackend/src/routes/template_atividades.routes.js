const router = require('express').Router()
const templateController = require('../controllers/template_atividades.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware)

router.get('/', templateController.list)
router.post('/', templateController.create)

module.exports = router
