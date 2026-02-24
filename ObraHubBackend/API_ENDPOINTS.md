# 📚 Documentação API ObraHub - Etapas, Ocorrências e Fotos

## 🔐 Autenticação
Todos os endpoints requerem autenticação via Bearer Token no header:
```
Authorization: Bearer {token}
```

---

## 📋 ETAPAS

### POST `/etapas`
**Criar nova etapa**

```json
{
  "obra_id": 1,
  "nome": "Fundação",
  "status": "NaoIniciada",
  "progresso": 0,
  "data_prevista": "2026-04-30"
}
```

**Resposta (201):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "obraId": 1,
    "nome": "Fundação",
    "status": "NaoIniciada",
    "progresso": 0,
    "dataPrevista": "2026-04-30",
    "criadoEm": "2026-02-23T10:00:00Z"
  }
}
```

---

### GET `/etapas/obra/:obra_id`
**Listar todas as etapas de uma obra**

**Parâmetros:**
- `obra_id` (path): ID da obra

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "obraId": 1,
      "nome": "Fundação",
      "status": "Concluida",
      "progresso": 100,
      "dataPrevista": "2026-04-30",
      "criadoEm": "2026-02-20T08:00:00Z"
    }
  ]
}
```

---

### GET `/etapas/:id`
**Obter detalhes de uma etapa**

**Parâmetros:**
- `id` (path): ID da etapa

**Resposta (200):** Retorna dados da etapa

---

### PATCH `/etapas/:id`
**Atualizar etapa**

```json
{
  "nome": "Fundação (Revisado)",
  "status": "EmProgresso",
  "progresso": 50,
  "data_prevista": "2026-05-10"
}
```

---

### DELETE `/etapas/:id`
**Deletar etapa**

**Resposta (200):**
```json
{
  "success": true,
  "message": "Etapa deletada com sucesso"
}
```

---

## 📝 OCORRÊNCIAS

### POST `/ocorrencias`
**Criar nova ocorrência**

```json
{
  "obra_id": 1,
  "data": "2026-02-23",
  "descricao": "Chuva atrasou 2 horas o trabalho",
  "clima": "Chuva forte",
  "equipe": "João Silva, Maria Santos",
  "problemas": "Alagamento no acesso"
}
```

**Resposta (201):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "obraId": 1,
    "data": "2026-02-23",
    "descricao": "Chuva atrasou 2 horas o trabalho",
    "clima": "Chuva forte",
    "equipe": "João Silva, Maria Santos",
    "problemas": "Alagamento no acesso",
    "criadoEm": "2026-02-23T10:30:00Z"
  }
}
```

---

### GET `/ocorrencias/obra/:obra_id`
**Listar ocorrências de uma obra**

**Resposta (200):** Array de ocorrências ordenadas por data DESC

---

### GET `/ocorrencias/:id`
**Obter detalhes de uma ocorrência**

---

### PATCH `/ocorrencias/:id`
**Atualizar ocorrência**

```json
{
  "descricao": "Texto atualizado",
  "clima": "Parcialmente nublado",
  "equipe": "Nova equipe",
  "problemas": "Problema resolvido"
}
```

---

### DELETE `/ocorrencias/:id`
**Deletar ocorrência**

---

## 📸 FOTOS

### POST `/fotos`
**Fazer upload de foto**

```json
{
  "obra_id": 1,
  "data": "2026-02-23",
  "descricao": "Fundação concluída",
  "imagem_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQE..."
}
```

**Notas:**
- A imagem deve ser enviada em base64
- Use `canvas.toDataURL()` ou FileReader para converter no frontend
- Tamanho máximo: 50MB (configurado no servidor)

**Resposta (201):**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "obraId": 1,
    "data": "2026-02-23",
    "descricao": "Fundação concluída",
    "criadoEm": "2026-02-23T11:00:00Z"
  }
}
```

---

### GET `/fotos/obra/:obra_id`
**Listar fotos de uma obra (sem imagens para economizar banda)**

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "obraId": 1,
      "data": "2026-02-23",
      "descricao": "Fundação concluída",
      "criadoEm": "2026-02-23T11:00:00Z"
    }
  ]
}
```

---

### GET `/fotos/:id`
**Obter foto com imagem em base64**

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "obraId": 1,
    "data": "2026-02-23",
    "descricao": "Fundação concluída",
    "imagemBase64": "/9j/4AAQSkZJRgABAQE...",
    "criadoEm": "2026-02-23T11:00:00Z"
  }
}
```

---

### GET `/fotos/:id/download`
**Download da foto como arquivo de imagem**

**Resposta:** Arquivo JPG para download

---

### PATCH `/fotos/:id`
**Atualizar descrição da foto**

```json
{
  "descricao": "Nova descrição"
}
```

---

### DELETE `/fotos/:id`
**Deletar foto**

---

## 🔍 Códigos de Status HTTP

| Código | Significado |
|--------|------------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Requisição inválida (faltam dados) |
| 404 | Recurso não encontrado |
| 500 | Erro do servidor |

---

## 🛡️ Validações

### Etapas
- `obra_id` e `nome` são obrigatórios
- `progresso` máximo: 100%
- `status`: NaoIniciada, EmProgresso, Concluida
- Obra deve pertencer à empresa do usuário

### Ocorrências
- `obra_id`, `data` e `descricao` são obrigatórios
- Obra deve pertencer à empresa do usuário

### Fotos
- `obra_id`, `data` e `imagem_base64` são obrigatórios
- Limite de tamanho: 50MB
- Obra deve pertencer à empresa do usuário

---

## 💾 Armazenamento de Fotos

As fotos são armazenadas como **BYTEA** (binário) no PostgreSQL:
- ✅ Melhor compressão que base64
- ✅ Busca mais rápida
- ✅ Menor consumo de espaço em disco
- ✅ Criptografia nativa do banco

**Fluxo:**
1. Frontend converte imagem → base64
2. Backend converte base64 → Buffer
3. Armazena como BYTEA no DB
4. Ao recuperar, converte Buffer → base64
5. Frontend exibe ou faz download

---

## 🔐 Segurança de Dados

Todos os endpoints verificam:
- ✅ Token de autenticação válido
- ✅ Obra pertence à empresa do usuário
- ✅ Registro pertence à empresa do usuário
- ✅ Validação de campos obrigatórios
