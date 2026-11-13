# Preparacao de deploy e piloto

## Pre-requisitos

- Node/npm compativeis com Angular 17 e backend Express; versao testada nesta rodada: Node 26.13.1.
- PostgreSQL de teste separado do banco de producao.
- HTTPS para frontend/API, segredo JWT forte e exclusivo por ambiente.
- Definir o provedor de upload/fotos e de IA antes de habilitar esses fluxos.

## Configuracao

Backend, arquivo local nao versionado `ObraHubBackend/.env`:

```env
DATABASE_URL=postgresql://<usuario>:<senha>@<host>:5432/<banco>
JWT_SECRET=<segredo-aleatorio-forte>
```

Nao reutilize os placeholders acima. A conexao atual aceita certificado TLS nao confiavel e deve ser alterada para validar CA/certificado no ambiente de deploy.

Frontend:

- Desenvolvimento usa `http://localhost:3000` em `src/environments/environment.ts`.
- Producao usa atualmente `https://obrahub-1.onrender.com` em `environment.prod.ts`; confirme/forneca a URL oficial antes de publicar.
- CORS do backend esta aberto a qualquer origem. Configurar allowlist com os dominios do frontend antes de expor a API.

## Banco e migrations

1. Nao executar migration na base real antes de resolver a divergencia de nomes descrita em `MVP_AUDIT.md`.
2. Criar banco descartavel, aplicar schema revisado e validar constraints/indices/FKs.
3. Fazer snapshot/backup e testar restauracao antes de qualquer piloto.
4. Criar fixture comercial apenas nesse banco isolado; validar consultas e totais por empresa.

## Validacao e publicacao

1. No PowerShell: `Set-Location ObraHubBackend; npm ci; npm test`.
2. No PowerShell: `Set-Location ObraHub; npm ci; npm run build`.
3. Executar testes de API/E2E com dois tenants no banco de teste (ainda nao existentes).
4. Configurar secrets no gerenciador do provedor, nunca em Git ou bundle Angular.
5. Publicar backend com healthcheck, logs sem dados pessoais/sensiveis, limites de payload e alertas de erro.
6. Publicar frontend Angular em HTTPS; confirmar que a URL da API e a de producao.
7. Monitorar logs, conexao de banco, upload e backups diariamente no piloto.

## Backup e rollback

- Definir frequencia, retencao, criptografia e responsavel pelos backups PostgreSQL.
- Testar restore em ambiente isolado antes do piloto e apos mudancas de schema.
- Aplicar migrations reversiveis; preparar rollback e manter backup pre-deploy.
- Nao executar scripts de seed em producao sem revisao e aprovacao explicita.

**Nao liberar piloto** ate cumprir os bloqueadores da lista em `MVP_KNOWN_ISSUES.md`.
