import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EtapasService } from '../../core/services/etapas.service';
import { Etapa } from '../../core/models';

@Component({
  selector: 'app-lista-etapas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './etapas-obra.component.html',
  styleUrls: ['./etapas-obra.component.scss']
})
export class ListaEtapasComponent implements OnInit {
  @Input() obraId: string = '';
  @Input() etapas: Etapa[] = [];
  mostrarForm = false;
  novaEtapa: Partial<Etapa> = {};

  constructor(private etapasService: EtapasService) { }

  ngOnInit(): void {
    if (!this.etapas || this.etapas.length === 0) {
      this.carregarEtapas();
    }
  }

  carregarEtapas(): void {
    this.etapasService.getByObraId(this.obraId).subscribe(etapas => {
      this.etapas = etapas;
    });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'nao_iniciada': '#6c757d',
      'andamento': '#0d6efd',
      'atrasada': '#dc3545',
      'concluida': '#198754'
    };
    return colors[status] || '#6c757d';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'nao_iniciada': 'Não Iniciada',
      'andamento': 'Em Andamento',
      'atrasada': 'Atrasada',
      'concluida': 'Concluída'
    };
    return labels[status] || status;
  }

  adicionarEtapa(): void {
    if (this.novaEtapa.nome) {
      const etapa = {
        obra_id: this.obraId,
        nome: this.novaEtapa.nome,
        status: this.novaEtapa.status || 'NaoIniciada',
        progresso: this.novaEtapa.progresso || 0,
        data_prevista: this.novaEtapa.dataPrevista ? new Date(this.novaEtapa.dataPrevista).toISOString() : null
      };

      this.etapasService.create(etapa).subscribe(
        (result) => {
          if (result) {
            this.carregarEtapas();
            this.mostrarForm = false;
            this.novaEtapa = {};
          }
        },
        (error) => {
          console.error('Erro ao adicionar etapa:', error);
          alert('Erro ao adicionar etapa');
        }
      );
    }
  }

  deletarEtapa(etapa: Etapa): void {
    if (confirm(`Tem certeza que deseja deletar ${etapa.nome}?`)) {
      this.etapasService.delete(etapa.id).subscribe(() => {
        this.carregarEtapas();
      });
    }
  }

  atualizarEtapa(etapa: Etapa): void {
    this.etapasService.update(etapa.id, etapa).subscribe(() => {
      this.carregarEtapas();
    });
  }
}
