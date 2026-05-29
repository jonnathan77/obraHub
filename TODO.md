# TODO: Implementar Módulo Financeiro - Previsão de Caixa

## Passos do Plano Aprovado (Backend primeiro)

### [✅] 1. Backend - Instalar dependências
### [✅] 2. Backend - Criar src/services/planilha.service.js
- Funções: limparValor, limparData/excelDateToJS, parseXLSX/parseCSV, normalizarLinhas, calcularFluxoSaldo, gerarProjecoes, detectarRisco, summary.

### [ ] 3. Backend - Criar src/routes/financeiro.routes.js
- POST /upload com multer single('planilha'), auth, controller.uploadPlanilha.

### [ ] 4. Backend - Atualizar src/controllers/financeiro.controller.js
- exports.uploadPlanilha = async (req,res) -> usa planilha.service.

### [ ] 5. Backend - Atualizar src/index.js
- const financeiroRoutes = require('./routes/financeiro.routes'); app.use('/api/financeiro', financeiroRoutes);

### [ ] 6. Frontend - Criar src/app/pages/financeiro/financeiro.component.ts/html/scss
- Upload drag/drop .xlsx/csv, POST /api/financeiro/upload, cards/projeção, chart ng2-charts, tabela colorida, alerta risco.

### [ ] 7. Frontend - Atualizar src/app/app.routes.ts
- Import + {path: 'financeiro', component: FinanceiroComponent}

### [ ] 8. Testar
- Backend: curl upload teste.xlsx
- Frontend: ng serve, acessar /financeiro

### [ ] 9. Opcional: Adicionar link sidebar (src/app/layout/sidebar.component.html)
- <a routerLink="/financeiro">Financeiro</a>

Progresso: 0/9

