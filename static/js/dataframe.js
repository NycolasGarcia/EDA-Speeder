// ── Helpers ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => new bootstrap.Tooltip(el));
});

function getHeaderRow() {
    const el = document.getElementById('headerRow');
    return el ? (parseInt(el.value) || 0) : 0;
}

function populateTables(tables) {
    const select = document.getElementById('tableSelect');
    select.innerHTML = '';
    tables.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        select.appendChild(opt);
    });
    if (tables.length > 0) {
        select.value = tables[0];
        select.dispatchEvent(new Event('change'));
    }
}


// ===============================
// BLOCO 1: Upload via drag-drop
// ===============================
document.addEventListener('file:uploaded', function (e) {
    const formData = new FormData();
    formData.append('file', e.detail);

    fetch('/upload', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            populateTables(data.tables);
            document.dispatchEvent(new CustomEvent('files:changed'));
        });
});

// BLOCO 1b: Carregar arquivo a partir do sidebar
document.addEventListener('file:loaded', function (e) {
    populateTables(e.detail.tables);
});


// ===============================
// BLOCO 2: Buscar colunas da tabela
// ===============================
document.getElementById('tableSelect').addEventListener('change', function () {
    document.getElementById('headerRow').value = 0;
    fetch('/get-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: this.value, header_row: getHeaderRow() })
    })
    .then(r => r.json())
    .then(data => renderColumns(data.columns));
});

// BLOCO 2b: Atualizar colunas quando header_row muda
document.getElementById('headerRow').addEventListener('change', function () {
    const table = document.getElementById('tableSelect').value;
    if (!table) return;
    fetch('/get-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, header_row: parseInt(this.value) || 0 })
    })
    .then(r => r.json())
    .then(data => renderColumns(data.columns));
});


// ===============================
// BLOCO 3: Renderizar checkboxes de colunas
// ===============================
function renderColumns(columns) {
    const container = document.getElementById('columnSelector');
    container.innerHTML = '';

    columns.forEach((col, i) => {
        const id = `col_${i}`;

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

    createDF();
}


// ===============================
// BLOCO 4: Selecionar / Limpar colunas
// ===============================
document.getElementById('selectAllBtn').addEventListener('click', () => {
    document.querySelectorAll('#columnSelector input').forEach(cb => cb.checked = true);
    createDF();
});

document.getElementById('clearBtn').addEventListener('click', () => {
    document.querySelectorAll('#columnSelector input').forEach(cb => cb.checked = false);
    createDF();
});


// ===============================
// BLOCO 5: Mudança manual de coluna
// ===============================
document.getElementById('columnSelector').addEventListener('change', () => createDF());


// ===============================
// BLOCO 6: Criar DataFrame
// ===============================
function createDF() {
    const table = document.getElementById('tableSelect').value;
    const columns = Array.from(
        document.querySelectorAll('#columnSelector input:checked')
    ).map(cb => cb.value);

    if (!table) return;

    // Sem colunas selecionadas: limpa tudo sem chamar o backend
    if (columns.length === 0) {
        clearAllRenders();
        return;
    }

    fetch('/create-df', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, columns, header_row: getHeaderRow() })
    })
    .then(r => r.json())
    .then(data => {
        if (data.reset_warning) {
            new bootstrap.Modal(document.getElementById('file-df-modal')).show();
        }
        updateMetrics(data.metrics);
        renderPreview(data.preview);
        renderDtypes(data.dtypes);
        renderNullsDetail(data.nulls_detail);
        renderDupsDetail(data.dups_detail);
    });
}

function clearAllRenders() {
    document.getElementById('w-dim').textContent  = '0 x 0';
    document.getElementById('w-null').textContent = '0 (0%)';
    document.getElementById('w-dup').textContent  = '0 (0%)';
    document.getElementById('w-out').textContent  = '-';
    ['previewHeader', 'previewBody', 'dtypesBody',
     'nullsDetailBody', 'duplicatesHeader', 'duplicatesBody'
    ].forEach(id => { document.getElementById(id).innerHTML = ''; });
}


// ===============================
// BLOCO 7: Atualizar widgets
// ===============================
function updateMetrics(m) {
    document.getElementById('w-dim').textContent  = `${m.rows} x ${m.cols}`;
    document.getElementById('w-null').textContent = `${m.nulls_total} (${m.nulls_pct}%)`;
    document.getElementById('w-dup').textContent  = `${m.dup_total} (${m.dup_pct}%)`;
    document.getElementById('w-out').textContent  = '-';
}


// ===============================
// BLOCO 8: Renderizar preview
// ===============================
function renderPreview(data) {
    const header = document.getElementById('previewHeader');
    const body   = document.getElementById('previewBody');
    header.innerHTML = body.innerHTML = '';

    if (!data || !data.length) return;

    const cols = Object.keys(data[0]);

    const hRow = document.createElement('tr');
    cols.forEach(c => {
        const th = document.createElement('th');
        th.textContent = c;
        hRow.appendChild(th);
    });
    header.appendChild(hRow);

    data.forEach(row => {
        const tr = document.createElement('tr');
        cols.forEach(c => {
            const td = document.createElement('td');
            td.textContent = row[c];
            tr.appendChild(td);
        });
        body.appendChild(tr);
    });
}

