import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './configuracoes.component.html',
  styleUrls: ['./configuracoes.component.scss']
})
export class ConfiguracoesComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nomeEmpresa: ['Minha Empresa'],
      corLayout: ['#0d6efd'],
      perfil: [''],
      notificacoes: [true]
    });
  }

  salvar() {
    // Placeholder persist
    alert('Configurações salvas (placeholder)');
  }
}
