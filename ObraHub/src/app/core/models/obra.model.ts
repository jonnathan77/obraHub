export interface Obra {
  id: string;
  name: string;
  endereco: string;
  status: 'Planejada' | 'Execucao' | 'Pausada' | 'Concluida';
  dataInicio: Date;
  dataFimPrevista?: Date;
  orcamentoPrevisto?: number;
  orcamentoTotal?: number;
  progresso?: number;
  companyId?: string;
  createdAt?: Date;
  descricao?: string;
}

// Para compatibilidade com código antigo
export interface ObrasLegacy {
  id: string;
  endereco: string;
  status: 'Planejada' | 'Execucao' | 'Pausada' | 'Concluida';
  dataInicio: Date;
  dataPrevista: Date;
  orcamentoTotal?: number;
}
