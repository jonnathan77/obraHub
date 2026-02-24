export interface Etapa {
  id: string;
  obraId: string;
  nome: string;
  status: string;
  progresso: number;
  dataPrevista?: Date;
  criadoEm?: Date;
}