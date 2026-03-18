import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustosService } from '../../core/services/custos.service';
import { Custo, Obra } from '../../core/models';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ObrasService } from '@core/services/obras.service';

@Component({
  selector: 'app-lista-custos',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './custos-obra.component.html',
  styleUrls: ['./custos-obra.component.scss'],
})
export class ListaCustosComponent implements OnInit {
  @Input() obraId: string = '';
  @Input() custos: Custo[] = [];
  @Input() orcamento: number = 0;
  obra: Obra | null = null;

  custosLoaded = false;
  obraLoaded = false;

  chartData: any = {
    labels: [],
    datasets: [
      {
        label: 'Orçado',
        data: [],
        backgroundColor: '#0d6efd',
      },
      {
        label: 'Real',
        data: [],
        backgroundColor: '#8ec5ff',
      },
    ],
  };

  chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: R$ ${context.raw}`;
          },
        },
      },
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => 'R$ ' + value,
        },
      },
    },
  };

  constructor(
    private custosService: CustosService,
    private obrasService: ObrasService,
  ) {}

  ngOnInit(): void {
     this.carregarCustos();
     this.carregarObra();
  }

  carregarObra(): void {
    this.obrasService.getById(this.obraId).subscribe((obra) => {
      this.obra = obra || null;
      this.orcamento = obra?.orcamentoPrevisto || 0;

      this.obraLoaded = true;
      this.tryRenderChart();
    });
  }

  carregarCustos(): void {
    this.custosService.getByObraId(this.obraId).subscribe((custos) => {
      this.custos = custos || [];

      this.custosLoaded = true;
      this.tryRenderChart();
    });
  }

  tryRenderChart() {
   if (this.custosLoaded && this.obraLoaded) {
    this.gerarGraficoMes();
    }
  }

  gerarGraficoMes() {
    const meses: any = {};

    this.custos.forEach((c) => {
      const mes = new Date(c.data).toLocaleString('pt-BR', { month: 'short' });

      if (!meses[mes]) {
        meses[mes] = 0;
      }

      meses[mes] += c.valor;
    });

    const labels = Object.keys(meses);
    const valores = Object.values(meses);

    // orçamento dividido pelos meses
    const mediaOrcamento = this.orcamento / (labels.length || 1);

    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Orçado',
          data: labels.map(() => Math.round(mediaOrcamento)),
          backgroundColor: '#0d6efd',
        },
        {
          label: 'Real',
          data: valores,
          backgroundColor: '#8ec5ff',
        },
      ],
    };
  }

  gerarGraficoDia() {
    const dias: any = {};

    this.custos.forEach((c) => {
      const dia = new Date(c.data).toLocaleDateString('pt-BR');

      if (!dias[dia]) {
        dias[dia] = 0;
      }

      dias[dia] += c.valor;
    });

    const labels = Object.keys(dias);
    const valores = Object.values(dias);

    this.chartData.labels = labels;
    this.chartData.datasets[1].data = valores;

    const mediaOrcamento =
      (this.orcamento || 0) / (labels.length || 1);

    this.chartData.datasets[0].data = labels.map(() =>
      Math.round(mediaOrcamento),
    );

    this.chartData = { ...this.chartData };
  }

  alterarFiltro(event: any) {
    const filtro = event.target.value;

    if (filtro === 'mes') {
      this.gerarGraficoMes();
    }

    if (filtro === 'dia') {
      this.gerarGraficoDia();
    }
  }

  getTotalCustos(): number {
    return this.custos.reduce((sum, c) => sum + (c.valor || 0), 0);
  }

  getRestante(): number {
    if (!this.obra) return 0;
    return (this.orcamento ?? 0) - this.getTotalCustos();
  }

  getPercentualUsado(): number {
    if (!this.orcamento) return 0;
    return Math.round(
      (this.getTotalCustos() / this.orcamento) * 100,
    );
  }

  agruparPorCategoria(): { [key: string]: Custo[] } {
    const agrupado: { [key: string]: Custo[] } = {};

    this.custos.forEach((custo) => {
      if (!agrupado[custo.categoria]) {
        agrupado[custo.categoria] = [];
      }
      agrupado[custo.categoria].push(custo);
    });

    return agrupado;
  }

  getTotalPorCategoria(categoria: string): number {
    return this.custos
      .filter((c) => c.categoria === categoria)
      .reduce((sum, c) => sum + c.valor, 0);
  }

  // Chart / KPI mock data (will be used when real data not provided)
  chartLabels: string[] = [];
  chartBudget: number[] = [];
  chartReal: number[] = [];

  // computed for rendering
  chartWidth = 740; // inner width
  chartHeight = 180;
  barGroupWidth = 0;
  barWidth = 30;
  barPadding = 8;
  budgetHeights: number[] = [];
  realHeights: number[] = [];
  yGrid: number[] = [];
  maxChartValue = 1;

  private setMockChartData(): void {
    this.chartLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    this.chartBudget = [38000, 45000, 52000, 60000, 54000, 70000];
    this.chartReal = [36000, 43000, 50000, 62000, 53000, 69000];
  }

  prepareChart(): void {
    // layout
    const n = this.chartLabels.length || 1;
    this.barGroupWidth = Math.floor(this.chartWidth / n);
    this.barWidth = Math.min(40, Math.floor((this.barGroupWidth - 8) / 2));
    this.barPadding = Math.max(
      6,
      Math.floor((this.barGroupWidth - (this.barWidth * 2 + 6)) / 2),
    );

    const maxVal =
      Math.max.apply(null, this.chartBudget.concat(this.chartReal)) || 1;
    this.maxChartValue = maxVal;
    const scale = this.chartHeight / maxVal;

    this.budgetHeights = this.chartBudget.map((v) => Math.round(v * scale));
    this.realHeights = this.chartReal.map((v) => Math.round(v * scale));

    // grid 5 lines
    const gridCount = 5;
    this.yGrid = Array.from({ length: gridCount }, (_, i) => i);
  }

  // KPI helpers
  getTotalBudgetChart(): number {
    return this.chartBudget.reduce((s, v) => s + v, 0);
  }
  getTotalRealChart(): number {
    return this.chartReal.reduce((s, v) => s + v, 0);
  }
  getPercentualChart(): number {
    const b = this.getTotalBudgetChart();
    return b ? Math.round((this.getTotalRealChart() / b) * 100) : 0;
  }
  getLastMonthDelta(): number {
    const i = this.chartLabels.length - 1;
    return (this.chartReal[i] || 0) - (this.chartBudget[i] || 0);
  }
}
