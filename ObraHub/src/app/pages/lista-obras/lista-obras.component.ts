import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ObrasService } from '@services/obras.service';
import { Obra } from '@models/index';
import { CreateObraComponent } from '../../components/create-obra/create-obra.component';

@Component({
  selector: 'app-lista-obras',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CreateObraComponent],
  templateUrl: './lista-obras.component.html',
  styleUrls: ['./lista-obras.component.scss'],
  
})
export class ListaObrasComponent implements OnInit {
  obras: Obra[] = [];
  filtroStatus: string = '';
  loading = false;
  modalOpen = false;
  modoEdicao = false;
  obraEditando: Obra | null = null;
  salvando = false;

  statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'planejada', label: 'Planejada' },
    { value: 'em_execucao', label: 'Em Execução' },
    { value: 'pausada', label: 'Pausada' },
    { value: 'concluida', label: 'Concluída' }
  ];

  constructor(private obrasService: ObrasService) { }

  ngOnInit(): void {
    this.carregarObras();
  }

  carregarObras(): void {
    this.loading = true;
    this.obrasService.getAll().subscribe((obras: Obra[]) => {
      this.obras = obras;
      console.log('Obras carregadas:', obras);
      this.loading = false;
    });
  }

  get obrasFiltered(): Obra[] {
    if (!this.filtroStatus) return this.obras;
    return this.obras.filter((o: Obra) => o.status === this.filtroStatus);
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

  getProgressColor(progresso: number): string {
    if (progresso < 33) return '#dc3545';
    if (progresso < 66) return '#ffc107';
    return '#198754';
  }

  calcularProgresso(obra: Obra): number {
    // Usa a variável progresso do banco de dados
    // O progresso é atualizado a cada atividade realizada na obra
    return obra.progresso || 0;
  }

  openModal(): void {
    this.modalOpen = true;
  }

  handleCreateObra(data: any): void {
    console.log('Dados recebidos do modal:', data);

    this.obrasService.create(data).subscribe(() => {
      this.modalOpen = false;
      this.carregarObras();
    });
  }

  editarObra(obra: Obra): void {
    this.obraEditando = { ...obra };
    this.modoEdicao = true;
  }

  cancelarEdicao(): void {
    this.modoEdicao = false;
    this.obraEditando = null;
  }

  salvarEdicao(): void {
    if (!this.obraEditando || !this.obraEditando.id) return;

    this.salvando = true;

    const dadosAtualizar = {
      name: this.obraEditando.name,
      status: this.obraEditando.status,
      endereco: this.obraEditando.endereco,
      descricao: this.obraEditando.descricao,
      dataInicio: this.obraEditando.dataInicio,
      dataFimPrevista: this.obraEditando.dataFimPrevista,
      orcamentoPrevisto: this.obraEditando.orcamentoPrevisto
    };

    this.obrasService.update(this.obraEditando.id, dadosAtualizar).subscribe(
      () => {
        this.modoEdicao = false;
        this.obraEditando = null;
        this.salvando = false;
        this.carregarObras();
        alert('Obra atualizada com sucesso!');
      },
      (erro) => {
        console.error('Erro ao atualizar obra:', erro);
        this.salvando = false;
        alert('Erro ao atualizar obra. Tente novamente.');
      }
    );
  }

  deletarObra(obra: Obra): void {
    if (confirm(`Tem certeza que deseja deletar ${obra.name}?`)) {
      this.obrasService.delete(obra.id).subscribe(() => {
        this.carregarObras();
      });
    }
  }
}
