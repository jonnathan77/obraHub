const test = require('node:test')
const assert = require('node:assert/strict')
const XLSX = require('xlsx')
const { limparValor, processarPlanilha } = require('../src/services/planilha.service')

test('limparValor preserves numeric decimals and Brazilian currency formatting', () => {
  assert.equal(limparValor(35.5), 35.5)
  assert.equal(limparValor('R$ 1.234,56'), 1234.56)
  assert.equal(limparValor('35.50'), 35.5)
  assert.ok(Number.isNaN(limparValor('')))
})

test('processarPlanilha processes the first and all following CSV data rows', async () => {
  const csv = [
    'Data,Valor,Tipo',
    '12/11/2026,"R$ 1.234,56",entrada',
    '13/11/2026,35.50,saida'
  ].join('\n')

  const result = await processarPlanilha(Buffer.from(csv), 'text/csv')

  assert.equal(result.summary.linhasProcessadas, 2)
  assert.equal(result.summary.totalEntradas, 1234.56)
  assert.equal(result.summary.totalSaidas, 35.5)
  assert.deepEqual(result.fluxo.map(linha => linha.saldo), [1234.56, 1199.06])
})

test('processarPlanilha keeps the first XLSX record and numeric decimals', async () => {
  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet([
    ['Data', 'Valor', 'Tipo'],
    ['12/11/2026', 35.5, 'entrada'],
    ['13/11/2026', 10.25, 'saida']
  ])
  XLSX.utils.book_append_sheet(workbook, sheet, 'Fluxo')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  const result = await processarPlanilha(
    buffer,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )

  assert.equal(result.summary.linhasProcessadas, 2)
  assert.equal(result.summary.totalEntradas, 35.5)
  assert.equal(result.summary.totalSaidas, 10.25)
})
