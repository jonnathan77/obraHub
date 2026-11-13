import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard.component';
import { ListaObrasComponent } from './pages/lista-obras/lista-obras.component';
import { DetalheObraComponent } from './pages/detalhe-obra/detalhe-obra.component';
import { LoginComponent } from './pages/login/login.component';
import { RelatoriosComponent } from './pages/relatorios/relatorios.component';
import { ConfiguracoesComponent } from './pages/configuracoes/configuracoes.component';
import { MateriaisComponent } from './pages/materiais/materiais.component';
import { MovimentacoesComponent } from './pages/movimentacoes/movimentacoes.component';
import { ChecklistAtividadesComponent } from './pages/checklist-atividades/checklist-atividades.component';
import { FinanceiroComponent } from './pages/financeiro/financeiro.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'relatorios', component: RelatoriosComponent, canActivate: [authGuard] },
  { path: 'configuracoes', component: ConfiguracoesComponent, canActivate: [authGuard] },
  { path: 'obras', component: ListaObrasComponent, canActivate: [authGuard] },
  { path: 'obras/:id', component: DetalheObraComponent, canActivate: [authGuard] },
  { path: 'materiais', component: MateriaisComponent, canActivate: [authGuard] },
  { path: 'movimentacoes', component: MovimentacoesComponent, canActivate: [authGuard] },
  { path: 'checklist-atividades', component: ChecklistAtividadesComponent, canActivate: [authGuard] },
  { path: 'financeiro', component: FinanceiroComponent, canActivate: [authGuard] }
];
