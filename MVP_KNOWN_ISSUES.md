# Problemas conhecidos e riscos

## Bloqueadores de piloto

1. Sem teste automatizado de API com PostgreSQL e sem prova de isolamento A/B.
2. Divergencia entre migration, controllers, views e nomes de tabelas do dominio de materiais/financeiro.
3. Cadastro/login de empresa e modelo de papeis nao estao completos; criacao de usuario requer token, mas nao exige papel de administrador.
4. Progresso/status de etapas nao tem ciclo completo na interface e nao esta comprovado como fonte do progresso da obra.
5. Financeiro nao demonstra persistencia completa de receitas/despesas, edicao, categorias e previsto versus realizado.
6. Upload/armazenamento de fotos e permissao entre empresas nao foram testados.
7. Configuracao de producao precisa confirmar endpoint real, segredo JWT, CORS e conexao PostgreSQL. Banco rejeita certificados nao confiaveis (`rejectUnauthorized: false`).

## Outros problemas

- Endpoint de login imprime a query SQL em log; nao imprime valores de credenciais, mas o log de depuracao deve ser removido.
- Servidor fixa porta 3000 e nao define health/readiness nem middleware central de erro.
- `express.json` aceita payload ate 50 MB; reduzir para o necessario e limitar upload por endpoint.
- `EtapasService.getAll()` retorna lista vazia sem consultar backend.
- `CustosService` possui CRUD local em memoria; recarregar perde os dados.
- A interface ainda tem acoes rapidas sem operacao ligada e indicador de equipe indisponivel.
- O uso de estoque nao valida invariantes contra schema/movimentos antigos; revisar saldos negativos preexistentes antes de aplicar a regra.
- Dependencia `multer` instalada e da linha 1.x, cuja versao exibe aviso de vulnerabilidade/depreciacao na instalacao; planejar atualizacao validada para 2.x.
- Configuracao Firebase depende de `firebase-admin` e arquivo de service account nao encontrado; determinar se e codigo morto.

## Limitacoes da auditoria

Nao foi possivel acessar banco, credenciais, Cloudinary, Firebase, provedor de IA ou navegador de testes. Nenhum dado demo foi gravado. Falha de conexao nao foi tratada como teste de fluxo.
