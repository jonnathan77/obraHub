const router = require('express').Router()
const estruturaController = require('../controllers/estrutura.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware)

router.delete('/:id', estruturaController.delete)

module.exports = router
