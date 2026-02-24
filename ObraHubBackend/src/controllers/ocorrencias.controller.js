const db = require('../config/database')

/**
 * POST /ocorrencias
 * Criar nova ocorrência
 */
exports.create = async (req, res) => {
  try {
    const { obra_id, data, descricao, clima, equipe, problemas } = req.body
    const empresaId = req.user.empresaid

    if (!obra_id || !data || !descricao) {
      return res.status(400).json({ error: 'ID da obra, data e descrição são obrigatórios' })
    }

    // Validar se a obra existe
    const obraCheck = await db.query(
      'SELECT id FROM obra WHERE id = $1 AND empresaid = $2',
      [obra_id, empresaId]
    )
    if (obraCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Obra não encontrada' })
    }

    const query = `
      INSERT INTO ocorrencia (obra_id, empresaid, data, descricao, clima, equipe, problemas)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, obra_id, data, descricao, clima, equipe, problemas, criado_em
    `

    const result = await db.query(query, [
      obra_id,
      empresaId,
      data,
      descricao,
      clima || null,
      equipe || null,
      problemas || null
    ])

    const ocorrencia = result.rows[0]

    res.status(201).json({
      success: true,
      data: {
        id: ocorrencia.id,
        obraId: ocorrencia.obra_id,
        data: ocorrencia.data,
        descricao: ocorrencia.descricao,
        clima: ocorrencia.clima,
        equipe: ocorrencia.equipe,
        problemas: ocorrencia.problemas,
        criadoEm: ocorrencia.criado_em
      }
    })
  } catch (error) {
    console.error('Erro ao criar ocorrência:', error)
    res.status(500).json({ error: 'Erro ao criar ocorrência' })
  }
}

/**
 * GET /ocorrencias/obra/:obra_id
 * Listar ocorrências de uma obra
 */
exports.listByObra = async (req, res) => {
  try {
    const { obra_id } = req.params
    const empresaId = req.user.empresaid

    const query = `
      SELECT id, obra_id, data, descricao, clima, equipe, problemas, criado_em
      FROM ocorrencia
      WHERE obra_id = $1 AND empresaid = $2
      ORDER BY data DESC
    `

    const result = await db.query(query, [obra_id, empresaId])

    const ocorrencias = result.rows.map(row => ({
      id: row.id,
      obraId: row.obra_id,
      data: row.data,
      descricao: row.descricao,
      clima: row.clima,
      equipe: row.equipe,
      problemas: row.problemas,
      criadoEm: row.criado_em
    }))

    res.json({
      success: true,
      data: ocorrencias
    })
  } catch (error) {
    console.error('Erro ao listar ocorrências:', error)
    res.status(500).json({ error: 'Erro ao listar ocorrências' })
  }
}

/**
 * GET /ocorrencias/:id
 * Obter detalhes de uma ocorrência
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params
    const empresaId = req.user.empresaid

    const query = `
      SELECT id, obra_id, data, descricao, clima, equipe, problemas, criado_em
      FROM ocorrencia
      WHERE id = $1 AND empresaid = $2
    `

    const result = await db.query(query, [id, empresaId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ocorrência não encontrada' })
    }

    const ocorrencia = result.rows[0]

    res.json({
      success: true,
      data: {
        id: ocorrencia.id,
        obraId: ocorrencia.obra_id,
        data: ocorrencia.data,
        descricao: ocorrencia.descricao,
        clima: ocorrencia.clima,
        equipe: ocorrencia.equipe,
        problemas: ocorrencia.problemas,
        criadoEm: ocorrencia.criado_em
      }
    })
  } catch (error) {
    console.error('Erro ao obter ocorrência:', error)
    res.status(500).json({ error: 'Erro ao obter ocorrência' })
  }
}

/**
 * PATCH /ocorrencias/:id
 * Atualizar ocorrência
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const { data, descricao, clima, equipe, problemas } = req.body
    const empresaId = req.user.empresaid

    const ocorrenciaCheck = await db.query(
      'SELECT id FROM ocorrencia WHERE id = $1 AND empresaid = $2',
      [id, empresaId]
    )
    if (ocorrenciaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ocorrência não encontrada' })
    }

    const fieldsToUpdate = []
    const values = []
    let paramCount = 1

    if (data !== undefined) {
      fieldsToUpdate.push(`data = $${paramCount}`)
      values.push(data)
      paramCount++
    }
    if (descricao !== undefined) {
      fieldsToUpdate.push(`descricao = $${paramCount}`)
      values.push(descricao)
      paramCount++
    }
    if (clima !== undefined) {
      fieldsToUpdate.push(`clima = $${paramCount}`)
      values.push(clima || null)
      paramCount++
    }
    if (equipe !== undefined) {
      fieldsToUpdate.push(`equipe = $${paramCount}`)
      values.push(equipe || null)
      paramCount++
    }
    if (problemas !== undefined) {
      fieldsToUpdate.push(`problemas = $${paramCount}`)
      values.push(problemas || null)
      paramCount++
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' })
    }

    values.push(id, empresaId)

    const query = `
      UPDATE ocorrencia
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $${paramCount} AND empresaid = $${paramCount + 1}
      RETURNING id, obra_id, data, descricao, clima, equipe, problemas, criado_em
    `

    const result = await db.query(query, values)
    const ocorrencia = result.rows[0]

    res.json({
      success: true,
      data: {
        id: ocorrencia.id,
        obraId: ocorrencia.obra_id,
        data: ocorrencia.data,
        descricao: ocorrencia.descricao,
        clima: ocorrencia.clima,
        equipe: ocorrencia.equipe,
        problemas: ocorrencia.problemas,
        criadoEm: ocorrencia.criado_em
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar ocorrência:', error)
    res.status(500).json({ error: 'Erro ao atualizar ocorrência' })
  }
}

/**
 * DELETE /ocorrencias/:id
 * Deletar ocorrência
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params
    const empresaId = req.user.empresaid

    const query = `
      DELETE FROM ocorrencia
      WHERE id = $1 AND empresaid = $2
      RETURNING id
    `

    const result = await db.query(query, [id, empresaId])

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ocorrência não encontrada' })
    }

    res.json({
      success: true,
      message: 'Ocorrência deletada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar ocorrência:', error)
    res.status(500).json({ error: 'Erro ao deletar ocorrência' })
  }
}
