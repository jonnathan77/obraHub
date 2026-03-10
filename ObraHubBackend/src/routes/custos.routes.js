const express = require('express')
const router = express.Router()
const custosController = require('../controllers/custos.controller')
const authMiddleware = require('../middlewares/auth.middleware')

// todas as rotas abaixo exigem autenticação
router.use(authMiddleware)

// retorna entradas da view para uma obra específica
router.get('/obra/:obra_id', custosController.listByObra)

module.exports = router
