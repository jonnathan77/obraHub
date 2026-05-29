// prompts/custos/previsao-custos.js

export const gerarPromptPrevisaoCustos = (dados) => {
  return `
Você é um engenheiro de custos sênior com 15 anos de experiência em obras comerciais e residenciais no Brasil.

Analise os dados da obra abaixo e faça uma **previsão completa e crítica** de custos.

**Dados da Obra:**
- Nome: ${dados.nome || 'Não informado'}
- Orçamento Previsto: ${dados.orcamentoPrevisto ? 'R$ ' + Number(dados.orcamentoPrevisto).toLocaleString('pt-BR') : 'Não informado'}
- Gasto Realizado até o momento: ${dados.gastoRealizado ? 'R$ ' + Number(dados.gastoRealizado).toLocaleString('pt-BR') : 'Não informado'}
- Percentual Financeiro Executado: ${dados.percentualExecutado ? dados.percentualExecutado + '%' : 'Não informado'}
- Data de Início: ${dados.dataInicio || 'Não informado'}
- Data Prevista de Término: ${dados.dataPrevista || 'Não informado'}
- Tipo de Obra: ${dados.tipoObra || 'Não informado'}
- Status Atual: ${dados.status || 'Não informado'}

**Itens / Rubricas mais relevantes:**
${dados.itens && dados.itens.length > 0 
  ? dados.itens.map((item) => 
      `- ${item.nome}: Previsto R$ ${item.previsto ? Number(item.previsto).toLocaleString('pt-BR') : 0} | Realizado R$ ${item.realizado ? Number(item.realizado).toLocaleString('pt-BR') : 0} | Diferença: R$ ${item.diferenca ? Number(item.diferenca).toLocaleString('pt-BR') : 0}`
    ).join('\n')
  : 'Nenhum item detalhado foi fornecido.'}

**Observações adicionais do usuário (se houver):**
${dados.observacoes || dados.descricao || 'Nenhuma observação adicional.'}

---

**Instruções para sua análise:**
- Faça uma análise **crítica, honesta e profissional**
- Sempre responda em **português brasileiro claro e direto**
- Destaque riscos de estouro de orçamento (com percentual aproximado quando possível)
- Apresente sugestões práticas e acionáveis
- Use formato estruturado com **negrito** para títulos
- Inclua uma seção de "Recomendações Prioritárias"

Formato de resposta desejado:
**1. Resumo Executivo**
**2. Análise de Desvios**
**3. Previsão de Custos Finais**
**4. Riscos Principais**
**5. Recomendações Prioritárias**
`;
};