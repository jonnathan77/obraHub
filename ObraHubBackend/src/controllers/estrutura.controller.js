const db = require('../config/database')

/**
 * GET /obras/:obra_id/estrutura
 * Listar estrutura da obra (blocos, aptos, etc.)
 */
exports.listByObra = async (req, res) => {
  try {
    const obra_id = req.params.id
    const empresaId = req.user.empresaid

    const obraCheck = await db.query(
      'SELECT id FROM obra WHERE id = $1 AND empresaid = $2',
      [obra_id, empresaId]
    )
    if (obraCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Obra não encontrada' })
    }

    const query = `
      SELECT id, obra_id, nome, tipo, parent_id, ordem, data_criacao
      FROM estrutura_obra
      WHERE obra_id = $1
      ORDER BY parent_id NULLS FIRST, ordem ASC, nome ASC
    `
    const result = await db.query(query, [obra_id])

    const items = result.rows.map(row => ({
      id: row.id,
      obra_id: row.obra_id,
      nome: row.nome,
      tipo: row.tipo,
      parent_id: row.parent_id,
      ordem: row.ordem,
      data_criacao: row.data_criacao
    }))

    res.json({ success: true, data: items })
  } catch (error) {
    console.error('Erro ao listar estrutura:', error)
    res.status(500).json({ error: 'Erro ao listar estrutura' })
  }
}

/**
 * POST /obras/:obra_id/estrutura
 * Criar item na estrutura (bloco, torre, andar, apartamento)
 */
exports.create = async (req, res) => {
  try {
    const obra_id = req.params.id
    const { nome, tipo, parent_id, ordem } = req.body
    const empresaId = req.user.empresaid

    if (!nome || !tipo) {
      return res.status(400).json({ error: 'Nome e tipo são obrigatórios' })
    }

    const validTipos = ['bloco', 'torre', 'andar', 'apartamento']
    if (!validTipos.includes(tipo)) {
      return res.status(400).json({ error: 'tipo deve ser: bloco, torre, andar ou apartamento' })
    }

    const obraCheck = await db.query(
      'SELECT id FROM obra WHERE id = $1 AND empresaid = $2',
      [obra_id, empresaId]
    )
    if (obraCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Obra não encontrada' })
    }

    const query = `
      INSERT INTO estrutura_obra (obra_id, nome, tipo, parent_id, ordem)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, obra_id, nome, tipo, parent_id, ordem, data_criacao
    `
    const result = await db.query(query, [
      obra_id,
      nome,
      tipo,
      parent_id || null,
      ordem != null ? ordem : 0
    ])

    const row = result.rows[0]
    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        obra_id: row.obra_id,
        nome: row.nome,
        tipo: row.tipo,
        parent_id: row.parent_id,
        ordem: row.ordem,
        data_criacao: row.data_criacao
      }
    })
  } catch (error) {
    console.error('Erro ao criar estrutura:', error)
    res.status(500).json({ error: 'Erro ao criar estrutura' })
  }
}

/**
 * DELETE /estrutura/:id
 * Excluir item da estrutura
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params
    const empresaId = req.user.empresaid

    const check = await db.query(
      `SELECT e.id FROM estrutura_obra e
       JOIN obra o ON o.id = e.obra_id AND o.empresaid = $1
       WHERE e.id = $2`,
      [empresaId, id]
    )
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Item não encontrado' })
    }

    await db.query('DELETE FROM estrutura_obra WHERE id = $1', [id])

    res.json({ success: true, message: 'Item excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir estrutura:', error)
    res.status(500).json({ error: 'Erro ao excluir estrutura' })
  }
}
