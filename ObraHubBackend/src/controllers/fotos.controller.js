const db = require('../config/database')
const cloudinary = require('cloudinary').v2

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
})

/**
 * POST /fotos
 * Fazer upload de foto para Cloudinary
 */
exports.upload = async (req, res) => {
  try {
    const { obra_id, descricao } = req.body
    const empresaId = req.user.empresaid

    if (!obra_id || !req.file) {
      return res.status(400).json({ error: 'ID da obra e arquivo de imagem são obrigatórios' })
    }

    // Validar se a obra existe
    const obraCheck = await db.query(
      'SELECT id FROM obra WHERE id = $1 AND empresaid = $2',
      [obra_id, empresaId]
    )
    if (obraCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Obra não encontrada' })
    }

    // Fazer upload para Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'obrahub/fotos',
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(req.file.buffer)
    })

    const query = `
      INSERT INTO foto (obra_id, empresaid, data, descricao, imagem_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, obra_id, data, descricao, imagem_url, criado_em
    `

    const result = await db.query(query, [
      obra_id,
      empresaId,
      new Date().toISOString(),
      descricao || null,
      uploadResult.secure_url
    ])

    const foto = result.rows[0]

    res.status(201).json({
      success: true,
      data: {
        id: foto.id,
        obraId: foto.obra_id,
        data: foto.data,
        descricao: foto.descricao,
        imagemUrl: foto.imagem_url,
        criadoEm: foto.criado_em
      }
    })
  } catch (error) {
    console.error('Erro ao fazer upload de foto:', error)
    res.status(500).json({ error: 'Erro ao fazer upload de foto' })
  }
}

/**
 * GET /fotos/obra/:obra_id
 * Listar fotos de uma obra
 */
exports.listByObra = async (req, res) => {
  try {
    const { obra_id } = req.params
    const empresaId = req.user.empresaid

    const query = `
      SELECT id, obra_id, descricao, imagem_url, criado_em
      FROM foto
      WHERE obra_id = $1 AND empresaid = $2
      ORDER BY criado_em DESC
    `

    const result = await db.query(query, [obra_id, empresaId])

    const fotos = result.rows.map(row => ({
      id: row.id,
      obraId: row.obra_id,
      descricao: row.descricao,
      imagemUrl: row.imagem_url,
      criadoEm: row.criado_em
    }))

    res.json({
      success: true,
      data: fotos
    })
  } catch (error) {
    console.error('Erro ao listar fotos:', error)
    res.status(500).json({ error: 'Erro ao listar fotos' })
  }
}

/**
 * GET /fotos/:id
 * Obter foto com URL
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params
    const empresaId = req.user.empresaid

    const query = `
      SELECT id, obra_id, descricao, imagem_url, criado_em
      FROM foto
      WHERE id = $1 AND empresaid = $2
    `

    const result = await db.query(query, [id, empresaId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Foto não encontrada' })
    }

    const foto = result.rows[0]

    res.json({
      success: true,
      data: {
        id: foto.id,
        obraId: foto.obra_id,
        descricao: foto.descricao,
        imagemUrl: foto.imagem_url,
        criadoEm: foto.criado_em
      }
    })
  } catch (error) {
    console.error('Erro ao obter foto:', error)
    res.status(500).json({ error: 'Erro ao obter foto' })
  }
}

/**
 * PATCH /fotos/:id
 * Atualizar descrição da foto
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const { descricao } = req.body
    const empresaId = req.user.empresaid

    const fotoCheck = await db.query(
      'SELECT id FROM foto WHERE id = $1 AND empresaid = $2',
      [id, empresaId]
    )
    if (fotoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Foto não encontrada' })
    }

    const query = `
      UPDATE foto
      SET descricao = $1
      WHERE id = $2 AND empresaid = $3
      RETURNING id, obra_id, data, descricao, imagem_url, criado_em
    `

    const result = await db.query(query, [descricao || null, id, empresaId])
    const foto = result.rows[0]

    res.json({
      success: true,
      data: {
        id: foto.id,
        obraId: foto.obra_id,
        data: foto.data,
        descricao: foto.descricao,
        imagemUrl: foto.imagem_url,
        criadoEm: foto.criado_em
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar foto:', error)
    res.status(500).json({ error: 'Erro ao atualizar foto' })
  }
}

/**
 * DELETE /fotos/:id
 * Deletar foto
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params
    const empresaId = req.user.empresaid

    const query = `
      DELETE FROM foto
      WHERE id = $1 AND empresaid = $2
      RETURNING id
    `

    const result = await db.query(query, [id, empresaId])

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Foto não encontrada' })
    }

    res.json({
      success: true,
      message: 'Foto deletada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar foto:', error)
    res.status(500).json({ error: 'Erro ao deletar foto' })
  }
}
