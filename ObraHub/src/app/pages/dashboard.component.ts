import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ObrasService } from '@services/obras.service';
import { EtapasService } from '@services/etapas.service';
import { CustosService } from '@services/custos.service';
import { Obra, Etapa, Custo } from '@models/index';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  obrasAtivas = 0;
  obrasAtrasadas = 0;
  progressoMedio = 0;
  custosTotal = 0;

  obras: Obra[] = [];  
  etapas: Etapa[] = [];
  custos: Custo[] = [];

  statusStats = {
    planejada: 0,
    em_execucao: 0,
    pausada: 0,
    concluida: 0
  };

  constructor(
    private obrasService: ObrasService,
    private etapasService: EtapasService,
    private custosService: CustosService
  ) { }

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.obrasService.getAll().subscribe((obras: Obra[]) => {
      this.obras = obras;
      this.obrasAtivas = obras.filter((o: Obra) => o.status === 'Execucao').length;
      this.obrasAtrasadas = 0;
      
      // Contar status
      this.statusStats = {
        planejada: obras.filter((o: Obra) => o.status === 'Planejada').length,
        em_execucao: obras.filter((o: Obra) => o.status === 'Execucao').length,
        pausada: obras.filter((o: Obra) => o.status === 'Pausada').length,
        concluida: obras.filter((o: Obra) => o.status === 'Concluida').length
      };
    });

    this.etapasService.getAll().subscribe((etapas: Etapa[]) => {
      this.etapas = etapas;
      if (etapas.length > 0) {
        const mediaProgresso = etapas.reduce((sum: number, e: Etapa) => sum + e.progresso, 0) / etapas.length;
        this.progressoMedio = Math.round(mediaProgresso);
      }
    });

    this.custosService.getAll().subscribe((custos: Custo[]) => {
      this.custos = custos;
      console.log('Custos carregados:', custos);
      this.custosTotal = this.custos.reduce((s, c) => s + (c.valor || 0), 0);
    });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Planejada': '#6c757d',
      'Execucao': '#0d6efd',
      'Pausada': '#ffc107',
      'Concluida': '#198754'
    };
    return colors[status] || '#6c757d';
  }
}
