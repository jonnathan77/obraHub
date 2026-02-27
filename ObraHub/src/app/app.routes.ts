import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard.component';
import { ListaObrasComponent } from './pages/lista-obras/lista-obras.component';
import { DetalheObraComponent } from './pages/detalhe-obra/detalhe-obra.component';
import { LoginComponent } from './pages/login/login.component';
import { RelatoriosComponent } from './pages/relatorios/relatorios.component';
import { ConfiguracoesComponent } from './pages/configuracoes/configuracoes.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'relatorios', component: RelatoriosComponent },
  { path: 'configuracoes', component: ConfiguracoesComponent },
  { path: 'obras', component: ListaObrasComponent },
  { path: 'obras/:id', component: DetalheObraComponent }
];
