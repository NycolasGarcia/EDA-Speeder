# API Contract

Contrato JSON de cada rota do backend. Toda lógica de dados é processada no servidor — o JS apenas renderiza o que recebe.

---

## POST /upload

Recebe um arquivo e inicializa o DataManager.

**Request:** `multipart/form-data`
- `file` — arquivo a carregar (csv, xlsx, xls, ods, json)

**Response 200**
```json
{
  "tables": ["Sheet1", "Sheet2"]
}
```

**Errors**
- `400` — nenhum arquivo enviado

---

## POST /get-columns

Retorna as colunas de uma tabela sem criar o DataFrame de trabalho.

**Request:** `application/json`
```json
{
  "table": "Sheet1",
  "header_row": 0
}
```

**Response 200**
```json
{
  "columns": ["col_a", "col_b", "col_c"]
}
```

---

## POST /create-df

Cria o DataFrame de trabalho com as colunas selecionadas. Retorna tudo o que a página precisa para renderizar.

**Request:** `application/json`
```json
{
  "table": "Sheet1",
  "columns": ["col_a", "col_b"],
  "header_row": 0
}
```

**Response 200**
```json
{
  "reset_warning": false,
  "metrics": {
    "rows": 100,
    "cols": 2,
    "nulls_total": 5,
    "nulls_pct": 5.0,
    "dup_total": 3,
    "dup_pct": 3.0
  },
  "preview": [
    { "col_a": "valor", "col_b": "valor" }
  ],
  "dtypes": [
    { "column": "col_a", "type": "object", "example": "valor" }
  ],
  "nulls_detail": [
    { "column": "col_a", "count": 5, "pct": 5.0 }
  ],
  "dups_detail": {
    "columns": ["col_a", "col_b"],
    "rows": [
      { "col_a": "valor", "col_b": "valor" }
    ]
  }
}
```

**Notas**
- `reset_warning: true` indica que havia mudanças não exportadas no DataFrame anterior
- `nulls_detail` contém apenas colunas com pelo menos 1 nulo
- `dups_detail.rows` contém as linhas duplicadas (máx. 10), com todas as colunas do DataFrame

---

## POST /get-preview

Retorna preview do DataFrame ativo (head ou tail).

**Request:** `application/json`
```json
{
  "n": 5,
  "tail": false
}
```

**Response 200**
```json
{
  "preview": [
    { "col_a": "valor", "col_b": "valor" }
  ]
}
```

**Notas**
- `n` é clampeado entre 1 e 1000
- Retorna `[]` se nenhum DataFrame estiver ativo

---

## POST /cast-column

Altera o dtype de uma coluna do DataFrame ativo.

**Request:** `application/json`
```json
{
  "column": "col_a",
  "dtype": "float64"
}
```

**dtypes aceitos:** `int64`, `float64`, `object`, `bool`, `datetime64`, `category`

**Response 200**
```json
{
  "ok": true,
  "new_dtype": "float64"
}
```

**Error 400**
```json
{
  "error": "mensagem de erro do pandas"
}
```

---

---

## POST /nulls/column-stats

Retorna estatísticas de nulos de uma coluna específica (para popular o painel de ação).

**Request:** `application/json`
```json
{ "column": "col_a" }
```

**Response 200**
```json
{
  "column": "col_a",
  "dtype": "float64",
  "count": 5,
  "pct": 5.0,
  "mode": "1.0",
  "mean": 42.3,
  "median": 40.0
}
```

**Notas**
- `mean` e `median` são `null` para colunas não-numéricas
- `mode` pode ser `null` se a coluna estiver completamente vazia

---

## POST /nulls/impute

Imputa nulos de uma coluna com um valor fixo.

**Request:** `application/json`
```json
{ "column": "col_a", "value": "42" }
```

**Response 200**
```json
{
  "ok": true,
  "metrics":      { "rows": 97, "cols": 3, "nulls_total": 2, "nulls_pct": 0.68, "dup_total": 0, "dup_pct": 0 },
  "nulls_detail": [ { "column": "col_b", "count": 2, "pct": 2.06 } ],
  "dtypes":       [ { "column": "col_a", "type": "float64", "example": "1.0" } ]
}
```

---

## POST /nulls/drop-rows

Remove todas as linhas que têm nulo na coluna especificada.

**Request:** `application/json`
```json
{ "column": "col_a" }
```

**Response 200** — mesma estrutura de `/nulls/impute`

---

## POST /nulls/drop-column

Remove a coluna inteira do DataFrame ativo.

**Request:** `application/json`
```json
{ "column": "col_a" }
```

**Response 200** — mesma estrutura de `/nulls/impute`

---

## GET /files

Lista arquivos disponíveis na pasta `uploads/`.

**Response 200**
```json
{
  "files": [
    { "name": "dados.csv", "size": 12345 }
  ]
}
```

---

## POST /files/rename

Renomeia um arquivo na pasta `uploads/`.

**Request:** `application/json`
```json
{
  "old_name": "dados.csv",
  "new_name": "dados_v2.csv"
}
```

**Response 200**
```json
{ "ok": true }
```

**Errors**
- `400` — nome inválido ou ausente
- `404` — arquivo não encontrado

---

## DELETE /files/`<filename>`

Remove um arquivo da pasta `uploads/`.

**Response 200**
```json
{ "ok": true }
```

**Errors**
- `404` — arquivo não encontrado

---

## POST /files/`<filename>`/load

Carrega um arquivo já existente na pasta `uploads/` no DataManager (sem re-upload).

**Response 200**
```json
{
  "tables": ["Sheet1"]
}
```

**Errors**
- `404` — arquivo não encontrado
