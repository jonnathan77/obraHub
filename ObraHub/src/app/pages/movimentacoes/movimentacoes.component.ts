import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovimentacoesService } from '@services/movimentacoes.service';
import { MateriaisService } from '@services/materiais.service';
import { ObrasService } from '@services/obras.service';
import { Movimentacao, Material, Obra } from '@models/index';

@Component({
  selector: 'app-movimentacoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movimentacoes.component.html',
  styleUrls: ['./movimentacoes.component.scss']
})
export class MovimentacoesComponent implements OnInit {
  movimentacoes: Movimentacao[] = [];
  materiais: Material[] = [];
  obras: Obra[] = [];
  obraSelecionadaId = '';
  loading = false;
  error: string | null = null;
  modalOpen = false;
  salvando = false;

  form = {
    material_id: 0,
    obra_id: 0,
    tipo: 'entrada' as 'entrada' | 'saida',
    quantidade: 0,
    valor_unitario: 0,
    data_movimentacao: ''
  };

  constructor(
    private movimentacoesService: MovimentacoesService,
    private materiaisService: MateriaisService,
    private obrasService: ObrasService
  ) {}

  ngOnInit(): void {
    this.carregarObras();
  }

  carregarObras(): void {
    this.obrasService.getAll().subscribe(obras => {
      this.obras = obras || [];
      if (!this.obraSelecionadaId && this.obras.length > 0) {
        this.obraSelecionadaId = String(this.obras[0].id);
      }
      if (this.obraSelecionadaId) {
        this.carregar();
        this.carregarMateriais();
      }
    });
  }

  onObraChange(id: string): void {
    this.obraSelecionadaId = id;
    this.carregar();
    this.carregarMateriais();
  }

  carregar(): void {
    if (!this.obraSelecionadaId) {
      this.movimentacoes = [];
      return;
    }

    this.loading = true;
    this.error = null;
    this.movimentacoesService.getAll(this.obraSelecionadaId).subscribe({
      next: (data) => {
        this.movimentacoes = data || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar movimentações.';
        this.loading = false;
      }
    });
  }

  carregarMateriais(): void {
    if (!this.obraSelecionadaId) {
      this.materiais = [];
      return;
    }
    this.materiaisService.getAll(this.obraSelecionadaId).subscribe(d => (this.materiais = d || []));
  }

  abrirNovo(): void {
    if (!this.obraSelecionadaId) {
      this.error = 'Selecione uma obra antes de registrar movimentações.';
      return;
    }

    this.form = {
      material_id: this.materiais[0]?.id ?? 0,
      obra_id: Number(this.obraSelecionadaId) || 0,
      tipo: 'entrada',
      quantidade: 0,
      valor_unitario: 0,
      data_movimentacao: new Date().toISOString().slice(0, 10)
    };
    this.modalOpen = true;
  }

  fecharModal(): void {
    this.modalOpen = false;
  }

  salvar(): void {
    if (!this.form.material_id || !this.form.obra_id || !this.form.quantidade || !this.form.data_movimentacao) {
      this.error = 'Preencha todos os campos obrigatórios.';
      return;
    }

    this.salvando = true;
    this.error = null;

    this.movimentacoesService.create({
      material_id: this.form.material_id,
      obra_id: Number(this.form.obra_id),
      tipo: this.form.tipo,
      quantidade: this.form.quantidade,
      valor_unitario: this.form.valor_unitario,
      data_movimentacao: this.form.data_movimentacao
    }).subscribe({
      next: () => {
        this.salvando = false;
        this.fecharModal();
        this.carregar();
      },
      error: () => {
        this.error = 'Erro ao registrar movimentação.';
        this.salvando = false;
      }
    });
  }

  valorTotal(m: Movimentacao): number {
    return (m.quantidade || 0) * (m.valor_unitario || 0);
  }

  formatarData(d?: string): string {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  }
}
