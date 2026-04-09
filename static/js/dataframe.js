// ===============================
// BLOCO 1: Upload do arquivo
// Escuta evento do drag-drop e envia pro backend
// Recebe: evento 'file:uploaded'
// Retorna: popula dropdown de tabelas
// ===============================
document.addEventListener('file:uploaded', function (e) {
    const file = e.detail;

    const formData = new FormData();
    formData.append('file', file);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        const select = document.getElementById('tableSelect');
        select.innerHTML = '';

        data.tables.forEach(table => {
            const option = document.createElement('option');
            option.value = table;
            option.textContent = table;
            select.appendChild(option);
        });

        // 🔥 resolve bug de tabela única
        if (data.tables.length > 0) {
            select.value = data.tables[0];
            select.dispatchEvent(new Event('change'));
        }
    });
});


// ===============================
// BLOCO 2: Buscar colunas da tabela
// Dispara quando o usuário muda a tabela
// Recebe: evento 'change' do select
// Retorna: renderiza checkboxes de colunas
// ===============================
document.getElementById('tableSelect').addEventListener('change', function () {
    const table = this.value;

    fetch('/get-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table })
    })
    .then(res => res.json())
    .then(data => {
        renderColumns(data.columns);
    });
});


// ===============================
// BLOCO 3: Renderização das colunas
// Cria dinamicamente os checkboxes
// Recebe: lista de colunas
// Retorna: UI atualizada
// ===============================
function renderColumns(columns) {
    const container = document.getElementById('columnSelector');

    container.innerHTML = '';

    columns.forEach((col, index) => {
        const id = `col_${index}`;

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'btn-check';
        input.id = id;
        input.value = col;
        input.checked = true;

        const label = document.createElement('label');
        label.className = 'btn btn-outline-secondary btn-sm';
        label.setAttribute('for', id);
        label.textContent = col;

        container.appendChild(input);
        container.appendChild(label);
    });

    // depois de renderizar → cria DF automaticamente
    createDF();
}


// ===============================
// BLOCO 4: Selecionar / Limpar colunas
// Controla os checkboxes em massa
// Recebe: clique nos botões
// Retorna: altera seleção + recria DF
// ===============================
document.getElementById('selectAllBtn').addEventListener('click', () => {
    document.querySelectorAll('#columnSelector input')
        .forEach(cb => cb.checked = true);

    createDF();
});

document.getElementById('clearBtn').addEventListener('click', () => {
    document.querySelectorAll('#columnSelector input')
        .forEach(cb => cb.checked = false);

    createDF();
});


// ===============================
// BLOCO 5: Detectar mudança manual nas colunas
// Dispara quando usuário marca/desmarca checkbox
// Recebe: evento 'change' no container
// Retorna: recria DF
// ===============================
document.getElementById('columnSelector').addEventListener('change', () => {
    createDF();
});


// ===============================
// BLOCO 6: Criar DataFrame
// Envia seleção atual para o backend
// Recebe: tabela + colunas selecionadas
// Retorna: métricas + preview
// ===============================
function createDF() {
    const table = document.getElementById('tableSelect').value;

    const columns = Array.from(
        document.querySelectorAll('#columnSelector input:checked')
    ).map(cb => cb.value);

    // 🔒 evita chamada vazia
    if (!table || columns.length === 0) return;

    fetch('/create-df', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, columns })
    })
    .then(res => res.json())
    .then(data => {

        // 🔹 aviso de reset
        if (data.reset_warning) {
            const modal = new bootstrap.Modal(
                document.getElementById('file-df-modal')
            );
            modal.show();
        }

        // 🔹 atualiza widgets
        updateMetrics(data.metrics);
        renderPreview(data.preview);

        console.log('Preview:', data.preview);
    });
    
}

// ===============================
// BLOCO 7: Atualizar widgets
// Recebe: métricas do backend
// Retorna: valores nos cards
// ===============================
function updateMetrics(metrics) {
    document.getElementById('w-dim').textContent =
        `${metrics.rows} x ${metrics.cols}`;

    document.getElementById('w-null').textContent =
        `${metrics.nulls_total} (${metrics.nulls_pct}%)`;

    document.getElementById('w-dup').textContent =
        `${metrics.dup_total} (${metrics.dup_pct}%)`;

    // placeholder por enquanto
    document.getElementById('w-out').textContent = '-';
}

// ===============================
// BLOCO 8: Renderizar preview
// Recebe: lista de registros (JSON)
// Retorna: tabela HTML preenchida
// ===============================
function renderPreview(data) {
    const header = document.getElementById('previewHeader');
    const body = document.getElementById('previewBody');

    header.innerHTML = '';
    body.innerHTML = '';

    if (!data || data.length === 0) return;

    const columns = Object.keys(data[0]);

    // 🔹 HEADER
    const headerRow = document.createElement('tr');

    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
    });

    header.appendChild(headerRow);

    // 🔹 BODY
    data.forEach(row => {
        const tr = document.createElement('tr');

        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col];
            tr.appendChild(td);
        });

        body.appendChild(tr);
    });
}

// ===============================
// 🧬 BLOCO 9: Renderizar tipos
// Recebe: lista de tipos
// Retorna: tabela de tipos preenchida
// ===============================
function renderDtypes(dtypes) {
    const body = document.getElementById('dtypesBody');
    body.innerHTML = '';

    if (!dtypes) return;

    dtypes.forEach(col => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${col.column}</td>
            <td>${col.type}</td>
            <td>${col.example}</td>
        `;

        body.appendChild(tr);
    });
}