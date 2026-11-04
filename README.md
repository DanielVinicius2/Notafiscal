# RecebFiscal – Controle de Recebimento de Notas Fiscais

Sistema web para registrar e conferir as **notas fiscais de mercadorias recebidas** de fornecedores.
É composto por uma **API REST em Spring Boot** (`recebfiscal-backend`) e por uma **interface web em HTML/CSS/JavaScript**
(`recebfiscal-frontend`) que consome essa API.

Projeto desenvolvido para o trabalho *Desenvolvimento Backend com Spring Boot* – UNIFSA.

---

## 1. Sobre o sistema

### O problema
Quando uma empresa recebe mercadorias, cada compra vem acompanhada de uma nota fiscal emitida por um fornecedor.
Sem controle, é fácil lançar a mesma nota duas vezes, receber de fornecedores que não deveriam mais atender,
alterar notas que já foram conferidas ou errar o valor total.

### A solução
O RecebFiscal centraliza esse processo:

1. Cadastra-se o **fornecedor** (com CNPJ único).
2. Lança-se a **nota fiscal** vinculada a esse fornecedor, com seus **itens** (produto, quantidade, valor unitário).
3. O sistema **calcula o valor total** da nota a partir dos itens.
4. A nota segue um fluxo de situação, até ser **conferida** (e travada) ou **cancelada**.

```
                 conferir
   PENDENTE ───────────────▶ CONFERIDA   (travada: não altera nem exclui)
       │
       └───────cancelar────▶ CANCELADA   (não entra no valor acumulado)
```

### Modelo de dados

```
┌─────────────┐ 1      N ┌──────────────┐ 1      N ┌────────────┐
│ Fornecedor  │──────────│  NotaFiscal  │──────────│  ItemNota  │
└─────────────┘          └──────────────┘          └────────────┘
```

| Entidade | Campos principais |
|---|---|
| **Fornecedor** | id, razaoSocial, cnpj (único, 14 dígitos), email, telefone, ativo |
| **NotaFiscal** | id, numero (único), dataEmissao, descricao, status, valorTotal *(calculado)*, fornecedor, itens |
| **ItemNota** | id, descricao, quantidade, valorUnitario, valorTotal *(calculado)*, nota |

A relação é mapeada com `@OneToMany` / `@ManyToOne`. Os itens pertencem à nota (`cascade = ALL` e
`orphanRemoval = true`): excluir a nota exclui seus itens.

---

## 2. Arquitetura

```
┌───────────────────────┐   HTTP / JSON   ┌────────────────────────────────────────┐   JPA    ┌────────────┐
│  recebfiscal-frontend │ ──────────────▶ │            recebfiscal-backend          │ ───────▶ │ PostgreSQL │
│  HTML + CSS + JS      │ ◀────────────── │  Controller → Service → Repository      │ ◀─────── │            │
│  porta 5500           │                 │  porta 8080 · Swagger em /swagger-ui    │          │ porta 5432 │
└───────────────────────┘                 └────────────────────────────────────────┘          └────────────┘
```

### Backend (organização em camadas)

```
recebfiscal-backend/src/main/java/trabalho/anderson/recebfiscal
├── Controller/   Recebe as requisições e devolve ResponseEntity com o status correto
├── Service/      Regras de negócio, conversão entidade ↔ DTO e transações
├── Repository/   Spring Data JPA + Specifications (filtros dinâmicos)
├── Model/        Entidades JPA: Fornecedor, NotaFiscal, ItemNota, StatusNota
├── dto/          Objetos de entrada (com validação) e de saída – as entidades nunca são expostas
├── exception/    Exceções de negócio e GlobalExceptionHandler (@RestControllerAdvice)
└── config/       CORS e configuração do OpenAPI/Swagger
```

### Front-end

```
recebfiscal-frontend
├── index.html    Telas: visão geral, notas, fornecedores e modais
├── css/style.css Estilos
└── js/
    ├── api.js    Comunicação com a API (fetch) e tratamento das mensagens de erro
    └── app.js    Lógica das telas, filtros, editor de itens e ações de status
```

---

## 3. Funcionalidades

