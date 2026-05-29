const aiService = require('../services/aiService')
const { buildPrevisaoPrompt } = require('../prompts/previsaoCustos')
const { buildDescreverObraPrompt } = require('../prompts/descreverObra')
const xlsx = require('xlsx')

async function previsaoCustos(req, res) {
  try {
    const { obra, itens } = req.body
    if (!obra) return res.status(400).json({ error: 'Campo "obra" obrigatório' })

    const prompt = buildPrevisaoPrompt(obra, itens)
    const aiResp = await aiService.generate(prompt, { maxTokens: 1200 })

    // try parse JSON result
    try {
      const parsed = JSON.parse(aiResp)
      return res.json({ ok: true, data: parsed })
    } catch (e) {
      return res.json({ ok: true, raw: aiResp })
    }
  } catch (err) {
    console.error('previsaoCustos error', err)
    return res.status(500).json({ error: err.message })
  }
}

async function descreverObra(req, res) {
  try {
    const { obra, custos, materiais, checklists, atividades } = req.body
    if (!obra) return res.status(400).json({ error: 'Campo "obra" obrigatório' })

    const prompt = buildDescreverObraPrompt(obra, custos, materiais, checklists, atividades)
    const aiResp = await aiService.generate(prompt, { maxTokens: 1500 })
    return res.json({ ok: true, texto: aiResp })
  } catch (err) {
    console.error('descreverObra error', err)
    return res.status(500).json({ error: err.message })
  }
}

const ExcelJS = require('exceljs');

async function planilhaModelo(req, res) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Modelo ObraHub');

    worksheet.columns = [
      { header: 'Item', key: 'item', width: 28 },
      { header: 'Rubrica', key: 'rubrica', width: 40 },
      { header: 'Qtd Previsto', key: 'qtd_prev', width: 18 },
      { header: 'Vl Unitário Previsto', key: 'vl_unit_prev', width: 22 },
      { header: 'Vl Total Previsto', key: 'vl_total_prev', width: 22 },
      { header: 'Qtd Realizado', key: 'qtd_real', width: 18 },
      { header: 'Vl Realizado', key: 'vl_real', width: 22 },
      { header: 'Data Previsto', key: 'data_prev', width: 15 },
      { header: 'Observações', key: 'obs', width: 50 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
    headerRow.alignment = { horizontal: 'center' };

    worksheet.addRows([
      ['Fundação', 'Serviços de fundação', 100, 50.00, 5000.00, 20, 1000.00, '2026-06-15', 'Início da obra'],
      ['Estrutura', 'Concreto armado', 250, 120.00, 30000.00, 80, 9600.00, '2026-07-10', ''],
      ['Alvenaria', 'Blocos cerâmicos', 800, 8.50, 6800.00, 300, 2550.00, '2026-07-25', ''],
      ['Acabamento', 'Pintura interna', 450, 35.00, 15750.00, 0, 0.00, '2026-08-20', 'Fase final']
    ]);

    // === HEADERS IMPORTANTÍSSIMOS ===
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=planilha_modelo_obrahub.xlsx');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Envio do arquivo
    await workbook.xlsx.write(res);
    return res.end();

  } catch (err) {
    console.error('Erro ao gerar planilha modelo:', err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { previsaoCustos, descreverObra, planilhaModelo }
