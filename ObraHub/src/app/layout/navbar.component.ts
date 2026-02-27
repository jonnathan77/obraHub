import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutService } from './layout.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  appTitle = 'ObraHub';
  
  // modal e usuario
  showProfileModal = false;
  usuario: any = null;
  usuarioEditavel: any = null;
  alterandoSenha = false;
  novaSenha = '';
  confirmaSenha = '';
  salvando = false;

  constructor(private layout: LayoutService, private auth: AuthService) {}

  ngOnInit(): void {
    this.carregarUsuario();
  }

  toggleSidebar(): void {
    this.layout.toggle();
  }

  carregarUsuario(): void {
    this.usuario = this.auth.getUser();
  }

  abrirModalPerfil(): void {
    this.carregarUsuario();
    if (this.usuario) {
      this.usuarioEditavel = { ...this.usuario };
      this.novaSenha = '';
      this.confirmaSenha = '';
      this.alterandoSenha = false;
    }
    this.showProfileModal = true;
  }

  fecharModalPerfil(): void {
    this.showProfileModal = false;
    this.usuarioEditavel = null;
    this.alterandoSenha = false;
  }

  salvarPerfilUsuario(): void {
    if (!this.usuarioEditavel) return;
    
    // aqui vocÃª faria a chamada ao backend para salvar
    // por enquanto apenas atualiza localmente
    this.salvando = true;
    setTimeout(() => {
      this.usuario = { ...this.usuarioEditavel };
      localStorage.setItem('obrahub_user', JSON.stringify(this.usuario));
      this.salvando = false;
      alert('Perfil atualizado com sucesso!');
      this.fecharModalPerfil();
    }, 500);
  }

  alterarSenha(): void {
    if (!this.novaSenha || !this.confirmaSenha) {
      alert('Preencha os campos de senha');
      return;
    }
    if (this.novaSenha !== this.confirmaSenha) {
      alert('As senhas não conferem');
      return;
    }
    
    // aqui vocÃª faria a chamada ao backend para atualizar senha
    this.salvando = true;
    setTimeout(() => {
      this.salvando = false;
      alert('Senha alterada com sucesso!');
      this.alterandoSenha = false;
      this.novaSenha = '';
      this.confirmaSenha = '';
    }, 500);
  }

  cancelarAlteracao(): void {
    this.usuarioEditavel = { ...this.usuario };
    this.alterandoSenha = false;
  }
}
