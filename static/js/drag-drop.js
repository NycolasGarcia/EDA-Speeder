// Gerencia interação de upload (drag, click, validação visual)
// Recebe: interação do usuário com arquivo
// Retorna: dispara evento customizado com arquivo válido

document.addEventListener('DOMContentLoaded', function () {
    const card = document.querySelector('.card');
    const fileInput = document.getElementById('fileInput');
    const button = card.querySelector('button');
    const fileNameSpan = card.querySelector('span');

    const allowedExtensions = ['csv', 'db', 'json', 'txt', 'xls', 'xlsx'];

    // 🔹 Reset visual do card
    function resetCardStyle() {
        card.classList.remove(
            'border', 'border-primary', 'bg-primary-subtle',
            'border-danger', 'bg-danger-subtle',
            'border-success'
        );
    }

    // 🔹 Valida extensão do arquivo
    function isValidFile(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        return allowedExtensions.includes(ext);
    }

    // 🔹 Mostra nome do arquivo no card
    function showFileName(file, isValid = true) {
        fileNameSpan.innerHTML = `
            <i class="bi ${isValid ? 'bi-file-check' : 'bi-file-x'}"></i> ${file.name}
        `;
    }

    // 🔹 Mostra erro visual + modal
    function showError(file) {
        card.classList.add('border', 'border-danger', 'bg-danger-subtle');

        const invalidFileNameSpan = document.getElementById('invalidFileName');
        if (invalidFileNameSpan) {
            invalidFileNameSpan.textContent = file.name;
        }

        const modal = new bootstrap.Modal(
            document.getElementById('drag-drop-error')
        );
        modal.show();

        showFileName(file, false);
    }

    // 🔹 Handler principal
    function handleFile(file) {
        resetCardStyle();

        if (!isValidFile(file)) {
            showError(file);
            return;
        }

        // sucesso visual
        card.classList.add('border', 'border-success');
        showFileName(file, true);

        // 🔥 DISPARA EVENTO GLOBAL (sem chamar backend direto)
        document.dispatchEvent(
            new CustomEvent('file:uploaded', { detail: file })
        );
    }

    // 🔘 Click → abre seletor
    button.addEventListener('click', () => fileInput.click());

    // 📂 Seleção manual
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) handleFile(file);
    });

    // 🖱️ Drag over
    card.addEventListener('dragover', (e) => {
        e.preventDefault();
        resetCardStyle();
        card.classList.add('border', 'border-primary', 'bg-primary-subtle');
    });

    // 🖱️ Drag leave
    card.addEventListener('dragleave', resetCardStyle);

    // 📥 Drop
    card.addEventListener('drop', (e) => {
        e.preventDefault();
        resetCardStyle();

        const file = e.dataTransfer.files[0];
        if (file) {
            fileInput.files = e.dataTransfer.files;
            handleFile(file);
        }
    });
});