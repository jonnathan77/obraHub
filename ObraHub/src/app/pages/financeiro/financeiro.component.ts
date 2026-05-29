import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ChartConfiguration, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { ObrasService } from '../../core/services/obras.service';
import { CustosService } from '../../core/services/custos.service';
import { Obra, Custo } from '../../core/models';
import { environment } from '../../../environments/environment';
import { AuthService } from './../../core/services/auth.service';

const API = environment.apiUrl;

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

interface IaPrevisao {
  resumoExecutivo: string;
  analiseDesvios: string;
  previsaoCustosFinais: string;
  riscosPrincipais: string;
  recomendacoesPrioritarias: string;
  raw?: string;
}

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule, NgChartsModule],
  templateUrl: './financeiro.component.html',
  styleUrls: ['./financeiro.component.scss'],
})
export class FinanceiroComponent implements OnInit {
  activeTab: 'dados' | 'planilha' = 'dados';
  obras: Obra[] = [];
  selectedObraId = '';
  obraSelecionada: Obra | null = null;
  custos: Custo[] = [];
  orcamentoPrevisto = 0;
  gastoRealizado = 0;
  saldoDisponivel = 0;
  percentualExecutado = 0;

  fileName = '';
  loading = false;
  sampleLoading = false;
  resultado: Resultado | null = null;
  erro = '';
  iaLoading = false;
  iaError = '';
  iaResult: IaPrevisao | null = null;
  dragOver = false;

  public lineChartData: ChartConfiguration<'line'>['data'] = { datasets: [] };
  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          display: true,
        },
        border: { display: false },
      },
      x: { grid: { display: false } },
    },
    plugins: { legend: { display: false } },
    elements: { point: { radius: 0 } },
  };
  public lineChartType: ChartType = 'line';

  constructor(
    private http: HttpClient,
    private obrasService: ObrasService,
    private custosService: CustosService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.obrasService.getAll().subscribe((list) => {
      this.obras = list;
      if (list.length) {
        this.selectedObraId = list[0].id;
        this.onObraChange(this.selectedObraId);
      }
    });
    const token = this.auth.getToken();

  }

  onObraChange(obraId: string): void {
    this.selectedObraId = obraId;
    this.iaResult = null;
    this.iaError = '';
    this.resultado = null;
    this.erro = '';
    this.custos = [];
    this.obraSelecionada = this.obras.find((obra) => obra.id === obraId) || null;
    if (this.obraSelecionada) {
      this.custosService.getByObraId(obraId).subscribe((custos) => {
        this.custos = custos;
        this.calculateKpis();
      });
    } else {
      this.resetKpis();
    }
  }

  private resetKpis(): void {
    this.orcamentoPrevisto = 0;
    this.gastoRealizado = 0;
    this.saldoDisponivel = 0;
    this.percentualExecutado = 0;
  }

  private calculateKpis(): void {
    this.orcamentoPrevisto =
      this.obraSelecionada?.orcamentoPrevisto ?? this.obraSelecionada?.orcamentoTotal ?? 0;
    this.gastoRealizado = this.custos.reduce((sum, item) => sum + (item.valor || 0), 0);
    this.saldoDisponivel = this.orcamentoPrevisto - this.gastoRealizado;
    this.percentualExecutado =
      this.obraSelecionada?.progresso ??
      (this.orcamentoPrevisto > 0
        ? Math.min(100, Math.round((this.gastoRealizado / this.orcamentoPrevisto) * 100))
        : 0);
  }

  gerarPrevisaoIa(): void {
    if (!this.obraSelecionada) {
      this.iaError = 'Selecione uma obra para gerar previsão com IA.';
      return;
    }

    this.iaLoading = true;
    this.iaError = '';
    this.iaResult = null;

    this.http
      .post<any>('/api/ai/previsao-custos', {
        obra: this.obraSelecionada,
        itens: this.custos,
      })
      .subscribe({
        next: (resp) => {
          this.iaResult = this.parseIaResponse(resp);
          this.iaLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.iaError =
            err.error?.error ||
            'Falha ao gerar previsão. Tente novamente em alguns instantes.';
          this.iaLoading = false;
        },
      });
  }

  private parseIaResponse(resp: any): IaPrevisao {
    const result: IaPrevisao = {
      resumoExecutivo: '',
      analiseDesvios: '',
      previsaoCustosFinais: '',
      riscosPrincipais: '',
      recomendacoesPrioritarias: '',
      raw: '',
    };

    if (resp?.data && typeof resp.data === 'object') {
      result.resumoExecutivo =
        resp.data.resumoExecutivo || resp.data.resumo || resp.data.summary || '';
      result.analiseDesvios = resp.data.analiseDesvios || resp.data.desvios || '';
      result.previsaoCustosFinais =
        resp.data.previsaoCustosFinais || resp.data.previsao || '';
      result.riscosPrincipais = resp.data.riscosPrincipais || resp.data.riscos || '';
      result.recomendacoesPrioritarias =
        resp.data.recomendacoesPrioritarias || resp.data.recomendacoes || '';
      result.raw = JSON.stringify(resp.data, null, 2);
      return result;
    }

    const text = String(resp?.raw || resp?.texto || resp || '');
    result.raw = text;

    const headings = [
      'Resumo Executivo',
      'Análise de Desvios',
      'Previsão de Custos Finais',
      'Riscos Principais',
      'Recomendações Prioritárias',
    ];

    headings.forEach((heading, index) => {
      const regex = new RegExp(`${heading}[:\n\r]+([\s\S]*?)(?=(?:${headings
        .slice(index + 1)
        .join('|')})|$)`, 'i');
      const match = regex.exec(text);
      if (match && match[1]) {
        const section = match[1].trim();
        switch (heading) {
          case 'Resumo Executivo':
            result.resumoExecutivo = section;
            break;
          case 'Análise de Desvios':
            result.analiseDesvios = section;
            break;
          case 'Previsão de Custos Finais':
            result.previsaoCustosFinais = section;
            break;
          case 'Riscos Principais':
            result.riscosPrincipais = section;
            break;
          case 'Recomendações Prioritárias':
            result.recomendacoesPrioritarias = section;
            break;
        }
      }
    });

    return result;
  }

  private headers() {
    const token = this.auth.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : '',
      }),
    };
  }
  
uploadFile(file: File): void {
  this.loading = true;
  this.erro = '';

  const formData = new FormData();
  formData.append('planilha', file);

  const token = this.auth.getToken();

  // Log para debug (remova depois)
  console.log('Enviando upload - Token existe?', !!token);

  this.http.post<Resultado>(`${API}/api/financeiro/upload`, formData, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    // Importante: não definir Content-Type manualmente com FormData
  }).subscribe({
    next: (data: Resultado) => {
      console.log('Upload realizado com sucesso:', data);
      this.resultado = data;
      this.updateChart();
      this.loading = false;
    },
    error: (err: HttpErrorResponse) => {
      console.error('Erro completo no upload:', err);
      this.erro = err.error?.error || err.error?.message || 'Erro ao processar planilha. Verifique se está logado.';
      this.loading = false;
    },
  });
}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
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
