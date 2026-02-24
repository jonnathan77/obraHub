export interface Ocorrencia {
  id: string;
  obraId: string;
  data: Date;
  descricao: string;
  clima?: string;
  equipe?: string;
  problemas?: string;
  criadoEm?: Date;
}