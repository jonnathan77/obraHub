-- criação da view utilizada pelos custos da obra
-- execute este script no banco de dados PostgreSQL para garantir que a view exista

CREATE OR REPLACE VIEW vw_custos_obra AS
SELECT 
    o.id AS ObraId,
    m.nome,
    mm.tipo,
    mm.datamovimentacao,
    mm.quantidade,
    mm.valorunitario,
    (mm.quantidade * mm.valorunitario) AS ValorTotal
FROM obra o
JOIN material m ON m.obraid = o.id
JOIN movimentacaomaterial mm ON mm.materialid = m.id;
