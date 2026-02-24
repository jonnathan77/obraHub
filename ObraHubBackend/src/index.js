require('dotenv').config()
const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth.routes')
const workRoutes = require('./routes/works.routes')
const taskRoutes = require('./routes/tasks.routes')
const etapasRoutes = require('./routes/etapas.routes')
const ocorrenciasRoutes = require('./routes/ocorrencias.routes')
const fotosRoutes = require('./routes/fotos.routes')

const app = express()

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb' }))

app.use('/auth', authRoutes)
app.use('/works', workRoutes)
app.use('/tasks', taskRoutes)
app.use('/etapas', etapasRoutes)
app.use('/ocorrencias', ocorrenciasRoutes)
app.use('/fotos', fotosRoutes)

app.get('/', (req, res) => {
  res.send('ObraHub API rodando 🚀')
})

app.listen(3000, () => {
  console.log('🔥 API rodando na porta 3000')
})
