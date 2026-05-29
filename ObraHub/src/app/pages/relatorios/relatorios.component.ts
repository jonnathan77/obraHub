import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

// serviços e modelos necessários para carregar os dados da obra
import { ObrasService } from '../../core/services/obras.service';
import { EtapasService } from '../../core/services/etapas.service';
import { OcorrenciasService } from '../../core/services/ocorrencias.service';
import { CustosService } from '../../core/services/custos.service';
import { Obra, Etapa, Ocorrencia, Custo } from '../../core/models';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './relatorios.component.html',
  styleUrls: ['./relatorios.component.scss']
})
export class RelatoriosComponent implements OnInit {
  form: FormGroup;
  reportType: 'fisico-financeiro' | 'previsao-ia' | 'completo' = 'fisico-financeiro';
  loadingReport = false;
  reportError = '';
  iaPreview = '';

  obras: Obra[] = [];
  obraSelecionada: Obra | null = null;
  etapas: Etapa[] = [];
  ocorrencias: Ocorrencia[] = [];
  custos: Custo[] = [];

  constructor(
    private fb: FormBuilder,
    private obrasService: ObrasService,
    private etapasService: EtapasService,
    private ocorrenciasService: OcorrenciasService,
    private custosService: CustosService,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      obraId: [''],
      andamento: [true],
      financeiro: [true],
      problemas: [false],
      qualidade: [false],
      formato: ['pdf'],
      email: ['']
    });
  }

  ngOnInit(): void {
    this.obrasService.getAll().subscribe(list => {
      this.obras = list;
    });

    this.form.get('obraId')?.valueChanges.subscribe((id: string) => {
      if (id) {
        this.carregarDadosDaObra(id);
      } else {
        this.obraSelecionada = null;
        this.etapas = [];
        this.ocorrencias = [];
        this.custos = [];
      }
    });
  }

  carregarDadosDaObra(id: string): void {
    this.obrasService.getById(id).subscribe(o => (this.obraSelecionada = o));
    this.etapasService.getByObraId(id).subscribe(e => (this.etapas = e));
    this.ocorrenciasService.getByObraId(id).subscribe(o => (this.ocorrencias = o));
    this.custosService.getByObraId(id).subscribe(c => (this.custos = c));
  }

  selecionarTipo(tipo: 'fisico-financeiro' | 'previsao-ia' | 'completo'): void {
    this.reportType = tipo;
    this.reportError = '';
  }

  gerar(): void {
    const values = this.form.value;
    if (!values.obraId) {
      this.reportError = 'Selecione uma obra antes de gerar o relatório.';
      return;
    }
    if (!this.obraSelecionada) {
      this.reportError = 'Obra não encontrada. Selecione novamente.';
      return;
    }

    this.reportError = '';
    this.loadingReport = true;

    const gerarRelatorio = () => {
      const style = this.buildReportStyle();
      const documentHtml = this.buildReportDocument(style, values);
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(documentHtml);
        w.document.close();
        setTimeout(() => w.print(), 600);
      } else {
        this.reportError = 'Falha ao abrir a janela de impressão. Verifique seu bloqueador de popups.';
      }
      this.loadingReport = false;
    };

    if (this.reportType === 'previsao-ia') {
      this.http
        .post<any>('/api/ai/previsao-custos', {
          obra: this.obraSelecionada,
          itens: this.custos,
        })
        .subscribe({
          next: (resp) => {
            this.iaPreview = this.parseIaResponse(resp);
            gerarRelatorio();
          },
          error: () => {
            this.iaPreview = 'Não foi possível obter a previsão por IA. O relatório será gerado com os dados disponíveis.';
            gerarRelatorio();
          }
        });
    } else {
      gerarRelatorio();
    }
  }

  private buildReportStyle(): string {
    return `
      <style>
        body { margin:0; padding:0; font-family:'Inter', 'Helvetica Neue', Arial, sans-serif; color:#0f172a; background:#f8fafc; }
        .page { width: 100%; padding: 0; margin: 0; }
        .container { max-width: 1120px; margin: 0 auto; padding: 24px 28px; }
        .header { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; background:#0f172a; color:#fff; padding:24px 28px; border-radius:20px; }
        .title { font-size:28px; letter-spacing:0.02em; margin:0; }
        .meta { font-size:13px; color:rgba(255,255,255,0.75); margin-top:8px; }
        .section { margin-top:26px; padding:24px 28px; background:#ffffff; border-radius:20px; box-shadow:0 14px 42px rgba(15,23,42,0.08); }
        .section h2 { margin:0 0 16px; font-size:19px; color:#111827; }
        .card-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:18px; }
        .card { padding:18px 20px; border-radius:16px; background:#f8fafc; border:1px solid #e2e8f0; }
        .label { display:block; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#6b7280; margin-bottom:10px; }
        .value { font-size:18px; font-weight:700; color:#0f172a; }
        .small-text { font-size:13px; color:#475569; margin-top:10px; }
        .progress { background:#e5e7eb; border-radius:999px; height:12px; overflow:hidden; margin-top:12px; }
        .progress-inner { height:100%; background:#2563eb; }
        .table { width:100%; border-collapse:collapse; margin-top:14px; }
        .table th, .table td { padding:12px 14px; border:1px solid #e2e8f0; text-align:left; font-size:13px; }
        .table th { background:#eff6ff; color:#0f172a; }
        .compact-row { font-size:12px; color:#475569; }
        .note { padding:16px 18px; background:#eff6ff; border-radius:14px; color:#1d4ed8; margin-top:16px; }
        .footer { margin-top:28px; font-size:11px; color:#6b7280; text-align:center; }
        .badge { display:inline-flex; align-items:center; gap:8px; margin-top:8px; padding:8px 12px; border-radius:999px; background:rgba(59,130,246,0.12); color:#1d4ed8; font-size:12px; }
        @media print { .page { padding:0; } .container { box-shadow:none; } .header, .section { box-shadow:none; border:none; } }
      </style>
    `;
  }

  private buildReportDocument(style: string, values: any): string {
    const obra = this.obraSelecionada!;
    const resumo = this.buildSummaryCards();
    const etapas = values.andamento ? this.buildEtapasSection() : '';
    const custos = values.financeiro ? this.buildCustosSection() : '';
    const ocorrencias = values.problemas ? this.buildOcorrenciasSection() : '';
    const ia = this.reportType === 'previsao-ia' ? this.buildIaSection() : '';
    const completo = this.reportType === 'completo' ? this.buildCompletoSection() : '';

    return `<!DOCTYPE html><html><head><meta charset="utf-8">${style}</head><body><div class="page"><div class="container"><div class="header"><div><h1 class="title">Relatório de Obra</h1><div class="meta">Obra: ${obra.name} • Status: ${obra.status} • Gerado em ${new Date().toLocaleDateString()}</div></div><div class="badge">${this.reportType === 'fisico-financeiro' ? 'Andamento Físico-Financeiro' : this.reportType === 'previsao-ia' ? 'Previsão com IA' : 'Relatório Completo'}</div></div>${resumo}${etapas}${custos}${ocorrencias}${ia}${completo}<div class="footer">ObraHub • Relatório gerado automaticamente • Página 1</div></div></div></body></html>`;
  }

  private parseIaResponse(resp: any): string {
    if (resp?.data && typeof resp.data === 'object') {
      return JSON.stringify(resp.data, null, 2);
    }
    return String(resp?.raw || resp?.texto || resp || 'Sem conteúdo da IA.');
  }

  private buildSummaryCards(): string {
    if (!this.obraSelecionada) return '';
    const o = this.obraSelecionada;
    const orcamento = o.orcamentoPrevisto ?? o.orcamentoTotal ?? 0;
    const progresso = o.progresso ?? 0;
    return `<div class="section"><h2>Visão Geral da Obra</h2><div class="card-grid"><div class="card"><span class="label">Início previsto</span><div class="value">${this.formatDate(o.dataInicio)}</div></div><div class="card"><span class="label">Status</span><div class="value">${o.status}</div></div><div class="card"><span class="label">Orçamento</span><div class="value">R$ ${orcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></div><div class="card"><span class="label">Progresso</span><div class="value">${progresso}%</div><div class="progress"><div class="progress-inner" style="width:${progresso}%"></div></div></div></div></div>`;
  }

  private buildIaSection(): string {
    return `<div class="section"><h2>Previsão de Custos com IA</h2><p class="note">${this.iaPreview}</p></div>`;
  }

  private buildCompletoSection(): string {
    let html = '<div class="section"><h2>Resumo Completo</h2><p class="small-text">Este relatório reúne andamento, finanças, ocorrências e informações de qualidade em um único documento.</p>';
    html += this.buildEtapasSection();
    html += this.buildCustosSection();
    html += this.buildOcorrenciasSection();
    html += '</div>';
    return html;
  }

  private buildCostChart(): string {
    if (!this.custos || this.custos.length === 0) return '';
    const totals: { [cat: string]: number } = {};
    this.custos.forEach(c => {
      const categoria = c.categoria ?? 'Sem categoria';
      totals[categoria] = (totals[categoria] ?? 0) + (c.valor || 0);
    });
    const labels = Object.keys(totals);
    const values = labels.map((label) => totals[label]);
    const max = Math.max(...values, 1);
    const bars = labels.map((label, index) => {
      const height = Math.round((values[index] / max) * 100);
      return `<div style="display:inline-block; width:18%; margin-right:4%; text-align:center;"><div style="height:120px; background:#2563eb; width:100%; border-radius:12px 12px 0 0; margin-bottom:10px; transform: translateY(${120 - height}px);"></div><div style="font-size:11px; color:#475569;">${label}</div></div>`;
    }).join('');
    return `<div style="margin-top:18px; display:flex; justify-content:flex-start; gap:18px; flex-wrap:wrap;">${bars}</div>`;
  }

  private buildEtapasSection(): string {
    let html = '<div class="section"><h2>Andamento de Etapas</h2>';
    if (!this.etapas || this.etapas.length === 0) {
      html += '<p class="small-text">Nenhuma etapa cadastrada.</p>';
    } else {
      html += '<div class="card-grid">';
      this.etapas.forEach(e => {
        html += `<div class="card"><span class="label">${e.nome}</span><div class="value">${e.progresso || 0}%</div><div class="progress"><div class="progress-inner" style="width:${e.progresso || 0}%"></div></div><div class="small-text">${this.formatDate(e.dataPrevista)}</div></div>`;
      });
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  private buildCustosSection(): string {
    let html = '<div class="section"><h2>Resumo Financeiro</h2>';
    if (!this.custos || this.custos.length === 0) {
      html += '<p class="small-text">Nenhum custo registrado.</p>';
    } else {
      html += '<table class="table"><thead><tr><th>Categoria</th><th>Descrição</th><th>Data</th><th>Valor</th></tr></thead><tbody>';
      this.custos.forEach(c => {
        html += `<tr><td>${c.categoria}</td><td>${c.descricao}</td><td>${this.formatDate(c.data)}</td><td>R$ ${c.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>`;
      });
      const total = this.custos.reduce((acc, item) => acc + (item.valor || 0), 0);
      html += `</tbody></table><p class="small-text"><strong>Total de custos:</strong> R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>`;
    }
    html += '</div>';
    return html;
  }

  private buildOcorrenciasSection(): string {
    let html = '<div class="section"><h2>Ocorrências</h2>';
    if (!this.ocorrencias || this.ocorrencias.length === 0) {
      html += '<p class="small-text">Nenhuma ocorrência registrada.</p>';
    } else {
      html += '<table class="table"><thead><tr><th>Data</th><th>Descrição</th><th>Clima</th><th>Equipe</th></tr></thead><tbody>';
      this.ocorrencias.forEach(o => {
        html += `<tr><td>${this.formatDate(o.data)}</td><td>${o.descricao}</td><td>${o.clima || '-'}</td><td>${o.equipe || '-'}</td></tr>`;
      });
      html += '</tbody></table>';
    }
    html += '</div>';
    return html;
  }

  private formatDate(date?: any): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
  }
}
