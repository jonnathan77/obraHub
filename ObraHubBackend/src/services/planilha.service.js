const XLSX = require('xlsx');
const csv = require('csv-parser');
const { promisify } = require('util');
const csvParseAsync = promisify(csv);

/**
 * Limpa valor brasileiro/monetário para number
 * @param {any} v - valor raw da planilha
 * @returns {number} valor limpo
 */
function limparValor(v) {
  if (!v && v !== 0) return 0;
  return Number(String(v).replace(/[R$\s.]/g, '').replace(',', '.'));
}

/**
 * Converte data serial Excel para JS Date
 * @param {number} serial - serial Excel
 * @returns {Date}
 */
function excelDateToJS(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  const fractional_day = serial - Math.floor(serial) + 0.0000001;
  let total_seconds = Math.floor(date_info.getTime() / 1000);
  total_seconds += fractional_day * 86400;
  return new Date(total_seconds * 1000);
}

/**
 * Normaliza data para string ISO
 * @param {any} dataRaw
 * @returns {string} YYYY-MM-DD
 */
function normalizarData(dataRaw) {
  if (!dataRaw) return null;
  let data;
  if (typeof dataRaw === 'number') {
    data = excelDateToJS(dataRaw);
  } else if (typeof dataRaw === 'string') {
    // DD/MM/YYYY -> YYYY-MM-DD
    const parts = dataRaw.split('/');
    if (parts.length === 3 && parts[0].length === 2) {
      data = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
      data = new Date(dataRaw);
    }
  } else {
    data = new Date(dataRaw);
  }
  if (isNaN(data.getTime())) return null;
  return data.toISOString().split('T')[0];
}

/**
 * Mapeia colunas comuns para data/valor/tipo
 * Assume primeiras linhas header, case-insensitive partial match
 */
function mapearColunas(row, headers) {
  const colData = headers.find(h => h.toLowerCase().includes('data') || h.toLowerCase().includes('date')) || 'data';
  const colValor = headers.find(h => h.toLowerCase().includes('valor') || h.toLowerCase().includes('value') || h.toLowerCase().includes('amount')) || 'valor';
  const colTipo = headers.find(h => h.toLowerCase().includes('tipo') || h.toLowerCase().includes('type')) || 'tipo';

  return {
    data: row[colData],
    valor: row[colValor],
    tipo: row[colTipo] ? row[colTipo].toLowerCase() : 'saida' // default saida se não achar
  };
}

/**
 * Parse XLSX
 */
async function parseXLSX(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(worksheet);
  return json;
}

/**
 * Parse CSV
 */
async function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    bufferStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

/**
 * Processa planilha completa
 */
async function processarPlanilha(buffer, mimetype) {
  let linhasRaw;
  if (mimetype.includes('xlsx') || mimetype.includes('xls')) {
    linhasRaw = await parseXLSX(buffer);
  } else if (mimetype.includes('csv')) {
    linhasRaw = await parseCSV(buffer);
  } else {
    throw new Error('Formato não suportado. Use XLSX ou CSV.');
  }

  // Assume primeira linha headers
  if (linhasRaw.length === 0) throw new Error('Planilha vazia');
  const headers = Object.keys(linhasRaw[0]);

  // Normalizar linhas
  const fluxo = linhasRaw.slice(1).map(row => mapearColunas(row, headers))
    .filter(line => line.data && !isNaN(limparValor(line.valor)))
    .map(line => ({
      data: normalizarData(line.data),
      valor: limparValor(line.valor),
      tipo: line.tipo.includes('entrada') ? 'entrada' : 'saida'
    }))
    .filter(line => line.data); // só válidas

  if (fluxo.length === 0) throw new Error('Nenhuma linha válida encontrada. Verifique colunas Data/Valor/Tipo.');

  // Sort by date CRITICAL
  fluxo.sort((a, b) => new Date(a.data) - new Date(b.data));

  // Calcular saldo cumulative
  let saldo = 0;
  const fluxoComSaldo = fluxo.map(line => {
    saldo += line.tipo === 'entrada' ? line.valor : -line.valor;
    return {
      ...line,
      saldo: parseFloat(saldo.toFixed(2))
    };
  });

  // Projeções: hoje, +7,15,30 dias - assume fluxo continua sem novas entradas/saídas
  const hoje = new Date();
  const projecoesDatas = [
    hoje.toISOString().split('T')[0],
    new Date(hoje.getTime() + 7*24*60*60*1000).toISOString().split('T')[0],
    new Date(hoje.getTime() + 15*24*60*60*1000).toISOString().split('T')[0],
    new Date(hoje.getTime() + 30*24*60*60*1000).toISOString().split('T')[0]
  ];
  const projecao = projecoesDatas.map(dataStr => {
    const projData = new Date(dataStr);
    const saldoAteData = fluxoComSaldo.filter(f => new Date(f.data) <= projData)
      .reduce((acc, f) => acc + (f.tipo === 'entrada' ? f.valor : -f.valor), 0);
    return {
      data: dataStr,
      saldo: parseFloat(saldoAteData.toFixed(2))
    };
  });

  // Risco: primeiro saldo <0
  const riscoData = fluxoComSaldo.find(f => f.saldo < 0)?.data || null;

  // Summary
  const totalEntradas = fluxo.filter(f => f.tipo === 'entrada').reduce((acc, f) => acc + f.valor, 0);
  const totalSaidas = fluxo.filter(f => f.tipo === 'saida').reduce((acc, f) => acc + f.valor, 0);

  return {
    fluxo: fluxoComSaldo,
    projecao,
    riscoData,
    summary: {
      totalEntradas: parseFloat(totalEntradas.toFixed(2)),
      totalSaidas: parseFloat(totalSaidas.toFixed(2)),
      saldoFinal: parseFloat(saldo.toFixed(2)),
      linhasProcessadas: fluxo.length
    }
  };
}

module.exports = {
  limparValor,
  normalizarData,
  excelDateToJS,
  processarPlanilha
};

