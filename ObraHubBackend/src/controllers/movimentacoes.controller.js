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
  let client
  let transactionStarted = false

  try {
    client = await db.connect()
    const {
      material_nome,
      unidade,
      obra_id,
      tipo,
      quantidade,
      valor_unitario,
      data_movimentacao
    } = req.body

    const empresaId = req.user.empresaid

    const qtd = Number(quantidade)
    const valorUnitario = Number(valor_unitario ?? 0)
    if (!obra_id || !material_nome || !unidade || !['entrada', 'saida'].includes(tipo) ||
        !Number.isFinite(qtd) || qtd <= 0 ||
        !Number.isFinite(valorUnitario) || valorUnitario < 0 ||
        !data_movimentacao || Number.isNaN(Date.parse(data_movimentacao))) {
      return res.status(400).json({ error: 'Dados da movimentação inválidos' })
    }

    await client.query('BEGIN')
    transactionStarted = true

    const obra = await client.query(
      'SELECT id FROM obra WHERE id = $1 AND empresaid = $2',
      [obra_id, empresaId]
    )
    if (obra.rows.length === 0) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(404).json({ error: 'Obra não encontrada' })
    }

    let material = await client.query(
      `SELECT id
       FROM material 
       WHERE obraid = $1 AND LOWER(nome) = LOWER($2)
       FOR UPDATE`,
      [obra_id, String(material_nome).trim()]
    )

    let materialId

    if (material.rows.length === 0) {
      if (tipo === 'saida') {
        await client.query('ROLLBACK')
        transactionStarted = false
        return res.status(400).json({ error: 'Não há estoque disponível para este material' })
      }

      const novoMaterial = await client.query(
        `INSERT INTO material (obraid, nome, unidade)
         VALUES ($1,$2,$3)
         RETURNING id`,
        [obra_id, material_nome, unidade]
      )

      materialId = novoMaterial.rows[0].id

    } else {

      materialId = material.rows[0].id
    }

    if (tipo === 'saida') {
      const saldo = await client.query(
        `SELECT COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN quantidade ELSE -quantidade END), 0) AS quantidade
         FROM movimentacaomaterial
         WHERE materialid = $1`,
        [materialId]
      )
      if (Number(saldo.rows[0].quantidade) < qtd) {
        await client.query('ROLLBACK')
        transactionStarted = false
        return res.status(400).json({ error: 'A quantidade de saída excede o estoque disponível' })
      }
    }

    const mov = await client.query(
      `INSERT INTO movimentacaomaterial
      (materialid, tipo, quantidade, valorunitario, datamovimentacao)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
      [
        materialId,
        tipo,
        qtd,
        valorUnitario,
        data_movimentacao
      ]
    )

    await client.query('COMMIT')

    res.status(201).json({
      success: true,
      data: mov.rows[0]
    })

  } catch (err) {
    if (transactionStarted && client) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Erro ao reverter movimentação:', rollbackError)
      }
    }
    console.error(err)

    res.status(500).json({
      error: 'Erro ao criar movimentação'
    })

  } finally {
    if (client) client.release()
  }
}
