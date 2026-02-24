const db = require('../config/database')

/**
 * Calcula o custo real de uma obra
 * Soma apenas movimentações tipo 'entrada' multiplicadas pelo valor unitário
 */
async function calcularCustoReal(obraId, empresaId) {
  try {
    const query = `
      SELECT COALESCE(SUM(quantidade * valor_unitario), 0) as total
      FROM movimentacaomaterial
      WHERE obra_id = $1 
        AND empresaid = $2 
        AND tipo_movimentacao = 'entrada'
    `

    const result = await db.query(query, [obraId, empresaId])
    return parseFloat(result.rows[0].total) || 0
  } catch (error) {
    console.error('Erro ao calcular custo real:', error)
    throw error
  }
}

/**
 * Calcula a saúde financeira da obra
 * Retorna orçamento, custo atual, diferença, percentual e status
 */
async function calcularSaudeFinanceira(obraId, empresaId) {
  try {
    // Buscar dados da obra
    const obraQuery = `
      SELECT id, nome, orcamento_previsto, status
      FROM obra
      WHERE id = $1 AND empresaid = $2
    `

    const obraResult = await db.query(obraQuery, [obraId, empresaId])

    if (obraResult.rows.length === 0) {
      throw new Error('Obra não encontrada')
    }

    const obra = obraResult.rows[0]
    const orcamento = parseFloat(obra.orcamento_previsto) || 0
    const custoReal = await calcularCustoReal(obraId, empresaId)

    const diferenca = custoReal - orcamento
    const percentual = orcamento > 0 ? (custoReal / orcamento) * 100 : 0

    let statusSaude = 'Saudavel'
    if (percentual > 100) {
      statusSaude = 'Estourado'
    } else if (percentual > 80) {
      statusSaude = 'Alerta'
    }

    return {
      id: obra.id,
      nome: obra.nome,
      orcamento: orcamento,
      custoAtual: parseFloat(custoReal.toFixed(2)),
      diferenca: parseFloat(diferenca.toFixed(2)),
      percentual: parseFloat(percentual.toFixed(2)),
      status: statusSaude
    }
  } catch (error) {
    console.error('Erro ao calcular saúde financeira:', error)
    throw error
  }
}

/**
 * Retorna todas as obras estouradas (custo > orçamento)
 */
async function obrasEstouradas(empresaId) {
  try {
    const query = `
      SELECT 
        o.id, 
        o.nome, 
        o.orcamento_previsto,
        o.status,
        o.datainicio,
        o.dataprevista
      FROM obra o
      WHERE o.empresaid = $1 AND o.status != 'concluida'
    `

    const result = await db.query(query, [empresaId])
    const obras = []

    for (const obra of result.rows) {
      const custo = await calcularCustoReal(obra.id, empresaId)
      const orcamento = parseFloat(obra.orcamento_previsto) || 0

      if (custo > orcamento) {
        obras.push({
          id: obra.id,
          nome: obra.nome,
          orcamento: orcamento,
          custoAtual: parseFloat(custo.toFixed(2)),
          diferenca: parseFloat((custo - orcamento).toFixed(2)),
          percentual: parseFloat(((custo / orcamento) * 100).toFixed(2))
        })
      }
    }

    return obras
  } catch (error) {
    console.error('Erro ao buscar obras estouradas:', error)
    throw error
  }
}

/**
 * Retorna todas as obras atrasadas (data fim prevista < hoje e status != concluida)
 */
async function obrasAtrasadas(empresaId) {
  try {
    const query = `
      SELECT id, nome, datainicio, dataprevista, status
      FROM obra
      WHERE empresaid = $1 
        AND dataprevista < CURRENT_DATE 
        AND status != 'concluida'
      ORDER BY dataprevista ASC
    `

    const result = await db.query(query, [empresaId])

    return result.rows.map(obra => ({
      id: obra.id,
      nome: obra.nome,
      dataFimPrevista: obra.dataprevista,
      status: obra.status,
      diasAtrasados: Math.floor(
        (new Date() - new Date(obra.dataprevista)) / (1000 * 60 * 60 * 24)
      )
    }))
  } catch (error) {
    console.error('Erro ao buscar obras atrasadas:', error)
    throw error
  }
}

/**
 * Calcula risco de prazo: se percentualTempo > progresso da obra
 * Retorna obras em risco (tempo passado maior que progresso)
 */
async function obrasEmRisco(empresaId) {
  try {
    const query = `
      SELECT id, nome, datainicio, dataprevista, progresso, status
      FROM obra
      WHERE empresaid = $1 
        AND status != 'concluida'
        AND datainicio IS NOT NULL
        AND dataprevista IS NOT NULL
      ORDER BY dataprevista ASC
    `

    const result = await db.query(query, [empresaId])
    const obra_em_risco = []

    for (const obra of result.rows) {
      const dataInicio = new Date(obra.datainicio)
      const dataFim = new Date(obra.dataprevista)
      const hoje = new Date()

      const totalDias = (dataFim - dataInicio) / (1000 * 60 * 60 * 24)
      const diasPassados = (hoje - dataInicio) / (1000 * 60 * 60 * 24)

      const percentualTempo = totalDias > 0 ? (diasPassados / totalDias) * 100 : 0
      const progresso = parseFloat(obra.progresso) || 0

      // Se o tempo passado é maior que o progresso, está em risco
      if (percentualTempo > progresso && diasPassados > 0) {
        obra_em_risco.push({
          id: obra.id,
          nome: obra.nome,
          dataFim: obra.dataprevista,
          progresso: parseFloat(progresso.toFixed(2)),
          percentualTempo: parseFloat(percentualTempo.toFixed(2)),
          risco: parseFloat((percentualTempo - progresso).toFixed(2))
        })
      }
    }

    return obra_em_risco
  } catch (error) {
    console.error('Erro ao buscar obras em risco:', error)
    throw error
  }
}

/**
 * Retorna todos os alertas do dashboard
 */
async function gerarAlertas(empresaId) {
  try {
    const [estouradas, atrasadas, emRisco] = await Promise.all([
      obrasEstouradas(empresaId),
      obrasAtrasadas(empresaId),
      obrasEmRisco(empresaId)
    ])

    return {
      estouradas: {
        total: estouradas.length,
        obras: estouradas
      },
      atrasadas: {
        total: atrasadas.length,
        obras: atrasadas
      },
      emRisco: {
        total: emRisco.length,
        obras: emRisco
      },
      totalAlertas: estouradas.length + atrasadas.length + emRisco.length,
      resumo: `🔴 ${estouradas.length} estouradas | ⏰ ${atrasadas.length} atrasadas | 🟡 ${emRisco.length} em risco`
    }
  } catch (error) {
    console.error('Erro ao gerar alertas:', error)
    throw error
  }
}

module.exports = {
  calcularCustoReal,
  calcularSaudeFinanceira,
  obrasEstouradas,
  obrasAtrasadas,
  obrasEmRisco,
  gerarAlertas
}
