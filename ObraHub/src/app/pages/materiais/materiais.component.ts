import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MateriaisService } from '@services/materiais.service';
import { ObrasService } from '@services/obras.service';
import { Material, Obra } from '@models/index';

@Component({
  selector: 'app-materiais',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './materiais.component.html',
  styleUrls: ['./materiais.component.scss']
})
export class MateriaisComponent implements OnInit {
  materiais: Material[] = [];
  obras: Obra[] = [];
  obraSelecionadaId = '';
  loading = false;
  error: string | null = null;
  modalOpen = false;
  salvando = false;
  editando: Material | null = null;

  form = {
    nome: '',
    unidade: 'un',
    estoque_inicial: 0
  };

  unidades = ['un', 'm²', 'm³', 'kg', 'L', 'cx', 'sc'];

  constructor(
    private materiaisService: MateriaisService,
    private obrasService: ObrasService
  ) {}

  ngOnInit(): void {
    this.carregarObras();
  }

  carregarObras(): void {
    this.obrasService.getAll().subscribe(obras => {
      this.obras = obras || [];
      if (this.obraSelecionadaId) {
        this.carregar();
      }
    });
  }

  onObraChange(id: string): void {
    this.obraSelecionadaId = id;
    this.carregar();
  }

  carregar(): void {
    if (!this.obraSelecionadaId) {
      this.materiais = [];
      return;
    }

    this.loading = true;
    this.error = null;
    this.materiaisService.getAll(this.obraSelecionadaId).subscribe({
      next: (data) => {
        this.materiais = data || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar materiais. Verifique a conexão.';
        this.loading = false;
      }
    });
  }

  abrirNovo(): void {
    if (!this.obraSelecionadaId) {
      this.error = 'Selecione uma obra antes de cadastrar materiais.';
      return;
    }

    this.editando = null;
    this.form = { nome: '', unidade: 'un', estoque_inicial: 0 };
    this.modalOpen = true;
  }

  abrirEditar(m: Material): void {
    this.editando = m;
    this.form = {
      nome: m.nome,
      unidade: m.unidade,
      estoque_inicial: m.estoque_atual
    };
    this.modalOpen = true;
  }

  fecharModal(): void {
    this.modalOpen = false;
    this.editando = null;
  }

  salvar(): void {
    if (!this.form.nome?.trim() || !this.form.unidade?.trim()) {
      this.error = 'Nome e unidade são obrigatórios.';
      return;
    }

    if (!this.obraSelecionadaId) {
      this.error = 'Selecione uma obra.';
      return;
    }

    this.salvando = true;
    this.error = null;

    if (this.editando) {
      this.materiaisService.update(this.editando.id, {
        nome: this.form.nome.trim(),
        unidade: this.form.unidade.trim(),
        estoque_atual: this.form.estoque_inicial
      }).subscribe({
        next: () => {
          this.salvando = false;
          this.fecharModal();
          this.carregar();
        },
        error: () => {
          this.error = 'Erro ao atualizar material.';
          this.salvando = false;
        }
      });
    } else {
      this.materiaisService.create({
        obraid: Number(this.obraSelecionadaId),
        nome: this.form.nome.trim(),
        unidade: this.form.unidade.trim(),
        estoque_inicial: this.form.estoque_inicial
      }).subscribe({
        next: () => {
          this.salvando = false;
          this.fecharModal();
          this.carregar();
        },
        error: () => {
          this.error = 'Erro ao criar material.';
          this.salvando = false;
        }
      });
    }
  }

  excluir(m: Material): void {
    if (!confirm(`Excluir o material "${m.nome}"?`)) return;

    this.materiaisService.delete(m.id).subscribe({
      next: (ok) => {
        if (ok) this.carregar();
        else this.error = 'Erro ao excluir material.';
      },
      error: () => {
        this.error = 'Erro ao excluir material.';
      }
    });
  }

  formatarData(d?: string | null): string {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  }
}
