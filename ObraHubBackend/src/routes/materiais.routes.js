const router = require('express').Router()
const materiaisController = require('../controllers/materiais.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware)

router.get('/', materiaisController.list)
router.post('/', materiaisController.create)
router.put('/:id', materiaisController.update)
router.delete('/:id', materiaisController.delete)

module.exports = router
