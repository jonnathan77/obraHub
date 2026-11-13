# Checklist de estabilizacao do MVP

Legenda: **OK local** = validacao executada nesta rodada; **Bloqueado** = depende de banco/servicos externos; **Pendente** = funcionalidade incompleta ou sem teste suficiente.

## Validacao tecnica executada

- [x] `ObraHub`: `npm run build` — passou.
- [x] `ObraHubBackend`: `npm test` — 3 testes unitarios passaram (conversao e importacao CSV/XLSX).
- [x] `node --check` em arquivos JavaScript de `src` e `test` — passou.
- [x] `git diff --check` — sem erro de whitespace no momento da verificacao.
- [x] `ObraHub`: `npm test -- --watch=false --browsers=ChromeHeadless` — 2 testes passaram.
- [x] Smoke HTTP local: `GET /` retornou 200; `/works` e `/api/ai/planilha-modelo` sem token retornaram 401.
- [ ] PostgreSQL/API — bloqueado: `DATABASE_URL` nao configurada.
- [ ] Fluxos E2E — bloqueados pelo banco e falta de ambiente isolado.

Os scripts antigos `test-connection.js` e `test-connection-verbose.js` foram executados pelo primeiro `node --test` e falharam por ausencia de configuracao e conexao. O script de teste foi restringido a `test/`; os tres testes unitarios passaram. O smoke test nao acessou dados nem substitui E2E. Nenhuma falha e apresentada como fluxo de persistencia aprovado.

## Modulos

| Modulo | Estado | Evidencia/pendencia |
|---|---|---|
| Login/autenticacao | Pendente | Hash bcrypt e JWT existem; rotas de API precisam de teste. Cadastro agora exige token; nao existe onboarding de empresa nem autorizacao por papel. |
| Isolamento multiempresa | Pendente critico | Consultas de dominio filtram empresa em geral; movimentacao e IA foram reforcadas, mas tentativa A/B nao foi executada. |
| Dashboard | Parcial | Removidos exemplos fixos e previsao inventada; consome movimentacoes. Falta integrar despesas verdadeiras e alertas de backend. |
| Obras | Parcial | CRUD existente; status de criacao/alteracao normalizado. Persistencia e exclusao em banco nao testadas. |
| Etapas/progresso | Pendente | Service de listagem geral devolve vazio; status nao tem fluxo completo na interface; derivacao de progresso nao validada. |
| Atividades/checklist | Pendente | Rotas existem; persistencia, prazos, filtros e relacao a etapa nao foram testados. |
| Financeiro/custos | Pendente critico | Tela de previsao de caixa e importacao corrigidas; registro/edit de despesas e comparacao orcado-real nao estao comprovados. Schema/view divergentes. |
| Materiais/estoque | Parcial | Validacao server-side de empresa e saldo negativo adicionada. Sem banco, transacao e simultaneidade nao foram exercitadas. |
| Ocorrencias/fotos | Pendente | Rotas existem; armazenamento, permissao entre empresas e upload nao foram testados. |
| Relatorios/exportacao | Pendente | Nenhum arquivo/resultado foi validado contra banco. |
| Responsividade/UX | Parcial | Guarda de rota, estado vazio de dashboard e mensagens de importacao mantidas; revisao visual completa pendente. |

## Cenarios E2E solicitados

- [ ] A — Criar empresa, administrador, login e dashboard.
- [ ] B — Criar obra, etapas/atividades, persistir status e progresso apos reload.
- [ ] C — Despesas por categoria, edicao, totais e previsto versus realizado.
- [ ] D — Material, entrada, utilizacao, perda, saldo e custo.
- [ ] E — Planejar, iniciar, pausar, retomar, concluir e reabrir etapa.
- [ ] F — Tenant A tentar acessar dados de B por IDs/parametros.

**Resultado geral:** build e testes unitarios selecionados passaram; MVP nao aprovado para piloto ate concluir itens criticos e validacao E2E isolada.
