const express = require('express')
const router = express.Router()
const aiController = require('../controllers/ai.controller')

router.post('/previsao-custos', aiController.previsaoCustos)
router.post('/descrever-obra', aiController.descreverObra)
router.get('/planilha-modelo', aiController.planilhaModelo)

module.exports = router
