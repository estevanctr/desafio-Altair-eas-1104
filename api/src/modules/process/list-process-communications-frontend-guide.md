## Guia de Consumo — `GET /processes/:processId/communications`

Guia para o frontend consumir o endpoint que lista todas as movimentações (comunicações) de um processo específico, junto com metadados do processo — incluindo a indicação de trânsito em julgado.

---

### Visão Geral

- **Método:** `GET`
- **URL:** `/processes/:processId/communications`
- **Autenticação:** obrigatória. Envie o JWT no header `Authorization: Bearer <token>`.
- **Paginação:** página fixa de **10 itens**. O cliente só controla qual página buscar.
- **Ordenação:** comunicações são retornadas em ordem **decrescente de `publicationDate`** (mais recente primeiro).
- **Resposta:** `application/json`.

---

### Parâmetros

#### Route param

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `processId` | `uuid` | sim | Identificador do processo (o mesmo `id` retornado por `GET /processes`). |

#### Query params

| Parâmetro | Tipo | Default | Descrição |
|---|---|---|---|
| `page` | `number` | `1` | Página desejada. Valores inválidos ou `<= 0` são normalizados para `1`. |

Este endpoint **não aceita filtros** sobre as comunicações — ele sempre retorna todas as comunicações daquele processo, paginadas.

---

### Exemplos de Requisição

**Primeira página:**
```
GET /processes/9b8c6f1e-2a3d-4e5f-8a1b-6c7d8e9f0a1b/communications
```

**Segunda página:**
```
GET /processes/9b8c6f1e-2a3d-4e5f-8a1b-6c7d8e9f0a1b/communications?page=2
```

**Com fetch (exemplo):**
```ts
const res = await fetch(`/processes/${processId}/communications?page=${page}`, {
  headers: { Authorization: `Bearer ${token}` },
});

if (res.status === 404) {
  // processo não existe — tratar no frontend
}

const data = await res.json();
```

---

### Estrutura da Resposta

**Status:** `200 OK`

```json
{
  "process": {
    "id": "9b8c6f1e-2a3d-4e5f-8a1b-6c7d8e9f0a1b",
    "processNumber": "0001234-56.2024.8.26.0100",
    "courtAcronym": "TJSP",
    "organName": "1ª Vara Cível",
    "hasFinalJudgment": true
  },
  "items": [
    {
      "id": "c1a2b3d4-e5f6-7890-abcd-ef1234567890",
      "externalId": 987654,
      "publicationDate": "2026-04-10T00:00:00.000Z",
      "communicationType": "Sentença",
      "content": "Julgo procedente o pedido...",
      "source": "DJE",
      "aiSummary": "Sentença de procedência do pedido principal.",
      "recipients": [
        {
          "id": "r1",
          "name": "Fulano de Tal",
          "role": "ADVOGADO",
          "oabNumber": "123456",
          "oabState": "SP",
          "isLawyer": true
        }
      ]
    }
  ],
  "total": 7,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

#### Bloco `process` (resumo do processo pai)

| Campo | Tipo | Observação |
|---|---|---|
| `id` | `uuid` | Identificador do processo. |
| `processNumber` | `string` | Número oficial do processo. |
| `courtAcronym` | `string` | Sigla do tribunal. |
| `organName` | `string` | Órgão julgador. |
| **`hasFinalJudgment`** | **`boolean`** | **Indica se o processo já transitou em julgado.** Ver seção abaixo. |

#### Bloco `items` (comunicações)

| Campo | Tipo | Observação |
|---|---|---|
| `items[].id` | `uuid` | Identificador da comunicação. |
| `items[].externalId` | `number` | ID da comunicação na fonte externa (PJe Comunica). |
| `items[].publicationDate` | `string` (ISO) | Data de publicação — converta com `new Date(...)`. |
| `items[].communicationType` | `string` | Tipo da movimentação (ex.: `Intimação`, `Sentença`, `Despacho`). |
| `items[].content` | `string` | Texto integral da comunicação. |
| `items[].source` | `string \| null` | Fonte (ex.: `DJE`). Pode ser `null`. |
| `items[].aiSummary` | `string \| null` | Resumo gerado por IA. Pode ser `null` — trate o fallback na UI. |
| `items[].recipients` | `array` | Destinatários já normalizados (pode ser lista vazia). |
| `items[].recipients[].name` | `string` | Nome do destinatário. |
| `items[].recipients[].role` | `string \| null` | Papel (ex.: `ADVOGADO`, `AUTOR`). |
| `items[].recipients[].oabNumber` | `string \| null` | Número da OAB (somente advogados). |
| `items[].recipients[].oabState` | `string \| null` | UF da OAB. |
| `items[].recipients[].isLawyer` | `boolean` | `true` quando o destinatário é advogado. |

#### Bloco de paginação

| Campo | Tipo | Observação |
|---|---|---|
| `total` | `number` | Total de comunicações do processo (independente da página). |
| `page` | `number` | Página atual. |
| `pageSize` | `number` | Sempre `10`. |
| `totalPages` | `number` | Use para desabilitar o botão "próxima página". |

---

### Campo `hasFinalJudgment` — Trânsito em Julgado

O campo booleano `process.hasFinalJudgment` indica se o processo **já transitou em julgado**, ou seja, se não cabe mais recurso ordinário contra a decisão. É a forma canônica do frontend saber o status final do processo sem precisar interpretar o texto das comunicações.

**Como usar na UI:**

- **`true`** — o processo está encerrado judicialmente. Exibir um badge/selo de destaque (ex.: "Trânsito em julgado") ao lado do número do processo, e opcionalmente bloquear/esconder ações que só fazem sentido em processos ativos.
- **`false`** — o processo ainda está em andamento. Exibir o estado normal.

**Exemplo de renderização:**

```tsx
<header>
  <h1>{data.process.processNumber}</h1>
  {data.process.hasFinalJudgment && (
    <Badge variant="success">Trânsito em julgado</Badge>
  )}
