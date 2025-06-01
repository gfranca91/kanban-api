# Kanban API Backend

API RESTful para um sistema de gerenciamento de tarefas colaborativo no estilo Kanban. Este backend fornece a lógica de negócios e a interface de dados para criar, gerenciar e organizar tarefas em quadros e colunas.

## ✨ Funcionalidades Implementadas

- **Autenticação de Usuários:**
  - Registro de novos usuários (com hash de senha usando bcryptjs).
  - Login de usuários (retornando um JSON Web Token - JWT para sessões).
  - Middleware de proteção de rotas para garantir que apenas usuários autenticados acessem recursos específicos.
- **Gerenciamento de Quadros (Boards):**
  - Criação de novos quadros (associados ao usuário logado).
  - Listagem de todos os quadros pertencentes ao usuário logado.
  - Obtenção de detalhes de um quadro específico por ID (com verificação de propriedade).
  - Atualização de quadros existentes (nome, descrição).
  - Deleção de quadros (e suas colunas/tarefas associadas, devido ao `ON DELETE CASCADE` no DB).
- **Gerenciamento de Colunas (Columns):**
  - Criação de novas colunas dentro de um quadro específico (com cálculo automático de ordem).
  - Listagem de todas as colunas de um quadro específico (ordenadas).
  - Atualização de colunas (título, ordem).
  - Deleção de colunas.
- **Gerenciamento de Tarefas (Tasks/Cards):**
  - Criação de novas tarefas dentro de uma coluna específica (com cálculo automático de ordem).
  - Listagem de todas as tarefas de uma coluna específica (ordenadas).
  - Atualização de tarefas (título, descrição, ordem, coluna de destino, data de entrega, prioridade).
  - Deleção de tarefas.

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js
- **Framework:** Express.js
- **Banco de Dados:** PostgreSQL
- **Autenticação:** JSON Web Tokens (JWT) via `jsonwebtoken`
- **Hashing de Senhas:** `bcryptjs`
- **Gerenciamento de Variáveis de Ambiente:** `dotenv`
- **Driver PostgreSQL:** `pg`
- **Desenvolvimento:** `nodemon` para recarregamento automático do servidor.

## 🚀 Configuração e Instalação

Siga os passos abaixo para configurar e rodar o projeto localmente:

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS recomendada, ex: 18.x ou superior)
- [npm](https://www.npmjs.com/) (geralmente vem com o Node.js) ou [yarn](https://yarnpkg.com/)
- [PostgreSQL](https://www.postgresql.org/download/) instalado e rodando.

### Passos

1.  **Clone o repositório:**

    ```bash
    git clone [https://github.com/SEU_USUARIO/NOME_DO_SEU_REPOSITORIO.git](https://github.com/SEU_USUARIO/NOME_DO_SEU_REPOSITORIO.git)
    cd NOME_DO_SEU_REPOSITORIO
    ```

2.  **Instale as dependências:**

    ```bash
    npm install
    ```

    Ou, se estiver usando yarn:

    ```bash
    yarn install
    ```

3.  **Configure as Variáveis de Ambiente:**

    - Crie um arquivo chamado `.env` na raiz do projeto.
    - Copie o conteúdo do arquivo `.env.example` (se você criar um) ou adicione as seguintes variáveis, substituindo pelos seus valores:
      ```env
      DB_USER=seu_usuario_postgres
      DB_HOST=localhost
      DB_DATABASE=nome_do_seu_banco_kanban
      DB_PASSWORD=sua_senha_postgres
      DB_PORT=5432
      JWT_SECRET=seu_segredo_jwt_super_secreto_e_longo
      PORT=3001
      ```

4.  **Configure o Banco de Dados PostgreSQL:**

    - Certifique-se de que o servidor PostgreSQL esteja rodando.
    - Crie um banco de dados com o nome que você especificou em `DB_DATABASE` (ex: `createdb nome_do_seu_banco_kanban`).
    - Execute os scripts SQL para criar as tabelas (o script que geramos anteriormente). Você pode usar um cliente PostgreSQL como `psql` ou uma ferramenta gráfica como Beekeeper Studio ou pgAdmin para executar o script.
      ```sql
      -- (Cole aqui o conteúdo do seu script SQL CREATE TABLE para users, boards, columns, tasks)
      -- Tabela de Usuários
      CREATE TABLE users (
          user_id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          -- ... resto da definição da tabela users ...
      );
      -- ... e assim por diante para boards, columns, tasks e triggers ...
      ```

5.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    O servidor deverá iniciar (por padrão na porta 3001, ou a que você definiu em `PORT`).

## 🧪 Testando a API

Você pode usar ferramentas como [Postman](https://www.postman.com/) ou [Insomnia](https://insomnia.rest/) para testar os endpoints da API.

### Principais Endpoints

Lembre-se de que as rotas protegidas requerem um token JWT no cabeçalho `Authorization: Bearer <seu_token>`.

- **Autenticação:**
  - `POST /api/users/register` - Registrar novo usuário.
  - `POST /api/users/login` - Fazer login e obter token JWT.
  - `GET /api/users/me` - (Protegido) Obter dados do usuário logado.
- **Quadros (Boards):**
  - `POST /api/boards` - (Protegido) Criar novo quadro.
  - `GET /api/boards` - (Protegido) Listar quadros do usuário.
  - `GET /api/boards/:boardId` - (Protegido) Obter quadro por ID.
  - `PUT /api/boards/:boardId` - (Protegido) Atualizar quadro.
  - `DELETE /api/boards/:boardId` - (Protegido) Deletar quadro.
- **Colunas (Columns):**
  - `POST /api/boards/:boardId/columns` - (Protegido) Criar coluna em um quadro.
  - `GET /api/boards/:boardId/columns` - (Protegido) Listar colunas de um quadro.
  - `PUT /api/columns/:columnId` - (Protegido) Atualizar coluna.
  - `DELETE /api/columns/:columnId` - (Protegido) Deletar coluna.
- **Tarefas (Tasks):**
  - `POST /api/columns/:columnId/tasks` - (Protegido) Criar tarefa em uma coluna.
  - `GET /api/columns/:columnId/tasks` - (Protegido) Listar tarefas de uma coluna.
  - `PUT /api/tasks/:taskId` - (Protegido) Atualizar tarefa.
  - `DELETE /api/tasks/:taskId` - (Protegido) Deletar tarefa.

## 🔮 Próximos Passos e Melhorias Futuras (Sugestões)

- Implementação de uma lógica mais robusta para reordenação de colunas e tarefas.
- Validação de dados mais detalhada para as entradas da API (ex: usando bibliotecas como `joi` ou `express-validator`).
- Funcionalidade de atribuição de usuários a tarefas.
- Adição de comentários em tarefas.
- Upload de anexos para tarefas.
- Melhorias na performance de queries complexas.
- Desenvolvimento do frontend em React (ou outra tecnologia) para consumir esta API.
- Testes unitários e de integração.

## 👤 Autor

- **[Guilherme França / gfranca91]**
- www.linkedin.com/in/guilherme-frança-82a576190
