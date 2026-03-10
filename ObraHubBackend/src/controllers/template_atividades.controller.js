const db = require('../config/database')

/**
 * GET /template-atividades
 * Listar templates de atividades da empresa
 */
exports.list = async (req, res) => {
  try {
    const empresaId = req.user.empresaid

    const query = `
      SELECT id, etapa, descricao, ordem, data_criacao
      FROM template_atividades
      WHERE empresaid = $1
      ORDER BY etapa ASC, ordem ASC
    `
    const result = await db.query(query, [empresaId])

    const items = result.rows.map(row => ({
      id: row.id,
      etapa: row.etapa,
      descricao: row.descricao,
      ordem: row.ordem,
      data_criacao: row.data_criacao
    }))

    res.json({ success: true, data: items })
  } catch (error) {
    console.error('Erro ao listar template:', error)
    res.status(500).json({ error: 'Erro ao listar template de atividades' })
  }
}

/**
 * POST /template-atividades
 * Criar template de atividade
 */
exports.create = async (req, res) => {
  try {
    const { etapa, descricao, ordem } = req.body
    const empresaId = req.user.empresaid

    if (!etapa || !descricao) {
      return res.status(400).json({ error: 'Etapa e descrição são obrigatórios' })
    }

    const query = `
      INSERT INTO template_atividades (empresaid, etapa, descricao, ordem)
      VALUES ($1, $2, $3, $4)
      RETURNING id, etapa, descricao, ordem, data_criacao
    `
    const result = await db.query(query, [
      empresaId,
      etapa,
      descricao,
      ordem != null ? ordem : 0
    ])

    const row = result.rows[0]
    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        etapa: row.etapa,
        descricao: row.descricao,
        ordem: row.ordem,
        data_criacao: row.data_criacao
      }
    })
  } catch (error) {
    console.error('Erro ao criar template:', error)
    res.status(500).json({ error: 'Erro ao criar template' })
  }
}
