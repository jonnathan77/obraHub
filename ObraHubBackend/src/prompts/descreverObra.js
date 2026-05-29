// Prompt builder for describing obra status
function buildDescreverObraPrompt(obra, custos, materiais, checklists, atividades) {
  const obraResumo = JSON.stringify(obra || {}, null, 2)
  const custosResumo = JSON.stringify(custos || {}, null, 2)
  const materiaisResumo = JSON.stringify(materiais || [], null, 2)
  const checklistsResumo = JSON.stringify(checklists || [], null, 2)
  const atividadesResumo = JSON.stringify(atividades || [], null, 2)

  return `Você é um engenheiro de planejamento sênior. Use os dados abaixo e gere um relatório narrativo completo sobre o andamento da obra com seções: Introdução, Estado Atual (integra custos, materiais, checklists), Principais Riscos, Ações Recomendadas, Prioridades de Curto Prazo, Observações Técnicas. Seja conciso e apresente bullets quando apropriado.\n\nObra:${obraResumo}\n\nCustos:${custosResumo}\n\nMateriais:${materiaisResumo}\n\nChecklists:${checklistsResumo}\n\nAtividades:${atividadesResumo}\n\nRetorne o texto em formato markdown.`
}

module.exports = { buildDescreverObraPrompt }
