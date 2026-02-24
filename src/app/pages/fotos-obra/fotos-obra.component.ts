import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FotosService } from '../../core/services/fotos.service';
import { Foto } from '../../core/models';

@Component({
  selector: 'app-lista-fotos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fotos-obra.component.html',
  styleUrls: ['./fotos-obra.component.scss']
})
export class ListaFotosComponent implements OnInit {
  @Input() obraId: string = '';
  
  fotos: Foto[] = [];
  mostrarForm = false;
  descricaoFoto = '';
  enviando = false;

  constructor(private fotosService: FotosService) { }

  ngOnInit(): void {
    this.carregarFotos();
  }

  carregarFotos(): void {
    this.fotosService.getByObraId(this.obraId).subscribe(fotos => {
      this.fotos = fotos;
    });
  }

  uploadFoto(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.obraId) {
      this.enviando = true;
      this.fotosService.uploadFile(file, this.obraId, this.descricaoFoto || '').subscribe(
        (foto) => {
          if (foto) {
            this.carregarFotos();
            this.mostrarForm = false;
            this.descricaoFoto = '';
            this.enviando = false;
            alert('Foto enviada com sucesso!');
          }
        },
        (error) => {
          console.error('Erro ao enviar foto:', error);
          alert('Erro ao enviar foto');
          this.enviando = false;
        }
      );
    }
  }

  deletarFoto(foto: Foto): void {
    if (confirm('Tem certeza que deseja deletar esta foto?')) {
      this.fotosService.delete(foto.id).subscribe(() => {
        this.carregarFotos();
      });
    }
  }
}