</header>
```

**Observações importantes:**

- O valor é calculado/persistido pelo backend durante a rotina diária de sincronização com o PJe Comunica. Ou seja, a flag reflete o estado conhecido até a última atualização (01:00 UTC). Não espere que ela mude em tempo real ao consumir o endpoint.
- A flag é **do processo**, não de uma comunicação específica. Ela aparece apenas no bloco `process` da resposta — não dentro de cada item de `items`.
- Um processo com `hasFinalJudgment: true` **continua retornando todas as suas comunicações normalmente** por esse endpoint. A flag é apenas informativa; não altera a paginação nem o conteúdo dos itens.

---

### Erros

| Status | Quando ocorre | Ação no frontend |
|---|---|---|
| `400 Bad Request` | `page` inválido em formato não numérico extremo (raro — a maioria dos valores é normalizada). | Exibir mensagem genérica. |
| `401 Unauthorized` | JWT ausente, expirado ou inválido. | Redirecionar para a tela de login. |
| `404 Not Found` | `processId` não existe na base. | Exibir tela/toast de "Processo não encontrado" e oferecer voltar para a listagem. |

Formato do erro `404`:
```json
{
  "statusCode": 404,
  "message": "Process not found",
  "error": "Not Found"
}
```

---

### Boas Práticas de Consumo

- **Prefetch ao navegar a partir da listagem**: como o `processId` já é conhecido em `GET /processes`, dispare a primeira página deste endpoint no hover/clique para reduzir o tempo percebido.
- **Cachear por `processId` + `page`** (ex.: React Query com chave `['process-communications', processId, page]`). Os dados só mudam após a execução do scheduler diário.
- **Resetar `page` para `1`** ao navegar entre processos diferentes.
- **Tratar `aiSummary` e `source` nulos** com placeholders, evitando renderizar `null` na UI.
- **Exibir o badge de trânsito em julgado de forma consistente** — idealmente no header da página de detalhes e também na listagem principal, quando esta começar a expor o campo.
- **Não inferir trânsito em julgado a partir do `communicationType`** (ex.: "Sentença"). Sempre use `process.hasFinalJudgment`, pois a existência de uma sentença não implica trânsito em julgado.
