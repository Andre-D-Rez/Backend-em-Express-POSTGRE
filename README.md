# Backend em Express (Node.js + TypeScript)# Backend-em-Express

API RESTful com autenticação JWT, PostgreSQL e arquitetura em camadas (MVC).

### Vídeo explicativo
Assista ao vídeo para uma explicação/demonstração rapída do projeto (cadastro e login) https://www.youtube.com/watch?v=HAwlWg7ZqnE

Assista ao vídeo para uma explicação/demonstração rapída do projeto (serviço (CRUD)) https://www.youtube.com/watch?v=H9wvEWJCxiY

## 📋 Funcionalidades

### Rotas Públicas
- **POST /api/register** - Cadastro de novos usuários
- **POST /api/login** - Autenticação e geração de token JWT

### Rotas Protegidas
- **GET /api/protected** - Rota acessível apenas com token JWT válido

### CRUD de Séries (protegido por JWT)
Recurso: lista de séries por usuário autenticado. Cada usuário só enxerga e manipula as próprias séries.

Campos do recurso (todos obrigatórios no POST e PUT):
- titulo (string) - obrigatório
- nota (number, 0 a 10) - obrigatório
- numeroTemporadas (number, >=1) - obrigatório
- episodiosTotais (number, >=1) - obrigatório
- episodiosAssistidos (number, >=0 e <= episodiosTotais) - obrigatório
- status (string: planejado | assistindo | concluido) - obrigatório

Endpoints:
- POST /api/series — cria uma série
- GET /api/series — lista séries do usuário (filtros opcionais: status, titulo, nota)
- GET /api/series/:id — detalhes de uma série do usuário
- PUT /api/series/:id — atualização completa
- PATCH /api/series/:id — atualização parcial
- DELETE /api/series/:id — exclusão

Regras de autorização e erros:
- Requer header Authorization: Bearer <token>
- Acesso a recursos de outro usuário retorna 404 (não encontrado)
- Validações retornam 422 com mensagens claras
- Erros de autenticação retornam 401

## 🏗️ Arquitetura

O projeto segue uma arquitetura em camadas:

```
src/
├── config/          # Configurações e validação de variáveis de ambiente
├── controllers/     # Controladores (lógica de requisição/resposta)
├── database/        # Conexão e helpers do PostgreSQL
├── middlewares/     # Middlewares (autenticação, tratamento de erros)
├── models/          # Interfaces de dados (User e Series)
├── routes/          # Definição de rotas
├── services/        # Lógica de negócio
└── utils/           # Utilitários (validadores, logger)
```

## 🚀 Instalação e Execução Local

### Pré-requisitos
- Node.js 18+ e npm
- PostgreSQL (local ou ...)
- Docker (opcional, para rodar PostgreSQL local)

### Passo a Passo

1. **Clone o repositório**
```bash
git clone <seu-repo>
cd Backend-em-Express
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000
JWT_SECRET=uma_chave_segura_aqui
JWT_EXPIRES_IN=1d

# Opção 1: variáveis separadas
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=app_db

# Opção 2: connection string (se definido, sobrescreve as variáveis acima)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db
```

**Banco local com Docker Compose (recomendado):**
```bash
docker compose up -d postgres
```
Adminer (UI web opcional) estará em http://localhost:8080 (server: postgres, user: postgres, pass: postgres, db: app_db)

4. **Execute em modo de desenvolvimento**
```bash
npm run dev
```

5. **Compile para produção**
```bash
npm run build
npm start
```

## 🧪 Testando a API

### Via Script de Testes
```bash
./scripts/test-endpoints.sh
```

### Via Insomnia/Postman
Importe o arquivo `requests/requests.yaml` no Insomnia para testar todos os cenários.

### Exemplos de Requisições

**Cadastro:**
```bash
curl -X POST http://localhost:porta/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João Silva","email":"joao@example.com","password":"S3nh@Forte!"}'
```

**Login:**
```bash
curl -X POST http://localhost:porta/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@example.com","password":"S3nh@Forte!"}'
```

**Rota Protegida:**
```bash
curl -X GET http://localhost:porta/api/protected \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Exemplos rápidos do CRUD de Séries

Criar:
```bash
curl -X POST http://localhost:porta/api/series \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "titulo":"Breaking Bad",
    "nota":9.5,
    "numeroTemporadas":5,
    "episodiosTotais":62,
    "episodiosAssistidos":0,
    "status":"planejado"
  }'
```

Listar com filtros:
```bash
curl -X GET "http://localhost:porta/api/series?status=assistindo&titulo=Break&nota=9" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Atualizar parcialmente (PATCH):
```bash
curl -X PATCH http://localhost:porta/api/series/:id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{ "episodiosAssistidos": 10, "status":"assistindo" }'
```

Deletar:
```bash
curl -X DELETE http://localhost:porta/api/series/:id \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 🔒 Validações Implementadas

### Cadastro (/register)
- ✅ Nome: mínimo 2 caracteres
- ✅ Email: formato válido
- ✅ Senha: mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial
- ✅ Email único (não permite duplicatas)
- ✅ Senha salva como hash (bcrypt)

### Login (/login)
- ✅ Email: formato válido
- ✅ Senha: comparação com hash armazenado
- ✅ Retorna token JWT válido

### Rota Protegida (/protected)
- ✅ Token JWT obrigatório no header Authorization
- ✅ Validação de token (assinatura e expiração)

## 📝 Códigos de Status HTTP

| Código | Significado | Quando ocorre |
|--------|-------------|---------------|
| 200 | OK | Login bem-sucedido |
| 201 | Created | Usuário cadastrado com sucesso |
| 400 | Bad Request | JSON malformado |
| 401 | Unauthorized | Token ausente/inválido ou senha incorreta |
| 404 | Not Found | Usuário não encontrado |
| 422 | Unprocessable Entity | Dados inválidos (validação falhou) |
| 500 | Internal Server Error | Erro no servidor |

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **TypeScript** - Tipagem estática
- **Express** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **pg** - Driver para PostgreSQL
- **JWT** - Autenticação via tokens
- **bcrypt** - Hash de senhas
- **Winston** - Logging estruturado
- **dotenv** - Gerenciamento de variáveis de ambiente