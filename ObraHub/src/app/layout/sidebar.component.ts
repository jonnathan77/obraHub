import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { LayoutService } from './layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  isOpen$: Observable<boolean>;

  menuItems = [
    { label: 'Dashboard', icon: 'bi-graph-up', route: '/dashboard', visivel: true },
    { label: 'Gestão de Obras', icon: 'bi-hammer', route: '/obras', visivel: true },
   // { label: 'Materiais', icon: 'bi-box-seam', route: '/materiais', visivel: true },
    { label: 'Movimentação de Materiais', icon: 'bi-arrow-left-right', route: '/movimentacoes', visivel: true },
    { label: 'Checklist de Atividades', icon: 'bi-check2-square', route: '/checklist-atividades', visivel: true },
    { label: 'Gestão de Leads', icon: 'bi-hammer', route: '/relatorios', visivel: false },
    { label: 'Agendamentos', icon: 'bi-hammer', route: '/relatorios', visivel: false },
    { label: 'Calculadora de Materias', icon: 'bi-hammer', route: '/relatorios', visivel: false },
    { label: 'Simulador de Custos', icon: 'bi-hammer', route: '/relatorios', visivel: false },
    { label: 'Relatórios', icon: 'bi-file-earmark-text', route: '/relatorios', visivel: true },
    { label: 'Segurança', icon: 'bi-file-earmark-text', route: '/relatorios', visivel: false },
    { label: 'Controle de Estoque', icon: 'bi-file-earmark-text', route: '/relatorios', visivel: false },
    { label: 'Gestão de Compras', icon: 'bi-file-earmark-text', route: '/relatorios', visivel: false },
    { label: 'Area Financeira', icon: 'bi-file-earmark-text', route: '/relatorios', visivel: false },
    { label: 'Qualidade', icon: 'bi-file-earmark-text', route: '/relatorios', visivel: false },
    { label: 'Configurações', icon: 'bi-gear', route: '/configuracoes', visivel: true }
  ];
  constructor(private layout: LayoutService) {
    this.isOpen$ = this.layout.isOpen$;
  }

  toggleSidebar(): void {
    this.layout.toggle();
  }

  onItemClick(): void {
    // Only close automatically on small screens (mobile/tablet)
    if (window.matchMedia('(max-width: 991px)').matches) {
      this.layout.close();
    }
  }
}
