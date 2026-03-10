export interface EstruturaObra {
  id: number;
  obra_id: number;
  nome: string;
  tipo: 'bloco' | 'torre' | 'andar' | 'apartamento';
  parent_id?: number;
  ordem: number;
  data_criacao?: string;
}
