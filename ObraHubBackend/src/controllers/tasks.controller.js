const db = require('../config/database')

exports.create = async (req, res) => {
  try {
    const { workId, materialId, quantidade, valorUnitario, tipoMovimentacao, observacoes } = req.body
    const empresaId = req.user.empresaid

    // Validar campos obrigatórios
    if (!workId || !quantidade || !tipoMovimentacao) {
      return res.status(400).json({ 
        error: 'workId, quantidade e tipoMovimentacao são obrigatórios' 
      })
    }

    // Normalizar tipo de movimentação
    const tipo = tipoMovimentacao.toLowerCase() === 'entrada' ? 'entrada' : 'saida'

    // Verificar se a obra existe e pertence à empresa do usuário
    const obraQuery = 'SELECT id FROM obra WHERE id = $1 AND empresaid = $2'
    const obraResult = await db.query(obraQuery, [workId, empresaId])

    if (obraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Obra não encontrada' })
    }

    // Se houver materialId, validar se existe
    if (materialId) {
      const materialQuery = 'SELECT id, preco_unitario FROM material WHERE id = $1 AND empresaid = $2'
      const materialResult = await db.query(materialQuery, [materialId, empresaId])

      if (materialResult.rows.length === 0) {
        return res.status(404).json({ error: 'Material não encontrado' })
      }

      // Usar preco_unitario do material se não foi fornecido
      const valor = valorUnitario !== undefined ? valorUnitario : materialResult.rows[0].preco_unitario
    }

    const query = `
      INSERT INTO movimentacaomaterial 
        (obra_id, material_id, quantidade, valor_unitario, tipo_movimentacao, observacoes, empresaid, criado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, obra_id, material_id, quantidade, valor_unitario, tipo_movimentacao, observacoes, criado_em
    `

    const result = await db.query(query, [
      workId,
      materialId || null,
      quantidade,
      valorUnitario || 0,
      tipo,
      observacoes || null,
      empresaId
    ])

    const movimentacao = result.rows[0]

    res.status(201).json({
      success: true,
      data: {
        id: movimentacao.id,
        workId: movimentacao.obra_id,
        materialId: movimentacao.material_id,
        quantidade: parseFloat(movimentacao.quantidade),
        valorUnitario: parseFloat(movimentacao.valor_unitario),
        total: parseFloat(movimentacao.quantidade) * parseFloat(movimentacao.valor_unitario),
        tipoMovimentacao: movimentacao.tipo_movimentacao,
        observacoes: movimentacao.observacoes,
        criadoEm: movimentacao.criado_em
      }
    })
  } catch (error) {
    console.error('Erro ao criar movimentação de material:', error)
    res.status(500).json({ error: 'Erro ao criar movimentação de material' })
  }
}

exports.list = async (req, res) => {
  try {
    const { workId } = req.params
    const empresaId = req.user.empresaid

    // Verificar se a obra existe e pertence à empresa do usuário
    const obraQuery = 'SELECT id FROM obra WHERE id = $1 AND empresaid = $2'
    const obraResult = await db.query(obraQuery, [workId, empresaId])

    if (obraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Obra não encontrada' })
    }

    const query = `
      SELECT 
        m.id,
        m.obra_id,
        m.material_id,
        m.quantidade,
        m.valor_unitario,
        m.tipo_movimentacao,
        m.observacoes,
        m.criado_em,
        mat.nome as material_nome
      FROM movimentacaomaterial m
      LEFT JOIN material mat ON m.material_id = mat.id
      WHERE m.obra_id = $1 AND m.empresaid = $2
      ORDER BY m.criado_em DESC
    `

    const result = await db.query(query, [workId, empresaId])
    
    const movimentacoes = result.rows.map(row => ({
      id: row.id,
      workId: row.obra_id,
      materialId: row.material_id,
      materialNome: row.material_nome,
      quantidade: parseFloat(row.quantidade),
      valorUnitario: parseFloat(row.valor_unitario),
      total: parseFloat(row.quantidade) * parseFloat(row.valor_unitario),
      tipoMovimentacao: row.tipo_movimentacao,
      observacoes: row.observacoes,
      criadoEm: row.criado_em
    }))

    res.json({
      success: true,
      data: movimentacoes,
      total: movimentacoes.length
    })
  } catch (error) {
    console.error('Erro ao listar movimentações de material:', error)
    res.status(500).json({ error: 'Erro ao listar movimentações de material' })
  }
}


