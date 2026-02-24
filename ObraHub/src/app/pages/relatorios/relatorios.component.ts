import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './relatorios.component.html',
  styleUrls: ['./relatorios.component.scss']
})
export class RelatoriosComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nome: [''],
      dataInicio: [''],
      previsaoFim: [''],
      andamento: [true],
      financeiro: [true],
      problemas: [false],
      qualidade: [false],
      formato: ['pdf'],
      email: ['']
    });
  }

  gerar() {
    const values = this.form.value;
    // Cria um HTML simples com os dados selecionados para impressão/export
    const content = `
      <div style="font-family: Arial, Helvetica, sans-serif; padding:20px;">
        <h2>Relatório - ${values.nome || 'Empreendimento'}</h2>
        <p><strong>Período:</strong> ${values.dataInicio || 'N/A'} — ${values.previsaoFim || 'N/A'}</p>
        <h3>Dados incluídos</h3>
        <ul>
          ${values.andamento ? '<li>Andamento da Obra</li>' : ''}
          ${values.financeiro ? '<li>Relatório Financeiro</li>' : ''}
          ${values.problemas ? '<li>Relatório de Problemas</li>' : ''}
          ${values.qualidade ? '<li>Relatório de Qualidade</li>' : ''}
        </ul>
        <p><strong>Formato:</strong> ${values.formato.toUpperCase()}</p>
      </div>
    `;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(content);
      w.document.close();
      // Se o usuário quiser salvar em PDF, pode usar imprimir do navegador
      setTimeout(() => w.print(), 500);
    } else {
      alert('Não foi possível abrir a janela para gerar o relatório.');
    }
  }
}
