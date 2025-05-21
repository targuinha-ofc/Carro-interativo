// js/utils/notificacoes.js <-- CORRIGIDO: Nome do arquivo

/**
 * Referência para o timeout da notificação atual, para poder cancelá-lo.
 * @type {number|null}
 * @private
 */
let notificationTimeout = null;

/**
 * Exibe uma mensagem de notificação na área designada da UI.
 * Remove qualquer notificação anterior antes de exibir a nova.
 * @param {string} message - A mensagem a ser exibida.
 * @param {'info'|'success'|'warning'|'error'} [type='info'] - O tipo de notificação (controla a cor/estilo CSS).
 * @param {number} [duration=4000] - Duração em milissegundos que a notificação ficará visível.
 * @param {object} uiElements - Objeto contendo referências aos elementos da UI (notificationArea, notificationMessage).
 * @param {HTMLElement} uiElements.notificationArea - O elemento container da notificação.
 * @param {HTMLElement} uiElements.notificationMessage - O elemento onde o texto da mensagem será inserido.
 * @returns {void} Esta função não retorna valor.
 * @public
 */
function showNotification(message, type = 'info', duration = 4000, uiElements) {
    // Validação dos elementos da UI necessários
    if (!uiElements?.notificationArea || !uiElements?.notificationMessage) {
        console.warn("showNotification: Elementos da UI de notificação não encontrados ou não fornecidos.", uiElements);
        alert(`Notificação (${type}): ${message}`); // Fallback para alert
        return;
    }

    // Cancela timeout anterior, se existir
    clearTimeout(notificationTimeout);

    // Define a mensagem e as classes CSS
    uiElements.notificationMessage.textContent = message;
    uiElements.notificationArea.className = 'notification'; // Reseta para a classe base
    uiElements.notificationArea.classList.add(type, 'show'); // Adiciona tipo e classe 'show' para ativar CSS
    uiElements.notificationArea.style.display = 'flex'; // Garante visibilidade

    // Define um timeout para esconder a notificação após a duração especificada
    notificationTimeout = setTimeout(() => hideNotification(uiElements), duration);
}

/**
 * Esconde a área de notificação da UI.
 * @param {object} uiElements - Objeto contendo referência à área de notificação.
 * @param {HTMLElement} uiElements.notificationArea - O elemento container da notificação.
 * @returns {void} Esta função não retorna valor.
 * @public
 */
function hideNotification(uiElements) {
    if (!uiElements?.notificationArea) {
        // console.warn("hideNotification: Elemento da área de notificação não encontrado ou não fornecido.");
        return; // Não faz nada se o elemento não existe
    }

    // Remove a classe 'show' para iniciar a animação de fade-out (definida no CSS)
    uiElements.notificationArea.classList.remove('show');

    // Usa um timeout um pouco maior que a transição CSS para realmente esconder o elemento
    // e resetar suas classes, evitando que uma nova notificação rápida herde o tipo antigo.
    const transitionDuration = 500; // Deve corresponder à duração da transição no CSS
    setTimeout(() => {
         // Verifica se a classe 'show' não foi readicionada enquanto esperava
         if (!uiElements.notificationArea.classList.contains('show')) {
             uiElements.notificationArea.style.display = 'none'; // Esconde completamente
             uiElements.notificationArea.className = 'notification'; // Reseta para classe base
         }
    }, transitionDuration);

    // Limpa a referência do timeout global
    clearTimeout(notificationTimeout);
    notificationTimeout = null; // Define como nulo para indicar que não há timeout ativo
}

// Exporta as funções para serem usadas em outros módulos
export { showNotification, hideNotification };