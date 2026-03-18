const db = require("../config/database");

/**
 * GET /obras/:id/atividades
 * Listar atividades da obra (opcionalmente por estrutura)
 */
exports.listByObra = async (req, res) => {
  try {
    const { id: obra_id } = req.params;
    const empresaId = req.user.empresaid;

    const obraCheck = await db.query(
      "SELECT id FROM obra WHERE id = $1 AND empresaid = $2",
      [obra_id, empresaId],
    );
    if (obraCheck.rows.length === 0) {
      return res.status(404).json({ error: "Obra não encontrada" });
    }

    const query = `
      SELECT 
        a.id,
        a.obraid,
        a.estrutura_id,
        e.nome AS etapa,
        a.descricao,
        a.responsavel,
        a.status,
        a.data_conclusao
      FROM atividades a
      LEFT JOIN etapa e ON e.id = a.etapa_id
      WHERE a.obraid = $1
      AND a.empresaid = $2
      ORDER BY e.id ASC, a.id ASC
    `;

    const result = await db.query(query, [obra_id, empresaId]);

    const items = result.rows.map((row) => ({
      id: row.id,
      obraid: row.obraid,
      estrutura_id: row.estrutura_id,
      etapa: row.etapa,
      descricao: row.descricao,
      responsavel: row.responsavel,
      status: row.status,
      data_conclusao: row.data_conclusao,
    }));

    res.json({ success: true, data: items });
  } catch (error) {
    console.error("Erro ao listar atividades:", error);
    res.status(500).json({ error: "Erro ao listar atividades" });
  }
};

/**
 * POST /obras/:id/atividades
 * Criar nova atividade
 */
exports.create = async (req, res) => {
  try {
    const { id: obra_id } = req.params;
    const { etapa, descricao, responsavel, estrutura_id  } = req.body;
    const empresaId = req.user.empresaid;

    console.log(req.body);
    if (!etapa || !descricao) {
      return res
        .status(400)
        .json({ error: "Etapa e descrição são obrigatórios" });
    }

    const obraCheck = await db.query(
      "SELECT id FROM obra WHERE id = $1 AND empresaid = $2",
      [obra_id, empresaId],
    );
    if (obraCheck.rows.length === 0) {
      return res.status(404).json({ error: "Obra não encontrada" });
    }

    const etapaQuery = `
    SELECT id 
      FROM etapa
      WHERE nome = $1
      LIMIT 1
    `;

    const etapaResult = await db.query(etapaQuery, [etapa]);

    const etapa_id = etapaResult.rows[0]?.id;

    const query = `
      INSERT INTO atividades (
        obraid,
        estrutura_id,
        etapa_id,
        descricao,
        responsavel,
        status,
        empresaid
      )
      VALUES ($1, $2, $3, $4, $5, 'pendente', $6)
      RETURNING id, obraid, estrutura_id, etapa_id, descricao, responsavel, status, data_conclusao
    `;

    const result = await db.query(query, [
      obra_id,
      estrutura_id  || null,
      etapa_id,
      descricao,
      responsavel || null,
      empresaId,
    ]);

    const row = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        obra_id: row.obra_id,
        estrutura_id : row.estrutura_id ,
        etapa: row.etapa,
        descricao: row.descricao,
        responsavel: row.responsavel,
        status: row.status,
        data_conclusao: row.data_conclusao
      },
    });
  } catch (error) {
    console.error("Erro ao criar atividade:", error);
    res.status(500).json({ error: "Erro ao criar atividade" });
  }
};

