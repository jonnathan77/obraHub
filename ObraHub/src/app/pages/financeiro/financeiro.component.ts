import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpErrorResponse,
} from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ChartConfiguration, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';

interface LinhaFluxo {
  data: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  saldo: number;
}

interface Projecao {
  data: string;
  saldo: number;
}

interface Resultado {
  fluxo: LinhaFluxo[];
  projecao: Projecao[];
  riscoData: string | null;
  summary: {
    totalEntradas: number;
    totalSaidas: number;
    saldoFinal: number;
    linhasProcessadas: number;
  };
}

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    NgChartsModule,
  ],
  templateUrl: './financeiro.component.html',
  styleUrls: ['./financeiro.component.scss'],
})
export class FinanceiroComponent implements OnInit {
  fileName = '';
  loading = false;
  resultado: Resultado | null = null;
  erro = '';
  dragOver: boolean = false;
  // Chart
  public lineChartData: ChartConfiguration<'line'>['data'] = { datasets: [] };
  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          display: true,
        },
        border: {
          display: false,
        },
      },
      x: { grid: { display: false } },
    },
    plugins: {
      legend: { display: false },
    },
    elements: {
      point: { radius: 0 },
    },
  };
  public lineChartType: ChartType = 'line';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (
      file &&
      (file.name.toLowerCase().endsWith('.xlsx') ||
        file.name.toLowerCase().endsWith('.xls') ||
        file.name.toLowerCase().endsWith('.csv'))
    ) {
      this.fileName = file.name;
      this.uploadFile(file);
    } else {
      this.erro = 'Apenas arquivos XLSX, XLS ou CSV são permitidos.';
      event.target.value = '';
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (
      file &&
      (file.name.toLowerCase().endsWith('.xlsx') ||
        file.name.toLowerCase().endsWith('.xls') ||
        file.name.toLowerCase().endsWith('.csv'))
    ) {
      this.fileName = file.name;
      this.uploadFile(file);
    }
  }

  uploadFile(file: File): void {
    this.loading = true;
    this.erro = '';

    const formData = new FormData();
    formData.append('planilha', file);

    this.http.post<Resultado>('/api/financeiro/upload', formData).subscribe({
      next: (data: Resultado) => {
        this.resultado = data;
        this.updateChart();
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.erro =
          err.error?.error ||
          'Erro ao processar planilha. Verifique o formato.';
        this.loading = false;
      },
    });
  }

  getSaldoAtual(): number {
    return this.resultado?.projecao[0]?.saldo || 0;
  }

  getSaldo7(): number {
    return this.resultado?.projecao[1]?.saldo || 0;
  }

  getSaldo15(): number {
    return this.resultado?.projecao[2]?.saldo || 0;
  }

  getSaldo30(): number {
    return this.resultado?.projecao[3]?.saldo || 0;
  }

  private updateChart(): void {
    if (!this.resultado?.fluxo) return;

    const labels = this.resultado.fluxo.map((f) => f.data);
    const data = this.resultado.fluxo.map((f) => f.saldo);
    const cor = data[data.length - 1] < 0 ? '#f56565' : '#48bb78';

    this.lineChartData = {
      labels,
      datasets: [
        {
          data,
          borderColor: cor,
          backgroundColor: cor + '20',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }

  getCorSaldo(saldo: number): string {
    return saldo >= 0 ? 'text-success' : 'text-danger';
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(val);
  }

  trackByIndex(index: number): number {
    return index;
  }

  exportToCSV() {
    if (!this.resultado?.fluxo) return;

    const rows = this.resultado.fluxo;

    const csvContent =
      'data,valor\n' + rows.map((r) => `${r.data},${r.valor}`).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'fluxo_caixa.csv';
    a.click();

    URL.revokeObjectURL(url);
  }
}
