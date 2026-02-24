const router = require('express').Router()
const controller = require('../controllers/tasks.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware)

router.post('/', controller.create)
router.get('/:workId', controller.list)

module.exports = router
