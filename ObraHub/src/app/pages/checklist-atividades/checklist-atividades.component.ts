import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ObrasService } from '@services/obras.service';
import { AtividadesService } from '@services/atividades.service';
import { EstruturaService } from '@services/estrutura.service';
import { TemplateAtividadesService } from '@services/template-atividades.service';
import {
  Obra,
  Atividade,
  EstruturaObra,
  TemplateAtividade,
} from '@models/index';
interface LinhaChecklist {
  estrutura_id: number;
  unidade: string;
  tipo: string;
  etapa: string;
  status: string;
}

interface UnidadeChecklist {
  estrutura_id: number;
  unidade: string;
  tipo: string;
  etapas: {
    etapa: string;
    status: string;
  }[];
}
@Component({
  selector: 'app-checklist-atividades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checklist-atividades.component.html',
  styleUrls: ['./checklist-atividades.component.scss'],
})
export class ChecklistAtividadesComponent implements OnInit {
  obras: Obra[] = [];
  obraSelecionada: Obra | null = null;
  atividades: Atividade[] = [];
  estrutura: EstruturaObra[] = [];
  templates: TemplateAtividade[] = [];

  checklistLinhas: LinhaChecklist[] = [];
  checklistUnidades: UnidadeChecklist[] = [];

  loading = false;
  loadingEstrutura = false;
  error: string | null = null;
  modalAtividadeOpen = false;
  modalEstruturaOpen = false;
  salvando = false;
  editando: Atividade | null = null;

  formAtividade = {
    etapa: '',
    descricao: '',
    responsavel: '',
    estrutura_id: null as number | null,
  };

  formEstrutura = {
    nome: '',
    tipo: 'bloco' as string,
    parent_id: 0 as number | undefined,
  };

  etapasDisponiveis: string[] = [];

  constructor(
    private obrasService: ObrasService,
    private atividadesService: AtividadesService,
    private estruturaService: EstruturaService,
    private templateService: TemplateAtividadesService,
  ) {}

  ngOnInit(): void {
    this.carregarObras();
    this.carregarTemplates();
  }

  carregarObras(): void {
    this.obrasService.getAll().subscribe((d) => (this.obras = d || []));
  }

  carregarTemplates(): void {
    this.templateService.getAll().subscribe((d) => {
      this.templates = d || [];
      const etapas = [...new Set((d || []).map((t) => t.etapa))];
      this.etapasDisponiveis = etapas.length
        ? etapas
        : ['Fundação', 'Estrutura', 'Acabamento', 'Outros'];
    });
  }

  onObraChange(obraId: string | number): void {
    this.obraSelecionada =
      this.obras.find((o) => String(o.id) === String(obraId)) || null;
    if (this.obraSelecionada) {
      this.carregarAtividades();
      this.carregarEstrutura();
      this.carregarChecklist();
    } else {
      this.atividades = [];
      this.estrutura = [];
    }
  }

  carregarAtividades(): void {
    if (!this.obraSelecionada) return;
    this.loading = true;
    this.error = null;
    const id = Number(this.obraSelecionada.id);
    this.atividadesService.getByObraId(id).subscribe({
      next: (d) => {
        this.atividades = d || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar atividades.';
        this.loading = false;
      },
    });
  }

  carregarEstrutura(): void {
    if (!this.obraSelecionada) return;
    this.loadingEstrutura = true;
    const id = Number(this.obraSelecionada.id);
    this.estruturaService.getByObraId(id).subscribe({
      next: (d) => {
        this.estrutura = d || [];
        this.loadingEstrutura = false;
      },
      error: () => {
        this.loadingEstrutura = false;
      },
    });
  }

  atividadesPorEtapa(): { etapa: string; items: Atividade[] }[] {
    const map = new Map<string, Atividade[]>();
    for (const a of this.atividades) {
      const etapa = a.etapa || 'Outros';
      if (!map.has(etapa)) map.set(etapa, []);
      map.get(etapa)!.push(a);
    }
    const etapas = ['Fundação', 'Estrutura', 'Acabamento', 'Pintura', 'Outros'];
    const result: { etapa: string; items: Atividade[] }[] = [];
    for (const e of etapas) {
      if (map.has(e)) result.push({ etapa: e, items: map.get(e)! });
    }
    for (const [e, items] of map) {
      if (!etapas.includes(e)) result.push({ etapa: e, items });
    }
    return result;
  }

  abrirNovaAtividade(): void {
    this.editando = null;
    this.formAtividade = {
      etapa: this.etapasDisponiveis[0] || 'Fundação',
      descricao: '',
      responsavel: '',
      estrutura_id: null,
    };
    this.modalAtividadeOpen = true;
  }

  abrirEditarAtividade(a: Atividade): void {
    this.editando = a;
    this.formAtividade = {
      etapa: a.etapa,
      descricao: a.descricao,
      responsavel: a.responsavel || '',
      estrutura_id: null,
    };
    this.modalAtividadeOpen = true;
  }

  fecharModalAtividade(): void {
    this.modalAtividadeOpen = false;
    this.editando = null;
  }

