// Prompt builder for cost prediction (previsao-custos)
function buildPrevisaoPrompt(obra, itens) {
  const obraResumo = JSON.stringify(obra || {}, null, 2)
  const itensResumo = JSON.stringify(itens || [], null, 2)

  return `Você é um analista sênior de orçamentos para obras. Recebeu os dados abaixo. Produza uma resposta estruturada em JSON com as chaves: resumoExecutivo, analiseDesvios, previsaoFinal, riscos, recomendacoes. Seja objetivo e prático. \n\nDados da obra:\n${obraResumo}\n\nItens/serviços:\n${itensResumo}\n\nRegras:\n- Informe percentuais quando possível\n- Destaque principais drivers de custo\n- Forneça recomendações acionáveis para reduzir risco\n- Se houver suposições, liste-as em um array chamado suposicoes\n\nRetorne apenas JSON válido.`
}

module.exports = { buildPrevisaoPrompt }
