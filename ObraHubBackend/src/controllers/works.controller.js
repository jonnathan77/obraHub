const db = require("../config/database");

exports.create = async (req, res) => {
  try {
    const {
      nome,
      cliente,
      endereco,
      dataInicio,
      dataFimPrevista,
      orcamentoPrevisto,
    } = req.body;
    const empresaId = req.user.empresaid;

    if (!nome) {
      return res.status(400).json({ error: "Nome da obra é obrigatório" });
    }

    const query = `
        INSERT INTO obra (
              nome, cliente, status, empresaid, endereco,
              datainicio, dataprevista, orcamento_previsto
            )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, nome, status, empresaid, endereco,
            cliente, datainicio, dataprevista,
            orcamento_previsto, progresso, criado_em
    `;

    const result = await db.query(query, [
      nome,
      cliente || null,
      "Planejada",
      empresaId,
      endereco || null,
      dataInicio || null,
      dataFimPrevista || null,
      orcamentoPrevisto || null,
    ]);

    const obra = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: obra.id,
        name: obra.nome,
        status: obra.status,
        companyId: obra.empresaid,
        endereco: obra.endereco,
        cliente: obra.cliente,
        dataInicio: obra.datainicio,
        dataFimPrevista: obra.dataprevista,
        orcamentoPrevisto: obra.orcamento_previsto
          ? parseFloat(obra.orcamento_previsto)
          : null,
        progresso: parseFloat(obra.progresso) || 0,
        createdAt: obra.criado_em,
      },
    });
  } catch (error) {
    console.error("Erro ao criar obra:", error);
    res.status(500).json({ error: "Erro ao criar obra" });
  }
};

exports.list = async (req, res) => {
  try {
    const empresaId = req.user.empresaid;

    const query = `
      SELECT id, nome, status, empresaid, endereco, datainicio, dataprevista, orcamento_previsto, progresso, criado_em
      FROM obra
      WHERE empresaid = $1
      ORDER BY criado_em DESC
    `;

    const result = await db.query(query, [empresaId]);
    const obras = result.rows.map((row) => ({
      id: row.id,
      name: row.nome,
      status: row.status,
      companyId: row.empresaid,
      endereco: row.endereco,
      dataInicio: row.datainicio,
      dataFimPrevista: row.dataprevista,
      orcamentoPrevisto: row.orcamento_previsto
        ? parseFloat(row.orcamento_previsto)
        : null,
      progresso: parseFloat(row.progresso) || 0,
      createdAt: row.criado_em,
    }));

    res.json({
      success: true,
      data: obras,
      total: obras.length,
    });
  } catch (error) {
    console.error("Erro ao listar obras:", error);
    res.status(500).json({ error: "Erro ao listar obras" });
  }
};

/**
 * GET /works/:id
 * Retorna detalhes de uma obra específica
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.user.empresaid;

    const query = `
      SELECT id, nome, status, empresaid, endereco, datainicio, dataprevista , orcamento_previsto, progresso, criado_em
      FROM obra
      WHERE id = $1 AND empresaid = $2
    `;

    const result = await db.query(query, [id, empresaId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Obra não encontrada" });
    }

    const obra = result.rows[0];

    res.json({
      success: true,
      data: {
        id: obra.id,
        name: obra.nome,
        status: obra.status,
        companyId: obra.empresaid,
        endereco: obra.endereco,
        dataInicio: obra.datainicio,
        dataFimPrevista: obra.dataprevista,
        orcamentoPrevisto: obra.orcamento_previsto
          ? parseFloat(obra.orcamento_previsto)
          : null,
        progresso: parseFloat(obra.progresso) || 0,
        createdAt: obra.criado_em,
        updatedAt: obra.atualizado_em,
      },
    });
  } catch (error) {
    console.error("Erro ao obter obra:", error);
    res.status(500).json({ error: "Erro ao obter obra" });
  }
};

/**
 * PATCH /works/:id
 * Atualiza uma obra (incluindo progresso)
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      status,
      progresso,
      orcamentoPrevisto,
      endereco,
      dataInicio,
      dataFimPrevista,
    } = req.body;

    const empresaId = req.user.empresaid;

    // Validar se a obra existe
    const existQuery = "SELECT id FROM obra WHERE id = $1 AND empresaid = $2";
    const existResult = await db.query(existQuery, [id, empresaId]);

    if (existResult.rows.length === 0) {
      return res.status(404).json({ error: "Obra não encontrada" });
    }

    // Montar query dinâmica apenas com campos fornecidos
    const fieldsToUpdate = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      fieldsToUpdate.push(`nome = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (status !== undefined) {
      const statusMap = {
        planejada: "Planejada",
        execucao: "Execucao",
        pausada: "Pausada",
        concluida: "Concluida",
      };

      const normalizedStatus = statusMap[status.toLowerCase()];

      if (!normalizedStatus) {
        return res.status(400).json({ error: "Status inválido" });
      }

      fieldsToUpdate.push(`status = $${paramCount}`);
      values.push(normalizedStatus);
      paramCount++;
    }

    if (progresso !== undefined) {
      fieldsToUpdate.push(`progresso = $${paramCount}`);
      values.push(Math.min(progresso, 100)); // Máximo 100%
      paramCount++;
    }

    if (orcamentoPrevisto !== undefined) {
      fieldsToUpdate.push(`orcamento_previsto = $${paramCount}`);
      values.push(orcamentoPrevisto);
      paramCount++;
    }

    if (endereco !== undefined) {
      fieldsToUpdate.push(`endereco = $${paramCount}`);
      values.push(endereco || null);
      paramCount++;
    }

    if (dataInicio !== undefined) {
      fieldsToUpdate.push(`datainicio = $${paramCount}`);
      values.push(dataInicio || null);
      paramCount++;
    }

    if (dataFimPrevista !== undefined) {
      fieldsToUpdate.push(`dataprevista = $${paramCount}`);
      values.push(dataFimPrevista || null);
      paramCount++;
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }

    values.push(id, empresaId);

    const query = `
      UPDATE obra
      SET ${fieldsToUpdate.join(", ")}
      WHERE id = $${paramCount} AND empresaid = $${paramCount + 1}
      RETURNING id, nome, status, endereco, datainicio, dataprevista, orcamento_previsto, progresso
    `;

    const result = await db.query(query, values);
    const obra = result.rows[0];

    res.json({
      success: true,
      data: {
        id: obra.id,
        name: obra.nome,
        status: obra.status,
        endereco: obra.endereco,
        dataInicio: obra.datainicio,
        dataFimPrevista: obra.dataprevista,
        orcamentoPrevisto: obra.orcamento_previsto
          ? parseFloat(obra.orcamento_previsto)
          : null,
        progresso: parseFloat(obra.progresso),
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar obra:", error);
    res.status(500).json({ error: "Erro ao atualizar obra" });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.user.empresaid;

    if (!id) {
      return res.status(400).json({ error: "Id da obra é obrigatório" });
    }

    const query = `
      DELETE FROM obra
      WHERE id = $1 AND empresaid = $2
      RETURNING id
    `;

    const result = await db.query(query, [id, empresaId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Obra não encontrada" });
    }

    res.status(200).json({
      success: true,
      message: "Obra deletada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar obra:", error);
    res.status(500).json({ error: "Erro ao deletar obra" });
  }
};
