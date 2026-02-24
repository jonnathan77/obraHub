import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ObrasService } from '../../core/services/obras.service';
import { EtapasService } from '../../core/services/etapas.service';
import { OcorrenciasService } from '../../core/services/ocorrencias.service';
import { CustosService } from '../../core/services/custos.service';
import { Obra, Etapa, Ocorrencia, Custo } from '../../core/models';
import { ListaEtapasComponent } from '../etapas-obra/etapas-obra.component';
import { ListaOcorrenciasComponent } from '../ocorrencias-obra/ocorrencias-obra.component';
import { ListaFotosComponent } from '../fotos-obra/fotos-obra.component';
import { ListaCustosComponent } from '../custos-obra/custos-obra.component';

@Component({
  selector: 'app-detalhe-obra',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ListaEtapasComponent,
    ListaOcorrenciasComponent,
    ListaFotosComponent,
    ListaCustosComponent
  ],
  templateUrl: './detalhe-obra.component.html',
  styleUrls: ['./detalhe-obra.component.scss']
})
export class DetalheObraComponent implements OnInit {
  obra: Obra | null = null;
  obraEditavel: Obra | null = null;
  etapas: Etapa[] = [];
  ocorrencias: Ocorrencia[] = [];
  custos: Custo[] = [];
  abaSelecionada = 'resumo';
  loading = true;
  obraId = '';
  modoEdicao = false;
  salvando = false;

  constructor(
    private route: ActivatedRoute,
    private obrasService: ObrasService,
    private etapasService: EtapasService,
    private ocorrenciasService: OcorrenciasService,
    private custosService: CustosService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.obraId = params['id'];
      this.carregarDados();
    });
  }

  carregarDados(): void {
    this.loading = true;
    
    this.obrasService.getById(this.obraId).subscribe(obra => {
      this.obra = obra || null;
      this.loading = false;

      console.log('Obra carregada:', obra);
    });

    this.etapasService.getByObraId(this.obraId).subscribe(etapas => {
      this.etapas = etapas;
    });

    this.ocorrenciasService.getByObraId(this.obraId).subscribe(ocorrencias => {
      this.ocorrencias = ocorrencias;
    });

    this.custosService.getByObraId(this.obraId).subscribe(custos => {
      this.custos = custos;
    });

  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'planejada': '#6c757d',
      'em_execucao': '#0d6efd',
      'pausada': '#ffc107',
      'concluida': '#198754'
    };
    return colors[status] || '#6c757d';
  }

  calcularProgresso(): number {
    // Usa a variável progresso da obra armazenada no banco de dados
    // O progresso é atualizado a cada atividade realizada
    if (!this.obra) return 0;
    return this.obra.progresso || 0;
  }

  calcularCustoTotal(): number {
    return this.custos.reduce((sum, c) => sum + c.valor, 0);
  }

  voltarParaLista(): void {
  }

  abrirEdicao(): void {
    if (this.obra) {
      this.obraEditavel = { ...this.obra };
      this.modoEdicao = true;
    }
  }

  cancelarEdicao(): void {
    this.modoEdicao = false;
    this.obraEditavel = null;
  }

  salvarEdicao(): void {
    if (!this.obraEditavel || !this.obra) return;

    this.salvando = true;

    const dadosAtualizar = {
      name: this.obraEditavel.name,
      status: this.obraEditavel.status,
      endereco: this.obraEditavel.endereco,
      descricao: this.obraEditavel.descricao,
      dataInicio: this.obraEditavel.dataInicio,
      dataFimPrevista: this.obraEditavel.dataFimPrevista,
      orcamentoPrevisto: this.obraEditavel.orcamentoPrevisto
    };

    this.obrasService.update(this.obraId, dadosAtualizar).subscribe(
      (resultado) => {
        this.obra = resultado || this.obraEditavel;
        this.modoEdicao = false;
        this.obraEditavel = null;
        this.salvando = false;
        alert('Obra atualizada com sucesso!');
      },
      (erro) => {
        console.error('Erro ao atualizar obra:', erro);
        this.salvando = false;
        alert('Erro ao atualizar obra. Tente novamente.');
      }
    );
  }
}
