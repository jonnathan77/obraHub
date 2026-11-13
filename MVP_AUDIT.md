# Auditoria do MVP ObraHub

Data da auditoria: 12/11/2026

## Conclusao executiva

**Nao aprovado para implantacao em uma construtora real.** Foram corrigidos bugs que podiam mostrar dados ficticios, descartar linhas de planilha, aceitar movimentacoes de outra empresa e permitir estoque negativo. Ainda existem bloqueios de banco, inconsistencias de schema e ausencia de testes integrados que impedem atestar os fluxos de ponta a ponta e o isolamento multiempresa.

## Arquitetura identificada

- Frontend: Angular 17.3, TypeScript 5.4, RxJS 7.8, Chart.js/ng2-charts; build SPA em `ObraHub`.
- Backend: Node.js/Express 4, JWT HS256, bcryptjs, PostgreSQL via `pg`; APIs em `ObraHubBackend`.
- Importacao financeira: XLSX/CSV em memoria; upload limitado a 10 MB.
- Integracoes presentes no codigo: geracao de planilha XLSX, servico de IA, Cloudinary e configuracao Firebase isolada.
- Persistencia principal esperada: PostgreSQL. Nao foi possivel consultar o banco: nao havia `DATABASE_URL` nem credenciais locais.
- Ambiente usado para validacao: Node v26.13.1. Dependencias restauradas dos lockfiles para executar os testes; nenhum arquivo de lock foi alterado.

## O que foi observado

- Obras, etapas, custos, materiais, movimentacoes, atividades, ocorrencias e fotos possuem telas, services e/ou endpoints.
- A maior parte das APIs de dominio aplica `authMiddleware` e filtra pela empresa do token. A rota de IA nao o fazia e foi protegida nesta alteracao.
- A criacao de conta aceitava um `empresaid` enviado anonimamente pelo cliente. Agora exige token e limita o cadastro a empresa desse token. Nao ha papel/permissao de administrador implementado.
- A aplicacao nao apresenta tela de cadastro de empresa. O endpoint publico de login e a unica forma observada de iniciar sessao.
- Guardas frontend por existencia de token foram adicionadas. A autorizacao real continua sendo responsabilidade da API.
- A inicializacao do layout no `AppComponent` sobrescrevia o estado da rota e mantinha navbar/sidebar ocultos; corrigido.
- Desenvolvimento apontava para API remota e producao para localhost; os ambientes foram corrigidos (localhost no desenvolvimento e URL de deploy preexistente em producao).

## Bugs corrigidos nesta rodada

1. Importacao CSV/XLSX ignorava indevidamente a primeira linha de dados; agora processa todas as linhas.
2. Numeros decimais recebidos como number ou com ponto decimal eram convertidos incorretamente; conversao numerica preserva decimais e suporta moeda brasileira.
3. Frontend tratava o envelope `{ success, data }` da importacao como se fosse o resultado interno, quebrando o grafico.
4. A previsao de IA usava URL relativa e nao enviava o token; agora usa a URL configurada e autenticacao.
5. O dashboard tinha series, diario, alertas, previsao de custo (`1.337`) e prazo de risco fixos. Dados inventados foram removidos; graficos e diario usam movimentacoes recebidas. O dashboard sinaliza diferenca compras/progresso como investigacao, nao como prejuizo.
6. Criacao de obra ignorava o status selecionado e atualizacao recusava `em_execucao`; o backend agora normaliza os estados existentes e valida orçamento/progresso.
7. Criacao de movimentacao nao verificava a empresa da obra e aceitava saidas sem estoque suficiente. Agora valida empresa, tipo/quantidade/valor/data e protege o saldo em transacao com bloqueio da linha do material.
8. Paginas autenticadas agora redirecionam para login quando nao existe token.
9. Teste Angular gerado ainda esperava o texto boilerplate “Hello, ObraHub”; ajustado para testar o app real.
10. Smoke HTTP local: API iniciou, `/` respondeu 200 e endpoints de obras/IA sem autenticacao responderam 401. Nao foi feita consulta ao banco.

## Lacunas/riscos encontrados

- A migration `001_materiais_movimentacoes_estrutura.sql` cria `material_catalogo`, `movimentacao` e `atividade`; controllers usam tambem `material`, `movimentacaomaterial` e `atividades`. Sem schema real nao e seguro unificar nem confirmar quais tabelas estao em producao.
- `vw_custos_obra` usa tabelas/colunas diferentes das descritas na migration. Endpoints financeiros e custos nao foram validados no PostgreSQL.
- O service de saude financeira consulta `tipo_movimentacao`, enquanto movimentacoes gravam `tipo`; potencial falha de consulta.
- `EtapasService.getAll()` retorna sempre lista vazia e a tela de etapas nao oferece controles de transicao de status. Progresso de obra nao foi demonstrado como derivado de etapas/atividades.
- Custos tem registros em memoria e operacoes CRUD sem persistencia; relatorios tambem nao foram validados.
- Upload de fotos depende de configuracao externa/schema que nao foi exercitada.
- `auth.routes.js` nao implementa papéis. Qualquer usuario autenticado pode criar outro usuario na propria empresa.
- CORS permite qualquer origem; PostgreSQL usa `rejectUnauthorized: false`; o corpo JSON aceita 50 MB. Estes defaults nao sao adequados para producao.
- `config/firebase.js` referencia `firebase-admin` e `firebase-key.json`; nao localizei uso no fluxo principal nem a chave no repositorio. Validar/remover essa integracao morta antes de deploy.
- A URL de producao do frontend aponta para `https://obrahub-1.onrender.com`; confirmar se ainda e o endpoint oficial e mover para configuracao de deploy, sem deixar localhost em producao.

## Plano priorizado

1. Obter schema/migrations reais e credenciais de um banco de teste isolado; harmonizar nomes e executar migrations em banco descartavel.
2. Criar testes de API com dois tenants e exercitar auth, obras, materiais, movimentacoes, custos, etapas, fotos e ocorrencias.
3. Definir modelo de papeis/administracao e fluxo seguro de criacao de empresa e usuarios.
4. Corrigir transicoes/progresso de etapas e persistencia financeira; validar calculos e relatorios com dados controlados.
5. Restringir CORS, exigir TLS verificado e definir limites de request/segredos e operacao/backup.
6. Gerar e validar a base comercial demonstrativa em banco de teste somente apos os passos anteriores.
