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
import { Obra, Etapa, Custo } from '@models/index';

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
    previsaoFinal: 0,
    restante: 0,
    gastoPeriodo: 0,
    riscoDias: 14
  };

  serieEvolucaoGastos = [38, 42, 40, 46, 50, 48, 56, 54, 59, 64];
  serieOrcadoVsReal = [
    { mes: 'Set', orcado: 24000, real: 19000 },
    { mes: 'Out', orcado: 40000, real: 36500 },
    { mes: 'Nov', orcado: 80000, real: 62500 },
    { mes: 'Dez', orcado: 86000, real: 64000 },
    { mes: 'Jan', orcado: 96000, real: 91000 },
    { mes: 'Fev', orcado: 112000, real: 108000 }
  ];
  serieOrcadoVsRealAno = [
    { mes: 'Mar', orcado: 12000, real: 10000 },
    { mes: 'Abr', orcado: 18000, real: 15000 },
    { mes: 'Mai', orcado: 23000, real: 21000 },
    { mes: 'Jun', orcado: 32000, real: 29800 },
    { mes: 'Jul', orcado: 42000, real: 38400 },
    { mes: 'Ago', orcado: 52000, real: 48600 },
    { mes: 'Set', orcado: 62000, real: 59000 },
    { mes: 'Out', orcado: 76000, real: 71200 },
    { mes: 'Nov', orcado: 90000, real: 84500 },
    { mes: 'Dez', orcado: 100000, real: 93400 },
    { mes: 'Jan', orcado: 110000, real: 103000 },
    { mes: 'Fev', orcado: 120000, real: 112500 }
  ];

  diarioObra = [
    {
      dia: '12',
      mes: 'NOV',
      titulo: 'Instalação elétrica - 3º andar',
      tipo: 'ATIVIDADE',
      descricao: 'Passagem de eletrodutos e fixação de caixas.',
      detalhe: 'Equipe: 4 pessoas',
      hora: '08:30',
      imagem: ''
    },
    {
      dia: '12',
      mes: 'NOV',
      titulo: 'Concretagem da laje - Bloco B',
      tipo: 'ATIVIDADE',
      descricao: 'Concretagem da laje do 5º pavimento.',
      detalhe: 'Equipe: 6 pessoas',
      hora: '14:20',
      imagem: ''
    },
    {
      dia: '12',
      mes: 'NOV',
      titulo: 'Atraso no fornecimento de tijolos',
      tipo: 'OCORRÊNCIA',
      descricao: 'Fornecedor informou atraso na entrega programada.',
      detalhe: 'Impacto: Médio',
      hora: '16:45',
      imagem: ''
    }
  ];

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
  usuario: any = null;
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
      this.obrasAtrasadas = obras.filter((o: Obra) => o.status === 'Pausada').length;

      this.statusStats = {
        planejada: obras.filter((o: Obra) => o.status === 'Planejada').length,
        em_execucao: obras.filter((o: Obra) => o.status === 'Execucao').length,
        pausada: obras.filter((o: Obra) => o.status === 'Pausada').length,
        concluida: obras.filter((o: Obra) => o.status === 'Concluida').length
      };

      this.resumoFinanceiro.orcamentoTotal = obras.reduce((sum, obra) => sum + (obra.orcamentoPrevisto || 0), 0);
      this.atualizarResumoFinanceiro();

      if (obras.length > 0) {
        this.obraSelecionada = obras[0].name;
        this.selectedObraId = obras[0].id;
        this.carregarChecklists(this.selectedObraId);
      }

      this.carregarMovimentacoes();
    });

    this.etapasService.getAll().subscribe((etapas: Etapa[]) => {
      this.etapas = etapas;
      if (etapas.length > 0) {
        const mediaProgresso = etapas.reduce((sum: number, e: Etapa) => sum + e.progresso, 0) / etapas.length;
        this.progressoMedio = Math.round(mediaProgresso);
      }
    });

    this.carregarMateriais();
  }

  get equipeAtiva(): number {
    return 0;
  }

  get atividadesConcluidas(): number {
    return 0;
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
      this.resumoFinanceiro.gastoAtual = 0;
      this.resumoFinanceiro.restante = this.resumoFinanceiro.orcamentoTotal - this.resumoFinanceiro.gastoAtual;
      this.consumoPercentual = 0;
      this.materiaisSaidasCount = 0;
      return;
    }

    const requests = this.obras.map((obra) =>
      this.movimentacoesService.getAll(obra.id).pipe(catchError(() => of([])))
    );

    forkJoin(requests).subscribe((movimentacoesArray) => {
      const movimentacoes = movimentacoesArray.flat();
      const saidas = movimentacoes.filter((m) => m.tipo === 'saida');
      this.materiaisSaidasCount = saidas.length;
      this.resumoFinanceiro.gastoAtual = saidas.reduce(
        (sum, mov) => sum + ((mov.valor_total ?? (mov.quantidade * mov.valor_unitario)) || 0),
        0
      );
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
    this.resumoFinanceiro.previsaoFinal = Math.round(this.resumoFinanceiro.gastoAtual * 1.337);
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
    const max = Math.max(...this.serieEvolucaoGastos);
    return this.serieEvolucaoGastos
      .map((valor, i) => {
        const x = (i / (this.serieEvolucaoGastos.length - 1)) * largura;
        const y = altura - (valor / max) * (altura - 8);
        return `${x},${y}`;
      })
      .join(' ');
  }

  get serieOrcadoVsRealExibida(): { mes: string; orcado: number; real: number }[] {
    return this.periodoGrafico === '1a' ? this.serieOrcadoVsRealAno : this.serieOrcadoVsReal;
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