### Interface web
- **Visão geral:** total de notas, valor acumulado (sem as canceladas), notas do mês, fornecedores ativos e últimas notas.
- **Notas fiscais:** listar, filtrar, cadastrar e editar com editor de itens (total calculado em tempo real), ver
  detalhes, **conferir**, **cancelar** e excluir.
- **Fornecedores:** listar, filtrar, cadastrar, editar (inclusive ativar/inativar) e excluir.
- As mensagens da API (validação, registro não encontrado, regra de negócio violada) aparecem na tela.

### API
- CRUD completo de fornecedores, notas e itens da nota.
- Filtros por parâmetros de URL, combináveis entre si.
- Validação dos dados e respostas de erro padronizadas.
- Documentação interativa com Swagger.

---

## 4. Regras de negócio

| # | Regra | Resposta |
|---|---|---|
| 1 | Não pode haver dois fornecedores com o mesmo **CNPJ** | 409 |
| 2 | **Fornecedor com notas** não pode ser excluído (deve ser inativado) | 409 |
| 3 | **Fornecedor inativo** não pode receber novas notas | 409 |
| 4 | O **número da nota** não pode se repetir (criação e atualização) | 409 |
| 5 | A **data de emissão** não pode ser futura | 409 |
| 6 | O **valor total é calculado automaticamente** (soma de quantidade × valor unitário dos itens) | — |
| 7 | Somente nota **PENDENTE** pode ser alterada, conferida ou cancelada | 409 |
| 8 | Nota **CONFERIDA** não pode ser excluída | 409 |
| 9 | A nota deve ter **ao menos um item** (não é possível remover o último) | 400 / 409 |
| 10 | Os itens só podem ser alterados em nota **PENDENTE** | 409 |

---

## 5. Endpoints principais

A lista completa, com parâmetros e respostas, está no Swagger.

| Recurso | Endpoints |
|---|---|
| **Fornecedores** | `POST /fornecedores` · `GET /fornecedores` · `GET /fornecedores/{id}` · `PUT /fornecedores/{id}` · `DELETE /fornecedores/{id}` |
| **Notas** | `POST /notas` · `GET /notas` · `GET /notas/{id}` · `PUT /notas/{id}` · `DELETE /notas/{id}` · `PATCH /notas/{id}/conferir` · `PATCH /notas/{id}/cancelar` · `GET /notas/total` |
| **Itens** | `POST /notas/{id}/itens` · `GET /notas/{id}/itens` · `GET /notas/{id}/itens/{itemId}` · `PUT /notas/{id}/itens/{itemId}` · `DELETE /notas/{id}/itens/{itemId}` |

### Filtros

| Endpoint | Parâmetros (todos opcionais) |
|---|---|
| `GET /notas` | `numero`, `fornecedor`, `cnpj`, `status`, `dataInicial`, `dataFinal`, `valorMin`, `valorMax` |
| `GET /fornecedores` | `nome`, `cnpj`, `ativo` |

Exemplo: `GET /notas?fornecedor=silva&status=PENDENTE&dataInicial=2026-11-01&dataFinal=2026-11-30`

### Status HTTP

| Status | Quando |
|---|---|
| 200 | Consulta ou atualização realizada |
| 201 | Registro criado (cabeçalho `Location`) |
| 204 | Exclusão realizada |
| 400 | Dados inválidos, JSON malformado, parâmetro ou período inválido |
| 404 | Registro inexistente |
| 409 | Violação de regra de negócio ou registro duplicado |

Formato único de erro:

```json
{
  "timestamp": "2026-11-03T10:15:30.123",
  "status": 409,
  "erro": "Conflict",
  "mensagem": "Já existe uma nota fiscal com o número 1001.",
  "caminho": "/notas",
  "detalhes": []
}
```

---

## 6. Tecnologias

| Camada | Tecnologias |
|---|---|
| Backend | Java 25, Spring Boot 4.1.2, Spring Web, Spring Data JPA/Hibernate, Bean Validation, Lombok |
| Banco | PostgreSQL |
| Documentação | Springdoc OpenAPI 3.0.3 (Swagger UI) |
| Testes | JUnit 5 e Mockito (camada Service) |
| Front-end | HTML5, CSS3 e JavaScript puro (fetch API) |
| Infra | Docker Compose (apenas o banco) |

---

## 7. Como executar

