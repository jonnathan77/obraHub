import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-obra',
  standalone: true, // 👈 IMPORTANTE
  imports: [CommonModule, ReactiveFormsModule], // 👈 IMPORTANTE
  templateUrl: './create-obra.component.html',
  styleUrls: ['./create-obra.component.scss']
})
export class CreateObraComponent {

  @Input() isOpen: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onCreate = new EventEmitter<any>();

  obraForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.obraForm = this.fb.group({
      nome: ['', Validators.required],
      cliente: ['', Validators.required],
      endereco: ['', Validators.required],
      descricao: [''],
      status: ['planejada', Validators.required],
      dataInicio: ['', Validators.required],
      dataFimPrevista: ['', Validators.required],
      orcamentoPrevisto: [0, [Validators.required, Validators.min(0)]]
    });
  }

  close() {
    this.obraForm.reset();
    this.onClose.emit();
  }

  submit() {
    if (this.obraForm.valid) {
      this.onCreate.emit(this.obraForm.value);
      this.close();
    }
  }

  formatarMoeda(event: any) {
  let valor = event.target.value;

  // Remove tudo que não é número
  valor = valor.replace(/\D/g, '');

  // Converte para número decimal
  valor = (Number(valor) / 100).toFixed(2) + '';

  // Formata como moeda BR
  valor = valor.replace('.', ',');
  valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  event.target.value = 'R$ ' + valor;

  // Atualiza o form sem o "R$"
  this.obraForm.patchValue({
    orcamentoPrevisto: valor.replace(/\./g, '').replace(',', '.')
  }, { emitEvent: false });
}
}