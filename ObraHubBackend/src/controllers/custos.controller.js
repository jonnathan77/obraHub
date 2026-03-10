const db = require('../config/database')

/**
 * GET /custos/obra/:obra_id
 * Lista custos detalhados da obra usando a view vw_custos_obra
 */
exports.listByObra = async (req, res) => {
  try {
    const { obra_id } = req.params
    const empresaId = req.user.empresaid

    // verificar se a obra pertence à empresa
    const obraCheck = await db.query(
      'SELECT id FROM obra WHERE id = $1 AND empresaid = $2',
      [obra_id, empresaId]
    )
    if (obraCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Obra não encontrada' })
    }

    // consultar a view (vai retornar as colunas definidas na view)
    const query = `
      SELECT *
      FROM vw_custos_obra
      WHERE obraid = $1
    `

    const result = await db.query(query, [obra_id])
    const rows = result.rows || []

    // opcional: podemos fazer transformações aqui se necessário

    res.json({
      success: true,
      data: rows
    })
  } catch (error) {
    console.error('Erro ao listar custos da obra:', error)
    res.status(500).json({ error: 'Erro ao listar custos da obra' })
  }
}
