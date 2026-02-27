import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// serviços e modelos necessários para carregar os dados da obra
import { ObrasService } from '../../core/services/obras.service';
import { EtapasService } from '../../core/services/etapas.service';
import { OcorrenciasService } from '../../core/services/ocorrencias.service';
import { CustosService } from '../../core/services/custos.service';
import { Obra, Etapa, Ocorrencia, Custo } from '../../core/models';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './relatorios.component.html',
  styleUrls: ['./relatorios.component.scss']
})
export class RelatoriosComponent implements OnInit {
  form: FormGroup;

  // dados carregados para o relatório
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
    private custosService: CustosService
  ) {
    // inicializa o formulário com controle para obra e as opções de inclusão
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
    // carrega a lista de obras existentes para seleção
    this.obrasService.getAll().subscribe(list => {
      this.obras = list;
    });

    // quando o usuário escolher uma obra, carregamos seus dados relacionados
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

  gerar() {
    const values = this.form.value;

    if (!values.obraId) {
      alert('Selecione uma obra antes de gerar o relatório.');
      return;
    }

    // estilos e marcação inicial
    const style = `
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin:0; padding:0; color:#1f2937; font-size:12px; }
        h1,h2,h3,h4,h5,h6 { margin:0; font-weight:600; color:#0f172a; }
        .header { background:#0f172a url('data:image/svg+xml;utf8,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></svg>') repeat; color:#fff; padding:20px 40px; display:flex; align-items:center; }
        .header img { height:40px; margin-right:15px; }
        .header-title { font-size:24px; letter-spacing:1px; }
        .divider-orange { border-top:2px solid #f97316; margin:8px 0 24px; }
        .section { padding:20px 40px; }
        .section h2 { font-size:18px; margin-bottom:12px; color:#0f172a; }
        .summary { display:flex; gap:16px; flex-wrap:wrap; }
        .card { background:#fff; border-radius:8px; padding:14px 18px; flex:1 1 180px; box-shadow:0 4px 8px rgba(0,0,0,.08); }
        .card .label { font-size:11px; color:#4b5563; text-transform:uppercase; letter-spacing:0.5px; }
        .card .value { font-size:16px; font-weight:700; margin-top:6px; color:#0f172a; }
        .progress-bar { background:#e5e7eb; border-radius:4px; overflow:hidden; height:8px; margin-top:4px; }
        .progress-bar-inner { height:100%; background:#f97316; }
        .etapa-cards { display:flex; gap:16px; }
        .etapa-card { background:#fff; border-radius:8px; padding:12px 16px; flex:1; box-shadow:0 4px 8px rgba(0,0,0,.08); }
        .etapa-status { font-size:12px; font-weight:600; margin-bottom:8px; display:flex; align-items:center; gap:4px; }
        .etapa-status .dot { width:10px; height:10px; border-radius:50%; display:inline-block; }
        .status-planejada { background:#6b7280; }
        .status-em_execucao { background:#0d9488; }
        .status-concluida { background:#15803d; }
        .status-nao_iniciada { background:#e11d48; }
        table { width:100%; border-collapse:collapse; margin-top:4px; font-size:12px; }
        table th, table td { border:1px solid #e5e7eb; padding:8px; }
        table th { background:#0f172a; color:#fff; }
        .total-row td { font-weight:700; }
        .total-value { color:#f97316; font-size:16px; }
        .bar-chart { width:100%; height:150px; }
        .footer { position:fixed; bottom:0; width:100%; font-size:10px; text-align:center; color:#6b7280; padding:8px 0; border-top:1px solid #e5e7eb; }
      </style>
    `;

    let content = `<!DOCTYPE html><html><head><meta charset="utf-8">${style}</head><body>`;

    // header
    content += `<div class="header"><img src="https://via.placeholder.com/120x40?text=ObraHub" alt="ObraHub"/><div class="header-title">RELATÓRIO DA OBRA</div></div>`;
    content += `<div class="divider-orange"></div>`;

    // resumo
    content += `<div class="section"><h2>Resumo da Obra</h2><div class="summary">${this.buildSummaryCards()}</div></div>`;

    if (values.andamento) { content += this.buildEtapasSection(); }
    if (values.financeiro) { content += this.buildCustosSection(); }
    if (values.problemas) { content += this.buildOcorrenciasSection(); }
    if (values.qualidade) { content += '<div class="section"><h2>Qualidade</h2><p>Dados de qualidade não disponíveis.</p></div>'; }

    content += `<div class="footer">Relatório gerado em: ${new Date().toLocaleDateString()} &nbsp;|&nbsp; Gerado por ObraHub &nbsp;|&nbsp; Página <span class="page"></span></div>`;
    content += `</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(content);
      w.document.close();
      setTimeout(() => w.print(), 500);
    } else {
      alert('Não foi possível abrir a janela para gerar o relatório.');
    }
  }

  private formatDate(date?: any): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
  }

  private buildSummaryCards(): string {
    if (!this.obraSelecionada) return '';
    const o = this.obraSelecionada;
    const cards = [];
    cards.push(`<div class="card"><div class="label">Status</div><div class="value">${o.status || 'N/A'}</div></div>`);
    // progresso com barra
    cards.push(`<div class="card"><div class="label">Progresso</div><div class="value">${o.progresso || 0}%</div>` +
               `<div class="progress-bar"><div class="progress-bar-inner" style="width:${o.progresso || 0}%"></div></div></div>`);
    cards.push(`<div class="card"><div class="label">Início</div><div class="value">${this.formatDate(o.dataInicio)}</div></div>`);
    cards.push(`<div class="card"><div class="label">Orçamento</div><div class="value">R$ ${o.orcamentoPrevisto || 0}</div></div>`);
    return cards.join('');
  }

  private buildCostChart(): string {
    if (!this.custos || this.custos.length === 0) return '';
    // aggregate by category
    const totals: { [cat: string]: number } = {};
    this.custos.forEach(c => {
      totals[c.categoria] = (totals[c.categoria] || 0) + c.valor;
    });
    const labels = Object.keys(totals);
    const values = labels.map(l => totals[l]);
    const max = Math.max(...values, 1);
    const barWidth = 20;
    const spacing = 10;
    const height = 150;
    let svg = `<svg width="${labels.length * (barWidth + spacing)}" height="${height}">`;
    labels.forEach((lbl, i) => {
      const h = (values[i] / max) * (height - 20);
      const x = i * (barWidth + spacing);
      svg += `<rect x="${x}" y="${height - h - 10}" width="${barWidth}" height="${h}" fill="#f97316" />`;
      svg += `<text x="${x + barWidth/2}" y="${height - 2}" font-size="10" text-anchor="middle">${lbl}</text>`;
    });
    svg += `</svg>`;
    return svg;
  }

  private buildEtapasSection(): string {
    let html = '<div class="section"><h2>Etapas</h2>';
    if (!this.etapas || this.etapas.length === 0) {
      html += '<p>Nenhuma etapa cadastrada.</p>';
    } else {
      html += '<div class="summary">';
      this.etapas.forEach(e => {
        const dotClass = `status-${e.status.replace(/\s+/g, '_')}`;
        html += `<div class="etapa-card">` +
                `<div class="etapa-status"><span class="dot ${dotClass}"></span>${e.nome}</div>` +
                `<div class="progress-bar"><div class="progress-bar-inner" style="width:${e.progresso || 0}%"></div></div>` +
                `<div class="label" style="margin-top:6px;">${e.progresso || 0}%</div>`;
        if (e.dataPrevista) {
          html += `<div class="label">Prevista: ${this.formatDate(e.dataPrevista)}</div>`;
        }
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  private buildCustosSection(): string {
    let html = '<div class="section"><h2>Custos</h2>';
    if (!this.custos || this.custos.length === 0) {
      html += '<p>Nenhum custo registrado.</p>';
    } else {
      // divider two columns: tabela + gráfico simples
      const chart = this.buildCostChart();
      html += '<div style="display:flex; gap:20px; align-items:flex-start;">';
      html += '<div style="flex:2;">';
      html += '<table><thead><tr><th>Categoria</th><th>Descrição</th><th>Data</th><th>Valor</th></tr></thead><tbody>';
      this.custos.forEach(c => {
        html += `<tr><td>${c.categoria}</td><td>${c.descricao}</td><td>${this.formatDate(c.data)}</td><td>R$ ${c.valor}</td></tr>`;
      });
      html += '</tbody></table>';
      const total = this.custos.reduce((s, c) => s + c.valor, 0);
      html += `<p class="total-row"><strong>Total:</strong> <span class="total-value">R$ ${total}</span></p>`;
      html += '</div>'; // end table column

      html += '<div style="flex:1;">';
      html += '<h3 style="margin-top:0;">Financeiro</h3>';
      html += chart;
      html += '</div>'; // end chart column

      html += '</div>'; // end flex container
    }
    html += '</div>';
    return html;
  }

  private buildOcorrenciasSection(): string {
    let html = '<div class="section"><h2>Ocorrências</h2>';
    if (!this.ocorrencias || this.ocorrencias.length === 0) {
      html += '<p>Nenhuma ocorrência registrada.</p>';
    } else {
      html += '<table><thead><tr><th>Data</th><th>Descrição</th><th>Clima</th><th>Equipe</th></tr></thead><tbody>';
      this.ocorrencias.forEach(o => {
        html += `<tr><td>${this.formatDate(o.data)}</td><td>${o.descricao}</td><td>${o.clima || ''}</td><td>${o.equipe || ''}</td></tr>`;
      });
      html += '</tbody></table>';
    }
    html += '</div>';
    return html;
  }
}
