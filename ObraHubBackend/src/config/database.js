const { Pool } = require('pg')
require('dotenv').config()

// Log de debug - remover em produção
console.log('🔌 Conectando ao PostgreSQL...')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL com sucesso!')
})

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool de conexão:', err.message)
})

module.exports = pool
