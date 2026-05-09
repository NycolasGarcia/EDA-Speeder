// Gerencia o sidebar de arquivos: carrega lista ao abrir,
// permite abrir arquivo com clique, rename inline e delete com confirmação.

const sidebar  = document.getElementById('sidebar');
const fileList = document.getElementById('sidebarFileList');

sidebar.addEventListener('show.bs.offcanvas', loadFiles);

// Refresh automático se aberto após novo upload
document.addEventListener('files:changed', () => {
    if (sidebar.classList.contains('show')) loadFiles();
});

function loadFiles() {
    fetch('/files')
        .then(r => r.json())
        .then(data => renderFiles(data.files));
}

function renderFiles(files) {
    fileList.innerHTML = '';

    if (!files || !files.length) {
        fileList.innerHTML = '<p class="text-muted small text-center mt-3">'
            + '<i class="bi bi-inbox me-1"></i>Nenhum arquivo carregado</p>';
        return;
    }

    files.forEach(f => {
        const card = document.createElement('div');
        card.className = 'card shadow-sm';
        card.innerHTML = `
            <div class="card-body d-flex justify-content-between align-items-center bg-body-tertiary py-2 px-3">
                <span class="small text-truncate me-2" style="max-width: 65%;">
                    <i class="bi ${fileIcon(f.name)} me-1"></i>
                    <span class="file-label text-primary-emphasis" style="cursor:pointer;"
                          title="Clique para abrir">${f.name}</span>
                    <input class="form-control form-control-sm d-none file-input" value="${f.name}">
                </span>
                <div class="d-flex gap-1 flex-shrink-0">
                    <button class="btn btn-sm btn-outline-warning border-0 rename-btn" title="Renomear">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success border-0 save-btn d-none" title="Salvar nome">
                        <i class="bi bi-check-lg"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger border-0 delete-btn" title="Apagar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;

        const label     = card.querySelector('.file-label');
        const input     = card.querySelector('.file-input');
        const renameBtn = card.querySelector('.rename-btn');
        const saveBtn   = card.querySelector('.save-btn');
        const deleteBtn = card.querySelector('.delete-btn');

        // Clique no nome → carrega o arquivo
        label.addEventListener('click', () => loadFromSidebar(f.name));

        // Rename inline
        renameBtn.addEventListener('click', () => {
            label.classList.add('d-none');
            input.classList.remove('d-none');
            renameBtn.classList.add('d-none');
            saveBtn.classList.remove('d-none');
            input.focus();
            input.select();
        });

        saveBtn.addEventListener('click', () => doRename(f.name, input.value));

        input.addEventListener('keydown', e => {
            if (e.key === 'Enter')  doRename(f.name, input.value);
            if (e.key === 'Escape') loadFiles();
        });

        // Delete
        deleteBtn.addEventListener('click', () => {
            if (!confirm(`Apagar "${f.name}"?`)) return;
            fetch(`/files/${encodeURIComponent(f.name)}`, { method: 'DELETE' })
                .then(() => loadFiles());
        });

        fileList.appendChild(card);
    });
}

function loadFromSidebar(filename) {
    fetch(`/files/${encodeURIComponent(filename)}/load`, { method: 'POST' })
        .then(r => r.json())
        .then(data => {
            if (data.error) { console.error(data.error); return; }

            bootstrap.Offcanvas.getOrCreateInstance(sidebar).hide();

            // Feedback visual no card de upload (mesmo tratamento do drag-drop)
            const uploadCard = document.getElementById('upload-card');
            if (uploadCard) {
                uploadCard.classList.remove(
                    'border', 'border-primary', 'bg-primary-subtle',
                    'border-danger', 'bg-danger-subtle'
                );
                uploadCard.classList.add('border', 'border-success');
                const span = uploadCard.querySelector('span');
                if (span) span.innerHTML = `<i class="bi bi-file-check"></i> ${filename}`;
            }

            document.dispatchEvent(new CustomEvent('file:loaded', { detail: data }));
        });
}

function doRename(oldName, newName) {
    newName = newName.trim();
    if (!newName || newName === oldName) { loadFiles(); return; }

    fetch('/files/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_name: oldName, new_name: newName })
    })
    .then(() => loadFiles());
}

function fileIcon(name) {
    const ext = name.split('.').pop().toLowerCase();
    const map = {
        csv:  'bi-filetype-csv',
        xlsx: 'bi-filetype-xlsx',
        xls:  'bi-filetype-xls',
        ods:  'bi-filetype-txt',
        json: 'bi-filetype-json',
        txt:  'bi-filetype-txt',
    };
    return map[ext] || 'bi-file-earmark';
}
