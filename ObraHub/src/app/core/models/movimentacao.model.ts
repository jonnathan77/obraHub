export interface Movimentacao {
  id: number;
  material_id: number;
  obra_id: number;
  obraid?: number;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  valor_unitario: number;
  valor_total?: number;
  data_movimentacao: string;
  material_nome?: string;
  material_unidade?: string;
  obra_nome?: string;
}
