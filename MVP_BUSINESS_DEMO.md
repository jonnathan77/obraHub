# Demonstracao comercial ObraHub

## Estado

O conjunto de dados abaixo e uma **especificacao ficticia de demonstracao**, nao foi inserido no banco. A base local nao tinha `DATABASE_URL`, e as migrations disponiveis nao correspondem de forma consistente aos nomes usados pelos controllers. Inserir dados agora poderia gravar na estrutura errada ou em ambiente real.

Empresa sugerida: **Construtora Horizonte Engenharia**.

## Obras e roteiro de demonstracao

1. **Residencial Versalhes** — orçamento R$ 180.000, em execução, progresso físico 48%. Etapas: fundação concluída, estrutura em execução, alvenaria planejada, instalações planejadas e acabamento planejado. Mostrar compras, consumo de materiais e atividades pendentes após o fluxo de etapas estar validado.
2. **Residencial Jardim das Flores** — orçamento R$ 95.000, em execução, progresso 72%. Etapas em conclusão e execução; apresentar compras e materiais associados.
3. **Reforma Comercial Centro** — orçamento R$ 45.000, pausada, progresso 35%. Atividades pendentes e ocorrência fictícia explicando a pausa.

## Situacoes demonstrativas calculaveis

- **Desvio de categoria:** previsto R$ 12.000; realizado fictício R$ 14.500; diferença R$ 2.500 (20,83%). Só demonstrar após implementar/validar orçamento por categoria.
- **Perda de material:** entrada de 100 sacos de cimento a R$ 35 (R$ 3.500); utilização de 55; perda de 5 (R$ 175); saldo 40 sacos (R$ 1.400 pelo custo unitário informado). Usar movimentos distintos e conferir que estoque é derivado uma única vez.
- **Etapa atrasada:** definir prazo passado, status não concluído e atividades pendentes vinculadas. A interface atual ainda precisa de fluxo de status da etapa.
- **Sinal físico-financeiro:** na Versalhes, compras de R$ 104.400 sobre orçamento R$ 180.000 = 58%; progresso físico 48%; diferença de 10 pontos percentuais, apenas sinal para investigação. O dashboard atual só consegue calcular a aproximação a partir de movimentações de materiais, não despesas gerais.

Todos os números são exclusivamente exemplos. Não são dados reais nem registros já carregados no produto. Para uma demonstração comercial segura, criar banco isolado, definir schema canônico e carregar fixtures reversíveis, sem usar credenciais ou clientes reais.
