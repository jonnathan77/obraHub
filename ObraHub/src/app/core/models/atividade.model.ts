export interface Atividade {
  id: number;
  obra_id: number;
  estrutura_obra_id?: number;
  etapa: string;
  descricao: string;
  responsavel?: string;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';
  data_conclusao?: string;
  data_criacao?: string;
}
