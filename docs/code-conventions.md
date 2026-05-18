# Code Conventions

Convenções de código do projeto EDA-Speeder. Seguir estes padrões em toda alteração.

---

## Python

### Estrutura de rotas

Cada domínio funcional tem seu próprio Blueprint em `routes/`. Nunca adicionar rotas diretamente em `app.py`.

```python
# routes/meu_dominio.py
from flask import Blueprint, request, jsonify
from services.data_manager import data_manager

meu_bp = Blueprint('meu_dominio', __name__)

@meu_bp.route('/minha-rota', methods=['POST'])
def minha_rota():
    ...
```

Exportar o blueprint em `routes/__init__.py` e registrar em `app.py`.

### DataManager

`data_manager` é singleton — importar sempre da instância já criada, nunca instanciar diretamente.

```python
# correto
from services.data_manager import data_manager

# errado
from services.data_manager import DataManager
dm = DataManager()
```

Toda lógica de dados (cálculos, transformações, acesso ao DataFrame) vai em métodos do `DataManager`. Rotas apenas chamam esses métodos e retornam o JSON.

### Naming

| Contexto | Convenção | Exemplo |
|----------|-----------|---------|
| Funções de rota | `snake_case` | `create_df`, `cast_column` |
| Blueprints | `snake_case` + sufixo `_bp` | `upload_bp`, `df_bp` |
| Métodos do DataManager | `snake_case` | `get_metrics`, `get_nulls_detail` |

---

## HTML / Templates

### Herança

Todos os templates estendem `common/base.html`:

```html
{% extends "common/base.html" %}

{% block content %}
...
{% endblock %}

{% block scripts %}
<script src="./static/js/drag-drop.js"></script>
<script src="./static/js/dataframe.js"></script>
{% endblock %}
```

### IDs de elementos dinâmicos

IDs usados pelo JS seguem `camelCase`:

| Elemento | ID |
|----------|----|
| Corpo da tabela de preview | `previewBody` |
| Cabeçalho da tabela de preview | `previewHeader` |
| Corpo da tabela de tipos | `dtypesBody` |
| Corpo da tabela de nulos | `nullsDetailBody` |
| Cabeçalho da tabela de duplicatas | `duplicatesHeader` |
| Corpo da tabela de duplicatas | `duplicatesBody` |
| Widgets | `w-dim`, `w-null`, `w-dup`, `w-out` |

### Bootstrap primeiro

Nunca criar CSS custom para o que o Bootstrap já oferve. CSS custom apenas em casos não cobertos pelo framework.

---

## JavaScript

### Organização por BLOCOs

Cada arquivo JS é organizado em blocos numerados com comentário de seção:

```js
// ===============================
// BLOCO N: Descrição do bloco
// ===============================
```

### Comunicação entre módulos

Usar eventos customizados — nunca chamadas diretas entre arquivos:

```js
// Emitir
element.dispatchEvent(new CustomEvent('file:uploaded', { bubbles: true, detail: arquivo }));

// Receber
document.addEventListener('file:uploaded', (e) => { ... });
```

**Eventos em uso:**

| Evento | Emitido por | Recebido por |
|--------|-------------|--------------|
| `file:uploaded` | `drag-drop.js` | `dataframe.js` |
| `file:loaded` | `sidebar.js` | `dataframe.js` |
| `files:changed` | `dataframe.js` | `sidebar.js` |

### Contrato JS ↔ Backend

- JS **nunca** calcula métricas, manipula DataFrames ou acessa dados brutos
- JS **apenas** faz `fetch()` para o backend e renderiza o JSON recebido
- Todas as chamadas de API usam `fetch()` + `.then()`

### Naming

| Contexto | Convenção | Exemplo |
|----------|-----------|---------|
| Funções | `camelCase` | `renderPreview`, `createDF` |
| Constantes | `UPPER_SNAKE_CASE` | `DTYPE_OPTIONS` |

### Defensive DOM access

Ao acessar elementos que podem não existir na página, verificar antes de usar:

```js
const el = document.getElementById('meuElemento');
if (!el) return;
```

---

## Git

### Mensagens de commit

Seguir o padrão `type: descrição`:

| Tipo | Uso |
|------|-----|
| `feat` | nova funcionalidade |
| `fix` | correção de bug |
| `refactor` | refatoração sem mudança de comportamento |
| `chore` | tarefas de infra, build, docs |
| `style` | mudanças visuais sem lógica |

Cada fase do roadmap fecha em um único commit com a tag da fase (ex: `chore: phase-0 foundation`).

Nunca adicionar `Co-Authored-By: Claude` ou assinatura de agente.
