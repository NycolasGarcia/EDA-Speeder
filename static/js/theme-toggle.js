// theme-toggle.js - Versão simplificada e eficiente

(function() {
    // Estado inicial - verifica preferência salva ou do sistema
    let dark_mode = localStorage.getItem('theme') === 'dark' || 
                    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Aplica o tema inicial
    const htmlElement = document.documentElement;
    const toggleButton = document.getElementById('theme_toggle');
    const iconElement = toggleButton?.querySelector('i');
    
    function setTheme(isDark) {
        // Atualiza variável de estado
        dark_mode = isDark;
        
        // Aplica o tema no Bootstrap
        htmlElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
        
        // Salva no localStorage
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
    
    // Aplica tema inicial
    setTheme(dark_mode);
    
    // Adiciona evento de clique
    if (toggleButton) {
        toggleButton.addEventListener('click', () => setTheme(!dark_mode));
    }
    
    // Expor variável global se necessário (opcional)
    window.dark_mode = dark_mode;
    window.setTheme = setTheme;
})();