### 7.1 Pré-requisitos
JDK 25, Maven (ou o `mvnw` do projeto), Python (para servir o front) e PostgreSQL **ou** Docker.

### 7.2 Banco de dados

Com Docker:

```bash
cd recebfiscal-backend
docker compose up -d
```

Sobe o PostgreSQL com o banco `NotaFiscal`, usuário `postgres` e senha `root`.

Sem Docker, crie o banco manualmente (`CREATE DATABASE "NotaFiscal";`). As tabelas são criadas automaticamente pelo
Hibernate. A conexão pode ser alterada pelas variáveis de ambiente `DB_URL`, `DB_USER` e `DB_PASSWORD`.

> ⚠️ Se você já usou uma versão anterior do projeto, apague a tabela antiga: `DROP TABLE nota_fiscal;`

### 7.3 Backend

```bash
cd recebfiscal-backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

- API: http://localhost:8080
- **Swagger UI:** http://localhost:8080/swagger-ui.html
- OpenAPI (JSON): http://localhost:8080/v3/api-docs

### 7.4 Testes

```bash
cd recebfiscal-backend
./mvnw test
```

Os testes da camada Service usam Mockito e não precisam de banco.

### 7.5 Front-end

```bash
cd recebfiscal-frontend
python -m http.server 5500    # Windows: py -m http.server 5500
```

Acesse http://localhost:5500. O endereço da API está em `js/api.js` (`API_BASE_URL`) e o CORS do backend já libera a
porta 5500.

---

## 8. Exemplo de uso rápido

**1) Cadastrar um fornecedor**

```bash
curl -X POST http://localhost:8080/fornecedores \
  -H "Content-Type: application/json" \
  -d '{"razaoSocial":"Distribuidora Silva Ltda","cnpj":"12.345.678/0001-99","email":"contato@silva.com"}'
```

**2) Lançar uma nota com itens** (o total é calculado: 10 × 25,90 + 50 × 1,50 = **334,00**)

```bash
curl -X POST http://localhost:8080/notas \
  -H "Content-Type: application/json" \
  -d '{
        "numero": "1001",
        "dataEmissao": "2026-11-01",
        "fornecedorId": 1,
        "descricao": "Material de escritório",
        "itens": [
          {"descricao": "Caixa de papel A4", "quantidade": 10, "valorUnitario": 25.90},
          {"descricao": "Caneta azul",       "quantidade": 50, "valorUnitario": 1.50}
        ]
      }'
```

**3) Conferir a nota**

```bash
curl -X PATCH http://localhost:8080/notas/1/conferir
```

**4) Tentar excluir a nota conferida** → `409 Conflict` (regra de negócio)

```bash
curl -i -X DELETE http://localhost:8080/notas/1
```

---

## 9. Requisitos do trabalho × onde estão implementados

| Requisito | Implementação |
|---|---|
| Java + Spring Boot, camadas Controller/Service/Repository | Pacotes `Controller`, `Service`, `Repository` |
| Spring Data JPA e banco relacional | PostgreSQL, repositórios JPA e `application.properties` |
| 2+ entidades com `@OneToMany` / `@ManyToOne` | `Fornecedor` ↔ `NotaFiscal` ↔ `ItemNota` |
| CRUD completo | Fornecedores, notas e itens |
| DTOs | Pacote `dto` (records); conversão nos Services |
| `ResponseEntity` e status HTTP | Todos os Controllers (200, 201, 204, 400, 404, 409) |
| Validação | Anotações Bean Validation nos DTOs + `@Valid` |
| Tratamento centralizado de exceções | `GlobalExceptionHandler` (`@RestControllerAdvice`) |
| 2+ critérios de filtragem | `GET /notas` (8 filtros) e `GET /fornecedores` (3 filtros) |
| 3+ regras de negócio no Service | 10 regras (seção 4) |
| Swagger/OpenAPI | Springdoc em `/swagger-ui.html` |
| **Diferenciais** | Testes unitários (Mockito), logs (`@Slf4j`), Docker Compose, relacionamentos adicionais e **front-end integrado** |

---

## 10. Estrutura do repositório

```
.
├── README.md
├── recebfiscal-backend/     API Spring Boot (README próprio com mais detalhes)
└── recebfiscal-frontend/    Interface web (README próprio)
```
