const {
  calcularSaudeFinanceira,
  gerarAlertas
} = require('../services/financeiro.service')

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
