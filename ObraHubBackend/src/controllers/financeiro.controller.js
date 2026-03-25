const {
  calcularSaudeFinanceira,
  gerarAlertas
} = require('../services/financeiro.service')
const { processarPlanilha } = require('../services/planilha.service')

/**
 * GET /obras/:id/saude
 * Retorna a saúde financeira de uma obra específica
 */
exports.saudeObra = async (req, res) => {
  try {
    const { id } = req.params
    const empresaId = req.user.empresaid

    const saude = await calcularSaudeFinanceira(id, empresaId)

    res.json({
      success: true,
      data: saude
    })
  } catch (error) {
    console.error('Erro ao obter saúde da obra:', error)
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao obter saúde da obra'
    })
  }
}

/**
 * GET /dashboard/alertas
 * Retorna todos os alertas financeiros do dashboard
 */
exports.alertasDashboard = async (req, res) => {
  try {
    const empresaId = req.user.empresaid

    const alertas = await gerarAlertas(empresaId)

    res.json({
      success: true,
      data: alertas
    })
  } catch (error) {
    console.error('Erro ao obter alertas do dashboard:', error)
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao obter alertas'
    })
  }
}

/**
 * POST /financeiro/upload
 * Processa planilha de caixa e retorna previsão
 */
exports.uploadPlanilha = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Arquivo planilha é obrigatório'
      });
    }

    const resultado = await processarPlanilha(req.file.buffer, req.file.mimetype);

    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('Erro ao processar planilha:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao processar planilha'
    });
  }
}

