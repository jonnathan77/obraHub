#!/usr/bin/env node

/**
 * Script Diagnóstico de Conexão PostgreSQL - Versão Detalhada
 * Use: node test-connection-verbose.js
 */

require('dotenv').config()
const { Pool } = require('pg')

console.log('\n╔════════════════════════════════════════════════════════════════╗')
console.log('║     🔍 TESTE DE CONEXÃO POSTGRESQL - DIAGNÓSTICO COMPLETO      ║')
console.log('╚════════════════════════════════════════════════════════════════╝\n')

// Verificar variáveis de ambiente
console.log('📋 VARIÁVEIS DE AMBIENTE:')
console.log('─'.repeat(60))

const dbUrl = process.env.DATABASE_URL
const dbHost = process.env.DB_HOST
const dbPort = process.env.DB_PORT
const dbName = process.env.DB_NAME
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASSWORD

console.log(`DATABASE_URL: ${dbUrl ? '✓ Definida' : '✗ NÃO DEFINIDA'}`)
if (dbUrl) {
  // Mascarar senha na exibição
  const masked = dbUrl.replace(/:[^@]*@/, ':***@')
  console.log(`  └─ ${masked}`)
}

console.log(`\nDB_HOST: ${dbHost || '(não definida)'}`)
console.log(`DB_PORT: ${dbPort || '(não definida)'}`)
console.log(`DB_NAME: ${dbName || '(não definida)'}`)
console.log(`DB_USER: ${dbUser || '(não definida)'}`)
console.log(`DB_PASSWORD: ${dbPassword ? '✓ Definida' : '✗ NÃO DEFINIDA'}`)

// Tentar conexão com connectionString
console.log('\n\n🔗 TENTANDO CONEXÃO COM CONNECTION STRING...')
console.log('─'.repeat(60))

if (!dbUrl) {
  console.log('❌ ERRO: DATABASE_URL não está definida no .env')
  console.log('\nAdicione ao .env:')
  console.log('DATABASE_URL=postgresql://postgres:[SENHA]@[HOST]:[PORT]/[DB]')
  process.exit(1)
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  },
  // Timeout de 10 segundos
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
})

// Tenta conexão
pool.connect((err, client, release) => {
  if (err) {
    console.log('❌ FALHA NA CONEXÃO\n')
    
    const errorMap = {
      'ECONNREFUSED': 'Conexão recusada - Host pode estar offline ou firewall bloqueando',
      'ENOTFOUND': 'Host não encontrado - Verifique o hostname',
      'ETIMEDOUT': 'Timeout - Host não respondendo',
      'EHOSTUNREACH': 'Host inatingível - Problema de rede ou firewall',
      '28P01': 'Autenticação falhou - Senha incorreta ou usuário não existe',
      '3D000': 'Database não existe',
      'FATAL': 'Erro fatal do servidor'
    }

    console.log(`Código de Erro: ${err.code}`)
    console.log(`Mensagem: ${err.message}`)
    
    if (errorMap[err.code]) {
      console.log(`\n💡 Possível Causa: ${errorMap[err.code]}`)
    }

    console.log('\n📝 TENTE ISSO:\n')
    
    if (err.code === '28P01') {
      console.log('1. Acesse https://supabase.com')
      console.log('2. Vá em "Database" → "Connection string"')
      console.log('3. Copie a connection string COMPLETA (postgresql://...)')
      console.log('4. Cole no .env como DATABASE_URL=...')
      console.log('5. Rode novamente: node test-connection-verbose.js')
      console.log('\nSe não conseguir ver a senha, clique em "Reset Database Password"')
    } else if (err.code === 'ENOTFOUND') {
      console.log('1. Verifique se o hostname está correto')
      console.log('2. Tente fazer ping: ping db.trshddvygeefkfzclljq.supabase.co')
      console.log('3. Verifique sua conexão de internet')
    } else if (err.code === 'ECONNREFUSED') {
      console.log('1. Verifique se o host está online')
      console.log('2. Verifique a porta (geralmente 5432)')
      console.log('3. Tente conectar via interface web do Supabase')
    }

    pool.end()
    process.exit(1)
  } else {
    // Sucesso - fazer uma query simples
    client.query('SELECT NOW() as current_time, version() as postgres_version', (err, result) => {
      release()
      
      if (err) {
        console.log('❌ CONEXÃO ESTABELECIDA MAS NÃO CONSEGUE FAZER QUERY')
        console.log(`Erro: ${err.message}`)
        pool.end()
        process.exit(1)
      }

      console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!\n')
      console.log('📊 INFORMAÇÕES DO SERVIDOR:')
      console.log('─'.repeat(60))
      console.log(`Hora do Servidor: ${result.rows[0].current_time}`)
      console.log(`PostgreSQL Version: ${result.rows[0].postgres_version.split(',')[0]}`)

      console.log('\n✨ TUDO PRONTO PARA USAR!')
      console.log('\n💻 Próximos passos:')
      console.log('   1. npm run dev')
      console.log('   2. POST /auth/register')
      console.log('   3. POST /auth/login')
      console.log('   4. Usar token em /works')

      pool.end()
      process.exit(0)
    })
  }
})

// Timeout geral para não ficar pendurado
setTimeout(() => {
  console.log('⏰ Timeout - Nenhuma resposta do servidor')
  pool.end()
  process.exit(1)
}, 15000)
