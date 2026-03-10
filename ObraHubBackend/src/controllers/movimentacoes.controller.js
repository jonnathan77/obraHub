const db = require('../config/database')

/**
 * GET /movimentacoes
 * Lista movimentações usando a tabela `movimentacaomaterial`,
 * sempre relacionando com a obra via `material.obraid`.
 * Requer ?obraId=ID para filtrar pela obra selecionada.
 */
exports.list = async (req, res) => {
  try {
    const empresaId = req.user.empresaid
    const obraId = req.query.obraId || req.query.obra_id

    if (!obraId) {
      return res.status(400).json({ error: 'obraId é obrigatório para listar movimentações' })
    }

    const obraCheck = await db.query(
      'SELECT id FROM obra WHERE id = $1 AND empresaid = $2',
      [obraId, empresaId]
    )
    if (obraCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Obra não encontrada' })
    }

    const query = `
      SELECT 
        mm.id,
        mm.materialid AS material_id,
        m.obraid AS obraid,
        mm.tipo,
        mm.quantidade,
        mm.valorunitario AS valor_unitario,
        mm.datamovimentacao AS data_movimentacao,
        m.nome AS material_nome,
        m.unidade AS material_unidade,
        o.nome AS obra_nome
      FROM movimentacaomaterial mm
      JOIN material m ON m.id = mm.materialid
      JOIN obra o ON o.id = m.obraid
      WHERE o.id = $1 AND o.empresaid = $2
      ORDER BY mm.datamovimentacao DESC, mm.id DESC
    `
    const result = await db.query(query, [obraId, empresaId])

    const movimentacoes = result.rows.map(row => ({
      id: row.id,
      material_id: row.material_id,
      // obraid vem do material (movimentacaomaterial não tem obra_id)
      obraid: row.obraid,
      obra_id: row.obraid, // compatibilidade com frontend atual
      tipo: row.tipo,
      quantidade: parseFloat(row.quantidade),
      valor_unitario: parseFloat(row.valor_unitario),
      valor_total: parseFloat(row.quantidade) * parseFloat(row.valor_unitario),
      data_movimentacao: row.data_movimentacao,
      material_nome: row.material_nome,
      material_unidade: row.material_unidade,
      obra_nome: row.obra_nome
    }))

    res.json({ success: true, data: movimentacoes })
  } catch (error) {
    console.error('Erro ao listar movimentações:', error)
    res.status(500).json({ error: 'Erro ao listar movimentações' })
  }
}

/**
 * POST /movimentacoes
 * Cria movimentação na tabela `movimentacaomaterial`,
 * garantindo que o material pertence à obra selecionada.
 */
exports.create = async (req, res) => {
  try {
    const { material_id, obra_id, tipo, quantidade, valor_unitario, data_movimentacao } = req.body
    const empresaId = req.user.empresaid

    if (!material_id || !obra_id || !tipo || quantidade == null || !data_movimentacao) {
      return res.status(400).json({ error: 'material_id, obra_id, tipo, quantidade e data_movimentacao são obrigatórios' })
    }

    if (!['entrada', 'saida'].includes(tipo)) {
      return res.status(400).json({ error: 'tipo deve ser "entrada" ou "saida"' })
    }

    const obraCheck = await db.query(
      'SELECT id FROM obra WHERE id = $1 AND empresaid = $2',
      [obra_id, empresaId]
    )
    if (obraCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Obra não encontrada' })
    }

    const matCheck = await db.query(
      `
        SELECT m.id
        FROM material m
        JOIN obra o ON o.id = m.obraid
        WHERE m.id = $1 AND m.obraid = $2 AND o.empresaid = $3
      `,
      [material_id, obra_id, empresaId]
    )
    if (matCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Material não pertence à obra selecionada' })
    }

    const query = `
      INSERT INTO movimentacaomaterial (materialid, tipo, quantidade, valorunitario, datamovimentacao)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        materialid AS material_id,
        tipo,
        quantidade,
        valorunitario AS valor_unitario,
        datamovimentacao AS data_movimentacao
    `
    const result = await db.query(query, [
      material_id,
      tipo,
      parseFloat(quantidade),
      valor_unitario != null ? parseFloat(valor_unitario) : 0,
      data_movimentacao
    ])

    const row = result.rows[0]

    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        material_id: row.material_id,
        obra_id: Number(obra_id),
        tipo: row.tipo,
        quantidade: parseFloat(row.quantidade),
        valor_unitario: parseFloat(row.valor_unitario),
        data_movimentacao: row.data_movimentacao
      }
    })
  } catch (error) {
    console.error('Erro ao criar movimentação:', error)
    res.status(500).json({ error: 'Erro ao criar movimentação' })
  }
}
