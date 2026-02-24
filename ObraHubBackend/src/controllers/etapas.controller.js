const db = require('../config/database')

/**
 * POST /etapas
 * Criar nova etapa
 */
exports.create = async (req, res) => {
  try {
    const { obra_id, nome, status, progresso, data_prevista } = req.body
    const empresaId = req.user.empresaid

    if (!obra_id || !nome) {
      return res.status(400).json({ error: 'ID da obra e nome são obrigatórios' })
    }

    // Validar se a obra existe e pertence à empresa
    const obraCheck = await db.query(
      'SELECT id FROM obra WHERE id = $1 AND empresaid = $2',
      [obra_id, empresaId]
    )
    if (obraCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Obra não encontrada' })
    }

    const query = `
      INSERT INTO etapa (obra_id, empresaid, nome, status, progresso, data_prevista)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, obra_id, nome, status, progresso, data_prevista, criado_em
    `

    const result = await db.query(query, [
      obra_id,
      empresaId,
      nome,
      status || 'NaoIniciada',
      progresso || 0,
      data_prevista || null
    ])

    const etapa = result.rows[0]

    res.status(201).json({
      success: true,
      data: {
        id: etapa.id,
        obraId: etapa.obra_id,
        nome: etapa.nome,
        status: etapa.status,
        progresso: parseFloat(etapa.progresso),
        dataPrevista: etapa.data_prevista,
        criadoEm: etapa.criado_em
      }
    })
  } catch (error) {
    console.error('Erro ao criar etapa:', error)
    res.status(500).json({ error: 'Erro ao criar etapa' })
  }
}

/**
 * GET /etapas/obra/:obra_id
 * Listar etapas de uma obra
 */
exports.listByObra = async (req, res) => {
  try {
    const { obra_id } = req.params
    const empresaId = req.user.empresaid

    const query = `
      SELECT id, obra_id, nome, status, progresso, data_prevista, criado_em
      FROM etapa
      WHERE obra_id = $1 AND empresaid = $2
      ORDER BY criado_em ASC
    `

    const result = await db.query(query, [obra_id, empresaId])

    const etapas = result.rows.map(row => ({
      id: row.id,
      obraId: row.obra_id,
      nome: row.nome,
      status: row.status,
      progresso: parseFloat(row.progresso),
      dataPrevista: row.data_prevista,
      criadoEm: row.criado_em
    }))

    res.json({
      success: true,
      data: etapas
    })
  } catch (error) {
    console.error('Erro ao listar etapas:', error)
    res.status(500).json({ error: 'Erro ao listar etapas' })
  }
}

/**
 * GET /etapas/:id
 * Obter detalhes de uma etapa
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params
    const empresaId = req.user.empresaid

    const query = `
      SELECT id, obra_id, nome, status, progresso, data_prevista, criado_em
      FROM etapa
      WHERE id = $1 AND empresaid = $2
    `

    const result = await db.query(query, [id, empresaId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Etapa não encontrada' })
    }

    const etapa = result.rows[0]

    res.json({
      success: true,
      data: {
        id: etapa.id,
        obraId: etapa.obra_id,
        nome: etapa.nome,
        status: etapa.status,
        progresso: parseFloat(etapa.progresso),
        dataPrevista: etapa.data_prevista,
        criadoEm: etapa.criado_em
      }
    })
  } catch (error) {
    console.error('Erro ao obter etapa:', error)
    res.status(500).json({ error: 'Erro ao obter etapa' })
  }
}

/**
 * PATCH /etapas/:id
 * Atualizar etapa
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const { nome, status, progresso, data_prevista } = req.body
    const empresaId = req.user.empresaid

    // Validar se a etapa existe
    const etapaCheck = await db.query(
      'SELECT id FROM etapa WHERE id = $1 AND empresaid = $2',
      [id, empresaId]
    )
    if (etapaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Etapa não encontrada' })
    }

    const fieldsToUpdate = []
    const values = []
    let paramCount = 1

    if (nome !== undefined) {
      fieldsToUpdate.push(`nome = $${paramCount}`)
      values.push(nome)
      paramCount++
    }
    if (status !== undefined) {
      fieldsToUpdate.push(`status = $${paramCount}`)
      values.push(status)
      paramCount++
    }
    if (progresso !== undefined) {
      fieldsToUpdate.push(`progresso = $${paramCount}`)
      values.push(Math.min(progresso, 100))
      paramCount++
    }
    if (data_prevista !== undefined) {
      fieldsToUpdate.push(`data_prevista = $${paramCount}`)
      values.push(data_prevista || null)
      paramCount++
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' })
    }

    values.push(id, empresaId)

    const query = `
      UPDATE etapa
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $${paramCount} AND empresaid = $${paramCount + 1}
      RETURNING id, obra_id, nome, status, progresso, data_prevista, criado_em
    `

    const result = await db.query(query, values)
    const etapa = result.rows[0]

    res.json({
      success: true,
      data: {
        id: etapa.id,
        obraId: etapa.obra_id,
        nome: etapa.nome,
        status: etapa.status,
        progresso: parseFloat(etapa.progresso),
        dataPrevista: etapa.data_prevista,
        criadoEm: etapa.criado_em
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar etapa:', error)
    res.status(500).json({ error: 'Erro ao atualizar etapa' })
  }
}

/**
 * DELETE /etapas/:id
 * Deletar etapa
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params
    const empresaId = req.user.empresaid

    const query = `
      DELETE FROM etapa
      WHERE id = $1 AND empresaid = $2
      RETURNING id
    `

    const result = await db.query(query, [id, empresaId])

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Etapa não encontrada' })
    }

    res.json({
      success: true,
      message: 'Etapa deletada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar etapa:', error)
    res.status(500).json({ error: 'Erro ao deletar etapa' })
  }
}
