const db = require('../config/database')

/**
 * GET /materiais
 * Lista materiais usando a tabela `material` e estoque calculado a partir de `movimentacaomaterial`.
 * Opcionalmente filtra por obra (?obraId=ID).
 */
exports.list = async (req, res) => {
  try {
    const empresaId = req.user.empresaid
    const obraId = req.query.obraId || req.query.obra_id || null

    const params = [empresaId]
    let where = 'WHERE o.empresaid = $1'

    if (obraId) {
      params.push(obraId)
      where += ` AND m.obraid = $${params.length}`
    }

    const query = `
      SELECT
        m.id,
        m.obraid,
        m.nome,
        m.unidade,
        COALESCE((
          SELECT SUM(
            CASE
              WHEN mm.tipo = 'entrada' THEN mm.quantidade
              ELSE -mm.quantidade
            END
          )
          FROM movimentacaomaterial mm
          WHERE mm.materialid = m.id
        ), 0) AS estoque_atual
      FROM material m
      JOIN obra o ON o.id = m.obraid
      ${where}
      ORDER BY m.nome ASC
    `

    const result = await db.query(query, params)

    const materiais = result.rows.map(row => ({
      id: row.id,
      obraid: row.obraid,
      nome: row.nome,
      unidade: row.unidade,
      estoque_atual: parseFloat(row.estoque_atual) || 0,
      data_criacao: null
    }))

    res.json({ success: true, data: materiais })
  } catch (error) {
    console.error('Erro ao listar materiais:', error)
    res.status(500).json({ error: 'Erro ao listar materiais' })
  }
}

/**
 * POST /materiais
 * Criar novo material na tabela `material` vinculado a uma obra (obraid).
 */
exports.create = async (req, res) => {
  try {
    const { nome, unidade, estoque_inicial } = req.body
    const obraId = req.body.obraid || req.body.obra_id || req.body.obraId
    const empresaId = req.user.empresaid

    if (!nome || !unidade || !obraId) {
      return res.status(400).json({ error: 'obraid, nome e unidade são obrigatórios' })
    }

    const obraCheck = await db.query(
      'SELECT id FROM obra WHERE id = $1 AND empresaid = $2',
      [obraId, empresaId]
    )
    if (obraCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Obra não encontrada' })
    }

    await db.query('BEGIN')

    const query = `
      INSERT INTO material (obraid, nome, unidade)
      VALUES ($1, $2, $3)
      RETURNING id, obraid, nome, unidade
    `
    const result = await db.query(query, [obraId, nome, unidade])
    const m = result.rows[0]

    const qtdInicial = estoque_inicial != null ? parseFloat(estoque_inicial) : 0
    if (qtdInicial > 0) {
      // registra estoque inicial como uma movimentação de entrada
      const hoje = new Date().toISOString().slice(0, 10)
      await db.query(
        `
          INSERT INTO movimentacaomaterial (materialid, tipo, quantidade, valorunitario, datamovimentacao)
          VALUES ($1, 'Entrada', $2, 0, $3)
        `,
        [m.id, qtdInicial, hoje]
      )
    }

    await db.query('COMMIT')

    res.status(201).json({
      success: true,
      data: {
        id: m.id,
        obraid: m.obraid,
        nome: m.nome,
        unidade: m.unidade,
        estoque_atual: qtdInicial,
        data_criacao: null
      }
    })
  } catch (error) {
    try { await db.query('ROLLBACK') } catch {}
    console.error('Erro ao criar material:', error)
    res.status(500).json({ error: 'Erro ao criar material' })
  }
}

/**
 * PUT /materiais/:id
 * Atualizar material (nome/unidade) garantindo vínculo com empresa.
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const { nome, unidade } = req.body
    const empresaId = req.user.empresaid

    const check = await db.query(
      `
        SELECT m.id
        FROM material m
        JOIN obra o ON o.id = m.obraid
        WHERE m.id = $1 AND o.empresaid = $2
      `,
      [id, empresaId]
    )
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Material não encontrado' })
    }

    const fields = []
    const values = []
    let p = 1
    if (nome !== undefined) { fields.push(`nome = $${p++}`); values.push(nome) }
    if (unidade !== undefined) { fields.push(`unidade = $${p++}`); values.push(unidade) }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' })
    }

    values.push(id)
    const query = `
      UPDATE material
      SET ${fields.join(', ')}
      WHERE id = $${p}
      RETURNING id, obraid, nome, unidade
    `
    const result = await db.query(query, values)
    const m = result.rows[0]

    res.json({
      success: true,
      data: {
        id: m.id,
        obraid: m.obraid,
        nome: m.nome,
        unidade: m.unidade,
        estoque_atual: null,
        data_criacao: null
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar material:', error)
    res.status(500).json({ error: 'Erro ao atualizar material' })
  }
}

/**
 * DELETE /materiais/:id
 * Excluir material garantindo que pertence a uma obra da empresa.
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params
    const empresaId = req.user.empresaid

    const query = `
      DELETE FROM material
      WHERE id = $1
        AND obraid IN (SELECT id FROM obra WHERE empresaid = $2)
      RETURNING id
    `
    const result = await db.query(query, [id, empresaId])

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Material não encontrado' })
    }

    res.json({ success: true, message: 'Material excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir material:', error)
    res.status(500).json({ error: 'Erro ao excluir material' })
  }
}