// BLOCO 8b: Controles de preview (N + head/tail)
function updatePreview() {
    const table   = document.getElementById('tableSelect').value;
    const columns = Array.from(document.querySelectorAll('#columnSelector input:checked'));
    if (!table || columns.length === 0) return;

    const n    = Math.max(1, parseInt(document.getElementById('previewN').value) || 5);
    const tail = document.getElementById('previewTail').checked;

    fetch('/get-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n, tail })
    })
    .then(r => r.json())
    .then(data => renderPreview(data.preview));
}

document.getElementById('previewN').addEventListener('change', updatePreview);
document.getElementById('previewHead').addEventListener('change', updatePreview);
document.getElementById('previewTail').addEventListener('change', updatePreview);


// ===============================
// BLOCO 9: Tipos — dropdown por badge + tooltip de aviso
// ===============================
const DTYPE_OPTIONS = [
    { value: 'int64',      label: 'int64 — Inteiro' },
    { value: 'float64',    label: 'float64 — Decimal' },
    { value: 'object',     label: 'object — Texto' },
    { value: 'bool',       label: 'bool — Booleano' },
    { value: 'datetime64', label: 'datetime64 — Data/Hora' },
    { value: 'category',   label: 'category — Categórico' },
];

function renderDtypes(dtypes) {
    const body = document.getElementById('dtypesBody');
    body.innerHTML = '';

    if (!dtypes || !dtypes.length) return;

    dtypes.forEach(col => {
        const tr = document.createElement('tr');

        // Coluna
        const tdName = document.createElement('td');
        tdName.textContent = col.column;

        // Tipo — dropdown
        const tdType = document.createElement('td');
        const wrapper = document.createElement('div');
        wrapper.className = 'd-flex align-items-center gap-1';

        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown d-inline-block';

        const badge = document.createElement('button');
        badge.className = 'badge bg-secondary border-0 dropdown-toggle';
        badge.type = 'button';
        badge.setAttribute('data-bs-toggle', 'dropdown');
        badge.textContent = col.type;

        const menu = document.createElement('ul');
        menu.className = 'dropdown-menu';

        DTYPE_OPTIONS.forEach(opt => {
            const li  = document.createElement('li');
            const btn = document.createElement('button');
            btn.className = 'dropdown-item' + (col.type.startsWith(opt.value) ? ' active' : '');
            btn.type = 'button';
            btn.textContent = opt.label;
            btn.addEventListener('click', () => castColumn(col.column, opt.value, badge, menu));
            li.appendChild(btn);
            menu.appendChild(li);
        });

        dropdown.appendChild(badge);
        dropdown.appendChild(menu);

        wrapper.appendChild(dropdown);
        tdType.appendChild(wrapper);

        // Exemplo
        const tdEx = document.createElement('td');
        tdEx.className = 'text-truncate';
        tdEx.style.maxWidth = '80px';
        tdEx.textContent = col.example;

        tr.appendChild(tdName);
        tr.appendChild(tdType);
        tr.appendChild(tdEx);
        body.appendChild(tr);
    });
}

function castColumn(column, dtype, badgeEl, menuEl) {
    fetch('/cast-column', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column, dtype })
    })
    .then(r => r.json())
    .then(data => {
        if (data.ok) {
            badgeEl.textContent = data.new_dtype;
            menuEl.querySelectorAll('.dropdown-item').forEach(item => {
                item.classList.toggle(
                    'active',
                    data.new_dtype.startsWith(item.textContent.split(' ')[0])
                );
            });
        } else {
            // Pisca vermelho por 3s para indicar erro
            badgeEl.classList.replace('bg-secondary', 'bg-danger');
            setTimeout(() => badgeEl.classList.replace('bg-danger', 'bg-secondary'), 3000);
        }
    });
}


// ===============================
// BLOCO 10: Diagnóstico de nulos
// ===============================
function renderNullsDetail(nulls) {
    const body = document.getElementById('nullsDetailBody');
    body.innerHTML = '';

    if (!nulls || !nulls.length) {
        body.innerHTML = '<tr><td colspan="3" class="text-center text-success small py-2">'
            + '<i class="bi bi-check-circle me-1"></i>Nenhum nulo encontrado</td></tr>';
        return;
    }

    nulls.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.column}</td><td>${row.count}</td><td>${row.pct}%</td>`;
        body.appendChild(tr);
    });
}


// ===============================
// BLOCO 11: Diagnóstico de duplicatas
// ===============================
function renderDupsDetail(dups) {
    const header = document.getElementById('duplicatesHeader');
    const body   = document.getElementById('duplicatesBody');
    header.innerHTML = body.innerHTML = '';

    if (!dups || !dups.rows.length) {
        body.innerHTML = '<tr><td class="text-center text-success small py-2">'
            + '<i class="bi bi-check-circle me-1"></i>Nenhuma duplicata encontrada</td></tr>';
        return;
    }

    const hRow = document.createElement('tr');
    dups.columns.forEach(c => {
        const th = document.createElement('th');
        th.textContent = c;
        hRow.appendChild(th);
    });
    header.appendChild(hRow);

    dups.rows.forEach(row => {
        const tr = document.createElement('tr');
        dups.columns.forEach(c => {
            const td = document.createElement('td');
            td.textContent = row[c] ?? '';
            tr.appendChild(td);
        });
        body.appendChild(tr);
    });
}
