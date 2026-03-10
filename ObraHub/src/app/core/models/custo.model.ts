export interface Custo {
  id?: string;
  obraId?: string;
  descricao?: string;
  categoria: string;
  valor: number;
  data: Date;

  // added to support view result
  quantidade?: number;
  valorunitario?: number;
  tipo?: string;
  nome?: string;
  datamovimentacao?: Date;
  valortotal?: number;
}