  salvarAtividade(): void {
    if (
      !this.obraSelecionada ||
      !this.formAtividade.etapa?.trim() ||
      !this.formAtividade.descricao?.trim()
    ) {
      this.error = 'Etapa e descrição são obrigatórios.';
      return;
    }

    this.salvando = true;
    this.error = null;

    const obraId = Number(this.obraSelecionada.id);

    const payload = {
      etapa: this.formAtividade.etapa.trim(),
      descricao: this.formAtividade.descricao.trim(),
      responsavel: this.formAtividade.responsavel?.trim() || undefined,
      estrutura_id: this.formAtividade.estrutura_id,
    };

    if (this.editando) {
      this.atividadesService.update(this.editando.id, payload).subscribe({
        next: () => {
          this.salvando = false;
          this.fecharModalAtividade();
          this.carregarAtividades();
        },
        error: () => {
          this.error = 'Erro ao atualizar atividade.';
          this.salvando = false;
        },
      });
    } else {
      this.atividadesService.create(obraId, payload).subscribe({
        next: () => {
          this.salvando = false;
          this.fecharModalAtividade();
          this.carregarAtividades();
        },
        error: () => {
          this.error = 'Erro ao criar atividade.';
          this.salvando = false;
        },
      });
    }
  }

  marcarConcluido(a: Atividade): void {
    const novoStatus = a.status === 'concluido' ? 'pendente' : 'concluido';
    const dataConclusao =
      novoStatus === 'concluido'
        ? new Date().toISOString().slice(0, 10)
        : undefined;

    this.atividadesService
      .update(a.id, { status: novoStatus, data_conclusao: dataConclusao })
      .subscribe({
        next: () => this.carregarAtividades(),
        error: () => (this.error = 'Erro ao atualizar status.'),
      });
  }

  excluirAtividade(a: Atividade): void {
    if (!confirm(`Excluir "${a.descricao}"?`)) return;

    this.atividadesService.delete(a.id).subscribe({
      next: () => this.carregarAtividades(),
      error: () => (this.error = 'Erro ao excluir atividade.'),
    });
  }

  abrirNovaEstrutura(): void {
    this.formEstrutura = {
      nome: '',
      tipo: 'bloco',
      parent_id: undefined,
    };
    this.modalEstruturaOpen = true;
  }

  fecharModalEstrutura(): void {
    this.modalEstruturaOpen = false;
  }

  salvarEstrutura(): void {
    if (!this.obraSelecionada || !this.formEstrutura.nome?.trim()) {
      this.error = 'Nome é obrigatório.';
      return;
    }

    this.salvando = true;
    this.error = null;
    const obraId = Number(this.obraSelecionada.id);

    this.estruturaService
      .create(obraId, {
        nome: this.formEstrutura.nome.trim(),
        tipo: this.formEstrutura.tipo,
        parent_id: this.formEstrutura.parent_id || undefined,
      })
      .subscribe({
        next: () => {
          this.salvando = false;
          this.fecharModalEstrutura();
          this.carregarEstrutura();
        },
        error: () => {
          this.error = 'Erro ao criar item da estrutura.';
          this.salvando = false;
        },
      });
  }

  excluirEstrutura(e: EstruturaObra): void {
    if (!confirm(`Excluir "${e.nome}"?`)) return;

    this.estruturaService.delete(e.id).subscribe({
      next: () => this.carregarEstrutura(),
      error: () => (this.error = 'Erro ao excluir.'),
    });
  }

  estruturaRaiz(): EstruturaObra[] {
    return this.estrutura.filter((e) => !e.parent_id);
  }

  filhosDe(parentId: number): EstruturaObra[] {
    return this.estrutura.filter((e) => e.parent_id === parentId);
  }

  isConcluido(a: Atividade): boolean {
    return a.status === 'concluido';
  }

  carregarChecklist(): void {
    if (!this.obraSelecionada) return;

    const obraId = Number(this.obraSelecionada.id);

    this.atividadesService.getChecklist(obraId).subscribe((res: any) => {
      this.checklistLinhas = res;
      const mapa = new Map<number, UnidadeChecklist>();

      this.checklistLinhas.forEach((l) => {
        if (!mapa.has(l.estrutura_id)) {
          mapa.set(l.estrutura_id, {
            estrutura_id: l.estrutura_id,
            unidade: l.unidade,
            tipo: l.tipo,
            etapas: [],
          });
        }

        mapa.get(l.estrutura_id)!.etapas.push({
          etapa: l.etapa,
          status: l.status,
        });
      });

      this.checklistUnidades = Array.from(mapa.values());
    });
  }
  alterarStatus(estruturaId: number, etapa: any) {
    const novoStatus = etapa.status === 'concluido' ? 'pendente' : 'concluido';

    this.atividadesService
      .updateStatus({
        estrutura_id: estruturaId,
        etapa: etapa.etapa,
        status: novoStatus,
      })
      .subscribe(() => {
        etapa.status = novoStatus;
      });
  }
}
