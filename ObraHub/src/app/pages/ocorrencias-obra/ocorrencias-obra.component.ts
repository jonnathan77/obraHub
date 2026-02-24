import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OcorrenciasService } from '../../core/services/ocorrencias.service';
import { Ocorrencia } from '../../core/models';

@Component({
  selector: 'app-lista-ocorrencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ocorrencias-obra.component.html',
  styleUrls: ['./ocorrencias-obra.component.scss']
})
export class ListaOcorrenciasComponent implements OnInit {
  @Input() obraId: string = '';
  @Input() ocorrencias: Ocorrencia[] = [];
  mostrarForm = false;
  novaOcorrencia: Partial<Ocorrencia> = {};

  constructor(private ocorrenciasService: OcorrenciasService) { }

  ngOnInit(): void {
    if (!this.ocorrencias || this.ocorrencias.length === 0) {
      this.carregarOcorrencias();
    }
  }

  carregarOcorrencias(): void {
    this.ocorrenciasService.getByObraId(this.obraId).subscribe(ocorrencias => {
      this.ocorrencias = ocorrencias;
    });
  }

  adicionarOcorrencia(): void {
    if (this.novaOcorrencia.descricao) {
      const ocorrencia = {
        obra_id: this.obraId,
        data: new Date(this.novaOcorrencia.data || Date.now()).toISOString(),
        descricao: this.novaOcorrencia.descricao,
        clima: this.novaOcorrencia.clima || null,
        equipe: this.novaOcorrencia.equipe || null,
        problemas: this.novaOcorrencia.problemas || null
      };

      this.ocorrenciasService.create(ocorrencia).subscribe(
        (result) => {
          if (result) {
            this.carregarOcorrencias();
            this.mostrarForm = false;
            this.novaOcorrencia = {};
          }
        },
        (error) => {
          console.error('Erro ao adicionar ocorrência:', error);
          alert('Erro ao adicionar ocorrência');
        }
      );
    }
  }

  deletarOcorrencia(ocorrencia: Ocorrencia): void {
    if (confirm('Tem certeza que deseja deletar esta ocorrência?')) {
      this.ocorrenciasService.delete(ocorrencia.id).subscribe(() => {
        this.carregarOcorrencias();
      });
    }
  }
}
