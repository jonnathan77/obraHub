const router = require('express').Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const db = require('../config/database')

//Registrar
router.post('/register', async (req, res) => {
  try {
    const { email, password, nome, empresaid } = req.body

    if (!email || !password || !nome || !empresaid) {
      return res.status(400).json({ error: 'Email, senha, nome e empresaid são obrigatórios' })
    }

    // Verificar se usuário já existe
    const existsQuery = 'SELECT id FROM usuario WHERE email = $1'
    const existsResult = await db.query(existsQuery, [email])

    if (existsResult.rows.length > 0) {
      return res.status(400).json({ error: 'Usuário já existe' })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Inserir novo usuário
    const insertQuery = `
      INSERT INTO usuario (email, senhahash, nome, empresaid)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, nome, empresaid
    `

    const result = await db.query(insertQuery, [email, hashedPassword, nome, empresaid])
    const user = result.rows[0]

    res.status(201).json({
      id: user.id,
      email: user.email,
      nome: user.nome,
      empresaid: user.empresaid
    })
  } catch (error) {
    console.error('Erro ao registrar:', error)
    res.status(500).json({ error: 'Erro ao registrar usuário' })
  }
})

//Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' })
    }

    // Buscar usuário
    const query = 'SELECT id, email, senhahash, nome, empresaid FROM usuario WHERE email = $1'

    console.log(query);
    const result = await db.query(query, [email])

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' })
    }

    const user = result.rows[0]

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.senhahash)

    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha inválidos' })
    }

    // Gerar token JWT com payload correto
    const payload = {
      id: user.id,
      email: user.email,
      empresaid: user.empresaid,
      nome: user.nome
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h',
      algorithm: 'HS256'
    })

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        empresaid: user.empresaid
      }
    })
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    res.status(500).json({ error: 'Erro ao fazer login' })
  }
})

module.exports = router

