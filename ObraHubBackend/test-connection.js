#!/usr/bin/env node

/**
 * Script de Teste de Conexão PostgreSQL
 * Use: node test-connection.js
 */

require('dotenv').config()
const { Pool } = require('pg')

console.log('\n🔍 Testando Conexão PostgreSQL...\n')
console.log('📋 Configurações:')
console.log(`   Host: ${process.env.DB_HOST}`)
console.log(`   Port: ${process.env.DB_PORT}`)
console.log(`   Database: ${process.env.DB_NAME}`)
console.log(`   User: ${process.env.DB_USER}`)
console.log(`   Password: ${process.env.DB_PASSWORD ? '✓ Configurada' : '✗ Não configurada'}`)
console.log(`   SSL: Habilitado (rejectUnauthorized: false)\n`)

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
})

pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.log('❌ ERRO DE CONEXÃO:')
    console.log(`   ${err.message}`)
    console.log(`   Código: ${err.code}`)
    
    if (err.code === '28P01') {
      console.log('\n💡 Dica: Erro de autenticação. Verifique:')
      console.log('   1. Se a senha está correta no .env')
      console.log('   2. Se o usuário "postgres" existe no Supabase')
      console.log('   3. Se as credenciais possuem caracteres especiais não escapados')
      console.log('   4. Se o banco está acessível (firewall, IP allowlist)')
    }
    
    pool.end()
    process.exit(1)
  } else {
    console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!')
    console.log(`   Hora do Servidor: ${result.rows[0].now}`)
    pool.end()
    process.exit(0)
  }
})
