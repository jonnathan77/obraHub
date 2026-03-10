export interface Material {
  id: number;
  obraid?: number;
  nome: string;
  unidade: string;
  estoque_atual: number;
  data_criacao?: string | null;
}
