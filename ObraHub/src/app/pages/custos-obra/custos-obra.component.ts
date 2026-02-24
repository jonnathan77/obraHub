import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustosService } from '../../core/services/custos.service';
import { Custo } from '../../core/models';

@Component({
  selector: 'app-lista-custos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custos-obra.component.html',
  styleUrls: ['./custos-obra.component.scss']
})
export class ListaCustosComponent implements OnInit {
  @Input() obraId: string = '';
  @Input() custos: Custo[] = [];
  @Input() orcamento: number = 0;

  constructor(private custosService: CustosService) { }

  ngOnInit(): void {
    if (!this.custos || this.custos.length === 0) {
      this.carregarCustos();
    }

    // If no chart data provided, set mocked values
    this.setMockChartData();
    this.prepareChart();
  }

  carregarCustos(): void {
    this.custosService.getByObraId(this.obraId).subscribe(custos => {
      this.custos = custos;
    });
  }

  getTotalCustos(): number {
    return this.custos.reduce((sum, c) => sum + c.valor, 0);
  }

  getRestante(): number {
    return this.orcamento - this.getTotalCustos();
  }

  getPercentualUsado(): number {
    if (this.orcamento === 0) return 0;
    return Math.round((this.getTotalCustos() / this.orcamento) * 100);
  }

  agruparPorCategoria(): { [key: string]: Custo[] } {
    const agrupado: { [key: string]: Custo[] } = {};
    
    this.custos.forEach(custo => {
      if (!agrupado[custo.categoria]) {
        agrupado[custo.categoria] = [];
      }
      agrupado[custo.categoria].push(custo);
    });

    return agrupado;
  }

  getTotalPorCategoria(categoria: string): number {
    return this.custos
      .filter(c => c.categoria === categoria)
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
    this.chartLabels = ['Jan','Fev','Mar','Abr','Mai','Jun'];
    this.chartBudget = [38000, 45000, 52000, 60000, 54000, 70000];
    this.chartReal =   [36000, 43000, 50000, 62000, 53000, 69000];
  }

  prepareChart(): void {
    // layout
    const n = this.chartLabels.length || 1;
    this.barGroupWidth = Math.floor(this.chartWidth / n);
    this.barWidth = Math.min(40, Math.floor((this.barGroupWidth - 8) / 2));
    this.barPadding = Math.max(6, Math.floor((this.barGroupWidth - (this.barWidth*2 + 6)) / 2));

    const maxVal = Math.max.apply(null, this.chartBudget.concat(this.chartReal)) || 1;
    this.maxChartValue = maxVal;
    const scale = this.chartHeight / maxVal;

    this.budgetHeights = this.chartBudget.map(v => Math.round(v * scale));
    this.realHeights = this.chartReal.map(v => Math.round(v * scale));

    // grid 5 lines
    const gridCount = 5;
    this.yGrid = Array.from({length: gridCount}, (_, i) => i);
  }

  // KPI helpers
  getTotalBudgetChart(): number { return this.chartBudget.reduce((s,v)=>s+v,0); }
  getTotalRealChart(): number { return this.chartReal.reduce((s,v)=>s+v,0); }
  getPercentualChart(): number { const b=this.getTotalBudgetChart(); return b? Math.round(this.getTotalRealChart()/b*100):0; }
  getLastMonthDelta(): number { const i=this.chartLabels.length-1; return (this.chartReal[i]||0) - (this.chartBudget[i]||0); }
}
