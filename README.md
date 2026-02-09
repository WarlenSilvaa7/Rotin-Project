
---

# 📅 Rotin - Gestão de Estudos Full Stack

O **Rotin** é uma plataforma de organização acadêmica projetada para centralizar o gerenciamento de tarefas e cronogramas de estudo. Este projeto foi concebido para demonstrar proficiência em arquitetura de microsserviços, integração de APIs assíncronas e deploy em ambientes de nuvem diversificados.

## 🌐 Live Demo

* **Frontend (Production):** [https://rotin-de4f0.web.app](https://rotin-de4f0.web.app)

## 🧠 Arquitetura e Decisões Técnicas

Diferente de aplicações monolíticas, o Rotin utiliza uma separação clara de responsabilidades:

* **Frontend Decoupling**: Interface desenvolvida com **React** e **Vite**, garantindo performance e uma SPA (Single Page Application) fluida, hospedada no **Firebase Hosting** para entrega global de baixa latência.
* **Async Backend**: Escolhi o **FastAPI** (Python) pela sua natureza assíncrona, ideal para operações de I/O intensas com o banco de dados, resultando em respostas mais rápidas para o usuário.
* **NoSQL Flexibility**: O uso do **MongoDB Atlas** permitiu um esquema flexível para as notas de estudo, facilitando a evolução de funcionalidades como anexos e categorias.

## 🛠️ Funcionalidades Detalhadas

* **Autenticação Centralizada**: Login via **Google OAuth 2.0** integrado ao Firebase, garantindo segurança e facilidade de acesso.
* **CRUD de Estudos**: Sistema completo para criar, ler, atualizar e deletar tarefas acadêmicas com persistência em nuvem.
* **Ambiente Cloud-Native**: Configuração de **CORS** personalizada e variáveis de ambiente segregadas para produção e desenvolvimento.

## ⚙️ Configuração do Ambiente (Local)

Para rodar este projeto, você precisará configurar as variáveis de ambiente:

### 1. Backend

Crie um arquivo `.env` na raiz do backend:

```env
MONGODB_URI=sua_uri_do_atlas
SECRET_KEY=sua_chave_secreta

```

Instale e rode:

```bash
pip install -r requirements.txt
uvicorn main:app --reload

```

### 2. Frontend

Configure as chaves do Firebase no seu ambiente local e execute:

```bash
npm install
npm run dev

```

## 🛡️ Boas Práticas

* **Clean Code**: Código organizado seguindo padrões de legibilidade e separação de lógica.
* **DevOps**: Workflow de deploy automatizado via Render e Firebase CLI.

---