/**
 * PUT /atividades/:id
 * Atualizar atividade (incluindo marcar como concluído)
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { etapa, descricao, responsavel, status, data_conclusao } = req.body;
    const empresaId = req.user.empresaid;

    const check = await db.query(
      "SELECT id FROM atividades WHERE id = $1 AND empresaid = $2",
      [id, empresaId],
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Atividade não encontrada" });
    }

    const fields = [];
    const values = [];
    let p = 1;
    if (etapa !== undefined) {
      fields.push(`etapa_id = $${p++}`);

      const etapaQuery = `
        SELECT id 
          FROM etapa
          WHERE nome = $1
          LIMIT 1
      `;

    const etapaResult = await db.query(etapaQuery, [etapa]);

    const etapa_id = etapaResult.rows[0]?.id;

      values.push(etapa_id);
    }
    if (descricao !== undefined) {
      fields.push(`descricao = $${p++}`);
      values.push(descricao);
    }
    if (responsavel !== undefined) {
      fields.push(`responsavel = $${p++}`);
      values.push(responsavel);
    }
    if (status !== undefined) {
      fields.push(`status = $${p++}`);
      values.push(status);
    }
    if (data_conclusao !== undefined) {
      fields.push(`data_conclusao = $${p++}`);
      values.push(data_conclusao);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }



    values.push(id, empresaId);
    const query = `
      UPDATE atividades
      SET ${fields.join(", ")}
      WHERE id = $${p} AND empresaid = $${p + 1}
      RETURNING id, obraid, etapa_id, descricao, responsavel, status, data_conclusao
    `;
    const result = await db.query(query, values);
    const row = result.rows[0];

    res.json({
      success: true,
      data: {
        id: row.id,
        obraid: row.obraid,
        etapa_id: row.etapa_id,
        descricao: row.descricao,
        responsavel: row.responsavel,
        status: row.status,
        data_conclusao: row.data_conclusao
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar atividade:", error);
    res.status(500).json({ error: "Erro ao atualizar atividade" });
  }
};

/**
 * DELETE /atividades/:id
 * Excluir atividade
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.user.empresaid;

    const result = await db.query(
      "DELETE FROM atividades WHERE id = $1 AND empresaid = $2 RETURNING id",
      [id, empresaId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Atividade não encontrada" });
    }

    res.json({ success: true, message: "Atividade excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir atividade:", error);
    res.status(500).json({ error: "Erro ao excluir atividade" });
  }
};

exports.checklist = async (req, res) => {
  try {

    const { id: obra_id } = req.params
    const empresaId = req.user.empresaid

    const query = `
      SELECT
        e.id AS estrutura_id,
        e.nome AS unidade,
        e.tipo,
        et.nome AS etapa,
        a.status
      FROM estrutura_obra e
      LEFT JOIN atividades a ON a.estrutura_id = e.id
      LEFT JOIN etapa et ON et.id = a.etapa_id
      WHERE e.obra_id = $1 and et.nome is not null
      ORDER BY e.nome
    `

    const result = await db.query(query, [obra_id])

    res.json({
      success: true,
      data: result.rows
    })

  } catch (error) {
    console.error("Erro checklist:", error)
    res.status(500).json({ error: "Erro ao carregar checklist" })
  }
}

exports.updateStatus = async (req, res) => {
  try {

    const { estrutura_id, etapa, status } = req.body
    const empresaId = req.user.empresaid

    const etapaQuery = `
      SELECT id FROM etapa
      WHERE nome = $1
      LIMIT 1
    `

    const etapaResult = await db.query(etapaQuery, [etapa])
    const etapa_id = etapaResult.rows[0]?.id

    if (!etapa_id) {
      return res.status(400).json({ error: "Etapa não encontrada" })
    }

    const query = `
      UPDATE atividades
          SET status = $1,
              data_conclusao = CASE 
                  WHEN $1::varchar = 'concluido' 
                  THEN NOW() 
                  ELSE NULL 
              END
          WHERE estrutura_id = $2
          AND etapa_id = $3
          AND empresaid = $4
          RETURNING *
    `

    const result = await db.query(query, [
      status,
      estrutura_id,
      etapa_id,
      empresaId
    ])

    res.json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    console.error("Erro status:", error)
    res.status(500).json({ error: "Erro ao atualizar status" })
  }
}
