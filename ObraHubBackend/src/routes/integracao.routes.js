const router = require('express').Router()
const integracaoController = require('../controllers/integracao.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware)

// Rota para previsão de custos usando IA
app.post('/api/ai/previsao-custos', async (req, res) => {
    const dados = req.body;   // pode vir do banco ou da planilha
    
    const prompt = gerarPromptPrevisaoCustos(dados);
    
    // ... chama o Gemini com o prompt
});