-- Migração: Materiais, Movimentações, Estrutura da Obra, Template Atividades, Atividades
-- Execute este script no PostgreSQL
-- Requer: tabelas obra e empresa existentes

-- 1) Tabela materiais (catálogo global por empresa)
CREATE TABLE IF NOT EXISTS material_catalogo (
    id SERIAL PRIMARY KEY,
    empresaid INTEGER NOT NULL,
    nome VARCHAR(150) NOT NULL,
    unidade VARCHAR(50) NOT NULL DEFAULT 'un',
    estoque_atual DECIMAL(15,2) DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_material_empresa FOREIGN KEY (empresaid) REFERENCES empresa(id) ON DELETE CASCADE
);

-- Índice para buscar por empresa
CREATE INDEX IF NOT EXISTS idx_material_catalogo_empresa ON material_catalogo(empresaid);

-- 2) Tabela movimentacoes (entrada/saída de material para obra)
CREATE TABLE IF NOT EXISTS movimentacao (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL,
    obra_id INTEGER NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    quantidade DECIMAL(15,2) NOT NULL,
    valor_unitario DECIMAL(15,2) DEFAULT 0,
    data_movimentacao DATE NOT NULL,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    empresaid INTEGER NOT NULL,
    CONSTRAINT fk_mov_material FOREIGN KEY (material_id) REFERENCES material_catalogo(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mov_obra FOREIGN KEY (obra_id) REFERENCES obra(id) ON DELETE CASCADE,
    CONSTRAINT fk_mov_empresa FOREIGN KEY (empresaid) REFERENCES empresa(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movimentacao_obra ON movimentacao(obra_id);
CREATE INDEX IF NOT EXISTS idx_movimentacao_material ON movimentacao(material_id);

-- 3) Tabela estrutura_obra (blocos, torres, andares, apartamentos)
CREATE TABLE IF NOT EXISTS estrutura_obra (
    id SERIAL PRIMARY KEY,
    obra_id INTEGER NOT NULL,
    nome VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    parent_id INTEGER NULL,
    ordem INTEGER DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_estrutura_obra FOREIGN KEY (obra_id) REFERENCES obra(id) ON DELETE CASCADE,
    CONSTRAINT fk_parent_estrutura FOREIGN KEY (parent_id) REFERENCES estrutura_obra(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_estrutura_obra_id ON estrutura_obra(obra_id);
CREATE INDEX IF NOT EXISTS idx_estrutura_parent ON estrutura_obra(parent_id);

-- 4) Tabela template_atividades (modelo de tarefas por empresa)
CREATE TABLE IF NOT EXISTS template_atividades (
    id SERIAL PRIMARY KEY,
    empresaid INTEGER NOT NULL,
    etapa VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    ordem INTEGER DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_template_empresa FOREIGN KEY (empresaid) REFERENCES empresa(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_template_empresa ON template_atividades(empresaid);

-- 5) Tabela atividades (execução real - por obra e opcionalmente por estrutura)
CREATE TABLE IF NOT EXISTS atividade (
    id SERIAL PRIMARY KEY,
    obra_id INTEGER NOT NULL,
    estrutura_obra_id INTEGER NULL,
    etapa VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    responsavel VARCHAR(150) NULL,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'atrasado')),
    data_conclusao DATE NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    empresaid INTEGER NOT NULL,
    CONSTRAINT fk_atividade_obra FOREIGN KEY (obra_id) REFERENCES obra(id) ON DELETE CASCADE,
    CONSTRAINT fk_atividade_estrutura FOREIGN KEY (estrutura_obra_id) REFERENCES estrutura_obra(id) ON DELETE CASCADE,
    CONSTRAINT fk_atividade_empresa FOREIGN KEY (empresaid) REFERENCES empresa(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_atividade_obra ON atividade(obra_id);
CREATE INDEX IF NOT EXISTS idx_atividade_estrutura ON atividade(estrutura_obra_id);

-- Opcional: inserir templates padrão (ajuste empresaid conforme sua base)
-- INSERT INTO template_atividades (empresaid, etapa, descricao, ordem)
-- VALUES
-- (1,'Fundação','Escavação',1),
-- (1,'Fundação','Concretagem',2),
-- (1,'Estrutura','Levantar pilares',1),
-- (1,'Estrutura','Montar laje',2),
-- (1,'Acabamento','Assentar piso',1),
-- (1,'Acabamento','Pintura',2);
