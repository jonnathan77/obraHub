import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ObrasService } from '@services/obras.service';
import { EtapasService } from '@services/etapas.service';
import { CustosService } from '@services/custos.service';
import { MateriaisService } from '@services/materiais.service';
import { MovimentacoesService } from '@services/movimentacoes.service';
import { AtividadesService } from '@services/atividades.service';
import { CreateObraComponent } from '../components/create-obra/create-obra.component';
import { Obra, Etapa, Custo, Movimentacao } from '@models/index';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateObraComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  obrasAtivas = 0;
  obrasAtrasadas = 0;
  progressoMedio = 0;
  custosTotal = 0;
  consumoPercentual = 0;

  obras: Obra[] = [];  
  etapas: Etapa[] = [];
  custos: Custo[] = [];

  materialsCount = 0;
  materiaisSaidasCount = 0;
  checklistsPendentes = 0;
  checklistsConcluidos = 0;
  selectedObraId: string | null = null;
  modalNovaObraOpen = false;

  obraSelecionada = 'Selecione uma obra';
  obrasDropdownOpen = false;
  periodoGrafico: '6m' | '1a' = '6m';
  obrasDisponiveis: Obra[] = [];

  resumoFinanceiro = {
    orcamentoTotal: 0,
    gastoAtual: 0,
    restante: 0,
    gastoPeriodo: 0
  };

  serieEvolucaoGastos: number[] = [];
  movimentacoes: Movimentacao[] = [];

  acoesRapidas = [
    { icone: 'bi-cash-coin', titulo: 'Lançar gasto', subtitulo: 'Registrar novo gasto' },
    { icone: 'bi-box-arrow-in-down', titulo: 'Entrada de material', subtitulo: 'Registrar entrada' },
    { icone: 'bi-box-arrow-up', titulo: 'Saída de material', subtitulo: 'Registrar saída' },
    { icone: 'bi-check2-square', titulo: 'Checklist', subtitulo: 'Verificar atividades' },
    { icone: 'bi-exclamation-triangle', titulo: 'Nova ocorrência', subtitulo: 'Registrar ocorrência' },
    { icone: 'bi-camera', titulo: 'Adicionar foto', subtitulo: 'Do diário da obra' }
  ];

  statusStats = {
    planejada: 0,
    em_execucao: 0,
    pausada: 0,
    concluida: 0
  };
  nomeUsuario = '';

  constructor(
    private obrasService: ObrasService,
    private etapasService: EtapasService,
    private custosService: CustosService,
    private materiaisService: MateriaisService,
    private movimentacoesService: MovimentacoesService,
    private atividadesService: AtividadesService,
  ) { }

  ngOnInit(): void {
    this.carregarUsuario();
    this.carregarDados();
  }

  carregarUsuario(): void {
    const userString = localStorage.getItem('obrahub_user');

    if (userString) {
      const user = JSON.parse(userString);
      const nome = user.nome;
      this.nomeUsuario = nome;
    }
  }

  carregarDados(): void {
    this.obrasService.getAll().subscribe((obras: Obra[]) => {
      this.obras = obras;
      this.obrasDisponiveis = obras;
      this.obrasAtivas = obras.filter((o: Obra) => o.status === 'Execucao').length;
      this.obrasAtrasadas = obras.filter((o: Obra) =>
        o.status !== 'Concluida' && !!o.dataFimPrevista &&
        new Date(o.dataFimPrevista).getTime() < new Date().setHours(0, 0, 0, 0)
      ).length;

      this.statusStats = {
        planejada: obras.filter((o: Obra) => o.status === 'Planejada').length,
        em_execucao: obras.filter((o: Obra) => o.status === 'Execucao').length,
        pausada: obras.filter((o: Obra) => o.status === 'Pausada').length,
        concluida: obras.filter((o: Obra) => o.status === 'Concluida').length
      };

      if (obras.length > 0) {
        this.obraSelecionada = obras[0].name;
        this.selectedObraId = obras[0].id;
        this.carregarChecklists(this.selectedObraId);
      }

      this.carregarMovimentacoes();
      this.progressoMedio = obras.length
        ? Math.round(obras.reduce((sum, obra) => sum + (Number(obra.progresso) || 0), 0) / obras.length)
        : 0;
    });

    this.etapasService.getAll().subscribe((etapas: Etapa[]) => {
      this.etapas = etapas;
      if (etapas.length > 0 && !this.obras.length) {
        const mediaProgresso = etapas.reduce((sum: number, e: Etapa) => sum + e.progresso, 0) / etapas.length;
        this.progressoMedio = Math.round(mediaProgresso);
      }
    });

    this.carregarMateriais();
  }

  get equipeAtiva(): string { return '—'; }
  get atividadesConcluidas(): string { return '—'; }

  get obraAtual(): Obra | undefined {
    return this.obras.find(obra => obra.id === this.selectedObraId);
  }

  get alertaFinanceiro(): string {
    if (!this.resumoFinanceiro.orcamentoTotal) return 'Orçamento não informado';
    const progresso = Number(this.obraAtual?.progresso) || 0;
    return this.consumoPercentual - progresso > 10
      ? 'Compras acima do progresso físico: investigue este sinal'
      : 'Sem diferença relevante entre compras e progresso físico';
  }

  get serieOrcadoVsRealExibida(): { mes: string; real: number }[] {
    const quantidadeMeses = this.periodoGrafico === '1a' ? 12 : 6;
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - quantidadeMeses + 1, 1);
    return Array.from({ length: quantidadeMeses }, (_, index) => {
      const data = new Date(inicio.getFullYear(), inicio.getMonth() + index, 1);
      const real = this.movimentacoes
        .filter(m => {
          const movimentoData = new Date(`${m.data_movimentacao}T00:00:00`);
          return m.tipo === 'entrada' &&
            movimentoData.getFullYear() === data.getFullYear() &&
            movimentoData.getMonth() === data.getMonth();
        })
        .reduce((total, m) => total + (Number(m.valor_total ?? (m.quantidade * m.valor_unitario)) || 0), 0);
      return { mes: data.toLocaleDateString('pt-BR', { month: 'short' }), real };
    });
  }

  alturaBarra(valor: number): number {
    const maximo = Math.max(1, ...this.serieOrcadoVsRealExibida.map(item => item.real));
    return Math.max(2, (valor / maximo) * 100);
  }

  get diarioObra(): { dia: string; mes: string; titulo: string; tipo: string; descricao: string; detalhe: string; hora: string; imagem: string }[] {
    return [...this.movimentacoes]
      .sort((a, b) => new Date(b.data_movimentacao).getTime() - new Date(a.data_movimentacao).getTime())
      .slice(0, 5)
      .map(m => {
        const data = new Date(`${m.data_movimentacao}T00:00:00`);
        const valor = Number(m.valor_total ?? (m.quantidade * m.valor_unitario)) || 0;
        return {
          dia: String(data.getDate()).padStart(2, '0'),
          mes: data.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
          titulo: `${m.tipo === 'entrada' ? 'Entrada' : 'Saída'}: ${m.material_nome || 'Material'}`,
          tipo: 'MATERIAL',
          descricao: `${m.quantidade} ${m.material_unidade || ''}`.trim(),
          detalhe: `Valor: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          hora: '',
          imagem: ''
        };
      });
  }

  get obrasEmExecucao(): number {
    return this.obrasAtivas || 0;
  }

  get obrasAtrasadasResumo(): number {
    return this.obrasAtrasadas || 0;
  }

  carregarMateriais(): void {
    this.materiaisService.getAll().subscribe((materiais) => {
      this.materialsCount = materiais.length;
    });
  }

  carregarMovimentacoes(): void {
    if (!this.obras.length) {
      this.movimentacoes = [];
      this.resumoFinanceiro.orcamentoTotal = 0;
      this.resumoFinanceiro.gastoAtual = 0;
      this.resumoFinanceiro.restante = this.resumoFinanceiro.orcamentoTotal - this.resumoFinanceiro.gastoAtual;
      this.consumoPercentual = 0;
      this.materiaisSaidasCount = 0;
      return;
    }

    const obrasSelecionadas = this.obraAtual ? [this.obraAtual] : this.obras;
    this.resumoFinanceiro.orcamentoTotal = obrasSelecionadas.reduce(
      (total, obra) => total + (Number(obra.orcamentoPrevisto) || 0), 0
    );
    const requests = obrasSelecionadas.map((obra) =>
      this.movimentacoesService.getAll(obra.id).pipe(catchError(() => of([])))
    );

    forkJoin(requests).subscribe((movimentacoesArray) => {
      const movimentacoes = movimentacoesArray.flat();
      this.movimentacoes = movimentacoes;
      const saidas = movimentacoes.filter((m) => m.tipo === 'saida');
      const compras = movimentacoes.filter((m) => m.tipo === 'entrada');
      this.materiaisSaidasCount = saidas.length;
      this.resumoFinanceiro.gastoAtual = compras.reduce(
        (sum, mov) => sum + ((mov.valor_total ?? (mov.quantidade * mov.valor_unitario)) || 0),
        0
      );
      this.serieEvolucaoGastos = this.serieOrcadoVsRealExibida.map(item => item.real);
      this.resumoFinanceiro.gastoPeriodo = this.serieEvolucaoGastos.reduce((total, value) => total + value, 0);
      this.atualizarResumoFinanceiro();
    });
  }

  carregarChecklists(obraId: string): void {
    this.atividadesService.getByObraId(Number(obraId)).subscribe((atividades) => {
      this.checklistsPendentes = atividades.filter((a) => a.status === 'pendente').length;
      this.checklistsConcluidos = atividades.filter((a) => a.status === 'concluido').length;
    });
  }

  atualizarResumoFinanceiro(): void {
    this.resumoFinanceiro.restante = this.resumoFinanceiro.orcamentoTotal - this.resumoFinanceiro.gastoAtual;
    this.consumoPercentual = this.resumoFinanceiro.orcamentoTotal
      ? Math.round((this.resumoFinanceiro.gastoAtual / this.resumoFinanceiro.orcamentoTotal) * 100)
      : 0;
  }

  get pontosEvolucaoGastos(): string {
    if (!this.serieEvolucaoGastos.length) {
      return '';
    }
    const largura = 240;
    const altura = 78;
    const max = Math.max(1, ...this.serieEvolucaoGastos);
    return this.serieEvolucaoGastos
      .map((valor, i) => {
        const x = (i / (this.serieEvolucaoGastos.length - 1)) * largura;
        const y = altura - (valor / max) * (altura - 8);
        return `${x},${y}`;
      })
      .join(' ');
  }

  toggleObrasDropdown(): void {
    this.obrasDropdownOpen = !this.obrasDropdownOpen;
    this.logDashboardAction('toggle_obra_dropdown', { aberto: this.obrasDropdownOpen });
  }

  selecionarObra(obra: Obra): void {
    this.obraSelecionada = obra.name;
    this.selectedObraId = obra.id;
    this.obrasDropdownOpen = false;
    this.carregarChecklists(obra.id);
    this.carregarMovimentacoes();
    this.logDashboardAction('selecionar_obra', { obra: obra.name, id: obra.id });
  }

  openNovaObraModal(): void {
    this.modalNovaObraOpen = true;
  }

  handleCreateObra(data: any): void {
    this.obrasService.create(data).subscribe(() => {
      this.modalNovaObraOpen = false;
      this.carregarDados();
    });
  }

  alterarPeriodoGrafico(periodo: '6m' | '1a'): void {
    this.periodoGrafico = periodo;
    this.logDashboardAction('alterar_periodo_grafico', { periodo });
  }

  onAcaoRapidaClick(acao: { titulo: string }): void {
    this.logDashboardAction('acao_rapida', { acao: acao.titulo });
  }

  onBotaoClick(botao: string): void {
    if (botao === 'nova_obra') {
      this.openNovaObraModal();
      return;
    }
    this.logDashboardAction('botao_dashboard', { botao });
  }

  private logDashboardAction(evento: string, payload?: unknown): void {
    console.log('[Dashboard]', evento, payload ?? '');
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
