import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  modalResetOpen = false;
  emailReset = '';
  mostrarSenha = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {}

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      const { email, senha } = this.loginForm.value;

      this.auth.login(email, senha).subscribe({
        next: (res) => {
          this.loading = false;
          // navega para dashboard/lista de obras
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.error?.error || 'Erro ao autenticar';
        },
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  resetSenha() {
    console.log('Redirecionar para reset de senha');
  }

  toggleSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  abrirModalReset() {
    this.modalResetOpen = true;
  }

  fecharModal() {
    this.modalResetOpen = false;
    this.emailReset = '';
  }

  enviarReset() {
    if (!this.emailReset) {
      alert('Digite um email');
      return;
    }

    console.log('Enviar reset para:', this.emailReset);
    // aqui você chama o backend
    // this.auth.resetSenha(this.emailReset).subscribe()

    alert('Se o email existir, enviaremos o link de recuperação.');

    this.fecharModal();
  }
}
