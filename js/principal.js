// js/principal.js
'use strict';

// --- Importações ---
import Garagem from './models/garagem.js';
import Manutencao from './models/manutençao.js';
import Carro from './models/Carro.js';
import CarroEsportivo from './models/Carroesportivo.js';
import Caminhao from './models/caminhao.js';
import { showNotification, hideNotification } from './utils/app.js';

// --- Referências aos Elementos da UI (Garagem) ---
const ui = {
    modalAdicionar: document.getElementById('modalAdicionarVeiculo'),
    btnAbrirModalAdicionar: document.getElementById('btnAbrirModalAdicionar'),
    btnFecharModalAdicionar: document.getElementById('btnFecharModalAdicionar'),
    formNovoVeiculo: document.getElementById('formNovoVeiculo'),
    novoVeiculoTipo: document.getElementById('novoVeiculoTipo'),
    novoVeiculoModelo: document.getElementById('novoVeiculoModelo'),
    novoVeiculoCor: document.getElementById('novoVeiculoCor'),
    divCapacidadeCaminhao: document.getElementById('divCapacidadeCaminhao'),
    novoVeiculoCapacidade: document.getElementById('novoVeiculoCapacidade'),
    listaVeiculosSidebar: document.getElementById('listaVeiculosSidebar'),
    painelVeiculoSelecionado: document.getElementById('painelVeiculoSelecionado'),
    mensagemSelecione: document.getElementById('mensagem-selecione'),
    imagemVeiculo: document.getElementById('imagemVeiculo'),
    infoModeloTipo: document.getElementById('info-modelo-tipo'),
    infoCor: document.getElementById('info-cor'),
    infoId: document.getElementById('info-id'),
    botaoRemoverVeiculoHeader: document.getElementById('botaoRemoverVeiculoHeader'),
    tabLinks: document.querySelectorAll('.tab-link'),
    tabContents: document.querySelectorAll('.tab-content'),
    infoStatusMotorContainer: document.querySelector('.status-motor-container'),
    infoStatusMotor: document.getElementById('info-status-motor'),
    barraProgressoContainer: document.getElementById('barraProgressoContainer'),
    velocidadeAtual: document.getElementById('velocidadeAtual'),
    velocimetroProgressoPath: null,
    infoEspecifica: document.getElementById('info-especifica'),
    botoesAcoesContainer: document.getElementById('botoesAcoes'),
    formManutencaoContainer: document.getElementById('formManutencaoContainer'),
    formManutencao: document.getElementById('formManutencao'),
    manutencaoDataHora: document.getElementById('manutencaoDataHora'),
    manutencaoTipo: document.getElementById('manutencaoTipo'),
    manutencaoCusto: document.getElementById('manutencaoCusto'),
    manutencaoDescricao: document.getElementById('manutencaoDescricao'),
    historicoUl: document.querySelector('#historicoManutencao .lista-itens'),
    agendamentosUl: document.querySelector('#agendamentosFuturos .lista-itens'),
    notificationArea: document.getElementById('notification-area'),
    notificationMessage: document.getElementById('notification-message'),
    notificationCloseBtn: document.querySelector('#notification-area .close-btn'),
    btnVerDetalhesExtras: document.getElementById('btnVerDetalhesExtras'),
    detalhesExtrasVeiculoDiv: document.getElementById('detalhesExtrasVeiculo'),

    // --- Referências UI (Previsão do Tempo) ---
    cidadeInputTempo: document.getElementById('cidade-input-tempo'),
    verificarClimaBtn: document.getElementById('verificar-clima-btn'),
    previsaoResultadoDivTempo: document.getElementById('previsao-tempo-resultado'),
    statusMensagemTempoDiv: document.getElementById('status-mensagem-tempo'),
};

// --- Instância Principal da Aplicação (Garagem) ---
const minhaGaragem = new Garagem();

// --- Variáveis Globais ---
let velocimetroPathLength = 251.2;

// ATENÇÃO: ARMAZENAR A API KEY DIRETAMENTE NO CÓDIGO FRONTEND É INSEGURO!
// Em uma aplicação real, a chave NUNCA deve ficar exposta aqui.
// A forma correta envolve um backend (Node.js, Python, Serverless Function) atuando como proxy
// para proteger a chave.
// Para FINS DIDÁTICOS nesta atividade, vamos usá-la aqui temporariamente.
const WEATHER_API_KEY = "569ee28c1908ad6eaadb431e635166be"; // <-- SUA CHAVE FOI INSERIDA AQUI


// --- Funções de Atualização da Interface Gráfica (UI) - GARAGEM ---
// ... (todas as funções de atualizarListaVeiculosSidebar, ativarTab, atualizarVelocimetro, renderizarListaManutencao, atualizarPainelVeiculoSelecionado, atualizarInterfaceCompleta da Garagem permanecem aqui, sem alterações diretas nessa parte) ...
// Colarei elas abaixo para manter a integridade do arquivo

/** Atualiza a lista de veículos na barra lateral. */
function atualizarListaVeiculosSidebar() {
    const listaUl = ui.listaVeiculosSidebar;
    if (!listaUl) {
        console.error("Elemento #listaVeiculosSidebar não encontrado.");
        return;
    }
    listaUl.innerHTML = '';

    if (minhaGaragem.veiculos.length === 0) {
        listaUl.innerHTML = '<li class="placeholder">Nenhum veículo na garagem.</li>';
        return;
    }
    const veiculosParaExibir = [...minhaGaragem.veiculos];
    veiculosParaExibir.forEach(v => {
        const li = document.createElement('li');
        li.dataset.id = v.id;
        let iconClass = 'fa-car';
        if (v instanceof CarroEsportivo) iconClass = 'fa-rocket';
        else if (v instanceof Caminhao) iconClass = 'fa-truck';
        li.innerHTML = `<i class="fas ${iconClass}"></i> <span>${v.modelo} (${v.cor})</span>`;
        if (v.id === minhaGaragem.veiculoSelecionadoId) {
            li.classList.add('selecionado');
        }
        li.addEventListener('click', () => {
             if (v.id !== minhaGaragem.veiculoSelecionadoId) {
                 if(minhaGaragem.selecionarVeiculo(v.id)){
                    ativarTab('tab-visao-geral');
                    atualizarInterfaceCompleta();
                 } else {
                     console.warn(`Falha ao selecionar veículo ID: ${v.id}`);
                 }
             }
        });
        listaUl.appendChild(li);
    });
}
function ativarTab(tabId) {
    if (!ui.tabContents || !ui.tabLinks) return;
    ui.tabContents.forEach(content => content?.classList.remove('active'));
    ui.tabLinks.forEach(link => {
        link?.classList.remove('active');
        link?.setAttribute('aria-selected', 'false');
    });
    const contentToActivate = document.getElementById(tabId);
    const linkToActivate = document.querySelector(`.tab-link[data-tab="${tabId}"]`);
    if (contentToActivate) contentToActivate.classList.add('active');
    if (linkToActivate) {
        linkToActivate.classList.add('active');
        linkToActivate.setAttribute('aria-selected', 'true');
    }
}
function atualizarVelocimetro(velocidade, velocidadeMaxima) {
    if (!ui.velocimetroProgressoPath && ui.painelVeiculoSelecionado?.style.display !== 'none') {
        ui.velocimetroProgressoPath = ui.painelVeiculoSelecionado.querySelector('.velocimetro-progresso');
        if (!ui.velocimetroProgressoPath) {
             if(ui.barraProgressoContainer) ui.barraProgressoContainer.style.display = 'none';
             return;
        }
    }
    if (!ui.barraProgressoContainer || ui.barraProgressoContainer.style.display === 'none' || !ui.velocimetroProgressoPath) {
        if (ui.velocidadeAtual) ui.velocidadeAtual.textContent = '0 km/h';
        if (ui.velocimetroProgressoPath) ui.velocimetroProgressoPath.style.strokeDashoffset = velocimetroPathLength;
        return;
    }
    if (!ui.velocidadeAtual) return;
    const maxVel = Math.max(1, velocidadeMaxima);
    const velocidadeAtualDisplay = Math.max(0, Math.min(velocidade, maxVel));
    const porcentagem = velocidadeAtualDisplay / maxVel;
    const offset = velocimetroPathLength * (1 - porcentagem);
    try {
        ui.velocimetroProgressoPath.style.strokeDashoffset = offset;
        ui.velocidadeAtual.textContent = `${Math.round(velocidadeAtualDisplay)} km/h`;
        let corProgresso = 'var(--cor-primaria)';
        if (porcentagem > 0.85) corProgresso = 'var(--cor-perigo)';
        else if (porcentagem > 0.6) corProgresso = 'var(--cor-aviso)';
        ui.velocimetroProgressoPath.style.stroke = corProgresso;
    } catch (e) {
        if(ui.barraProgressoContainer) ui.barraProgressoContainer.style.display = 'none';
    }
}
function renderizarListaManutencao(ulElement, itens) {
     if (!ulElement) return;
     ulElement.innerHTML = '';
     if (!itens || itens.length === 0) {
          const tipoListaTexto = ulElement.closest('.maintenance-list')?.id === 'historicoManutencao'
            ? 'histórico'
            : 'agendamentos';
          ulElement.innerHTML = `<li class="placeholder">Nenhum registro de ${tipoListaTexto} encontrado.</li>`;
          return;
     }
     itens.forEach(item => {
         const li = document.createElement('li');
         li.dataset.itemId = item.id;
         const textoSpan = document.createElement('span');
         textoSpan.textContent = item.texto;
         li.appendChild(textoSpan);
         const removeButton = document.createElement('button');
         removeButton.className = 'botao-remover-item';
         removeButton.title = 'Remover este item';
         removeButton.innerHTML = '<i class="fas fa-times"></i>';
         removeButton.setAttribute('aria-label', `Remover item de manutenção: ${item.texto.substring(0, 30)}...`);
         li.appendChild(removeButton);
         ulElement.appendChild(li);
     });
}
function atualizarPainelVeiculoSelecionado() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (ui.detalhesExtrasVeiculoDiv) {
        ui.detalhesExtrasVeiculoDiv.innerHTML = '';
        ui.detalhesExtrasVeiculoDiv.style.display = 'none';
    }
    if (ui.btnVerDetalhesExtras) {
        ui.btnVerDetalhesExtras.style.display = 'none';
        ui.btnVerDetalhesExtras.disabled = false;
    }
    if (veiculo) {
        if (ui.painelVeiculoSelecionado) ui.painelVeiculoSelecionado.style.display = 'block';
        if (ui.mensagemSelecione) ui.mensagemSelecione.style.display = 'none';
        const baseInfo = veiculo.exibirInformacoesBase();
        if(ui.infoModeloTipo) ui.infoModeloTipo.textContent = `${baseInfo.modelo} (${veiculo.constructor.name})`;
        if(ui.infoCor) ui.infoCor.textContent = baseInfo.cor;
        if(ui.infoId) ui.infoId.textContent = baseInfo.id;
        if(ui.botaoRemoverVeiculoHeader) ui.botaoRemoverVeiculoHeader.style.display = 'inline-flex';
        let imagemSrc = 'imagens/carro_normal.png';
        if (veiculo instanceof CarroEsportivo) imagemSrc = 'imagens/carro_esportivo.png';
        else if (veiculo instanceof Caminhao) imagemSrc = 'imagens/caminhao.png';
        if (ui.imagemVeiculo) {
            ui.imagemVeiculo.src = imagemSrc;
            ui.imagemVeiculo.alt = `Imagem de ${veiculo.modelo}`;
        }
        if (ui.btnVerDetalhesExtras) ui.btnVerDetalhesExtras.style.display = 'inline-flex';
        if(ui.infoEspecifica) ui.infoEspecifica.innerHTML = '';
        if(ui.barraProgressoContainer) ui.barraProgressoContainer.style.display = 'none';
        if(ui.infoStatusMotorContainer) ui.infoStatusMotorContainer.style.display = 'none';
        if(ui.botoesAcoesContainer) ui.botoesAcoesContainer.querySelectorAll('button').forEach(btn => btn.style.display = 'none');
        if (veiculo instanceof Carro) {
            const dadosCarro = veiculo.getDadosEspecificos();
            if (ui.infoStatusMotorContainer && ui.infoStatusMotor) {
                ui.infoStatusMotorContainer.style.display = 'block';
                ui.infoStatusMotor.innerHTML = dadosCarro.ligado
                    ? "<i class='fas fa-circle status-on'></i> Ligado"
                    : "<i class='fas fa-circle status-off'></i> Desligado";
            }
            ui.velocimetroProgressoPath = ui.painelVeiculoSelecionado?.querySelector('.velocimetro-progresso');
            if (ui.velocimetroProgressoPath && ui.barraProgressoContainer) {
                 ui.barraProgressoContainer.style.display = 'flex';
                 atualizarVelocimetro(dadosCarro.velocidade, dadosCarro.velocidadeMaxima);
            } else {
                 if(ui.barraProgressoContainer) ui.barraProgressoContainer.style.display = 'none';
            }
            const btnLigar = ui.botoesAcoesContainer?.querySelector('[data-action="ligar"]');
            const btnDesligar = ui.botoesAcoesContainer?.querySelector('[data-action="desligar"]');
            const btnAcelerar = ui.botoesAcoesContainer?.querySelector('[data-action="acelerar"]');
            const btnFrear = ui.botoesAcoesContainer?.querySelector('[data-action="frear"]');
            if(btnLigar) { btnLigar.style.display = 'inline-flex'; btnLigar.disabled = dadosCarro.ligado; }
            if(btnDesligar) { btnDesligar.style.display = 'inline-flex'; btnDesligar.disabled = !dadosCarro.ligado; }
            if(btnAcelerar) { btnAcelerar.style.display = 'inline-flex'; btnAcelerar.disabled = !dadosCarro.ligado || dadosCarro.velocidade >= dadosCarro.velocidadeMaxima; }
            if(btnFrear) { btnFrear.style.display = 'inline-flex'; btnFrear.disabled = !dadosCarro.ligado || dadosCarro.velocidade === 0; }
            if (veiculo instanceof CarroEsportivo) {
                if(ui.infoEspecifica) ui.infoEspecifica.innerHTML = `<p><i class="fas fa-bolt"></i> <strong>Boost:</strong> <span>${!dadosCarro.turboBoostUsado ? 'Disponível' : 'Já usado!'}</span></p>`;
                 const btnTurbo = ui.botoesAcoesContainer?.querySelector('[data-action="ativarTurbo"]');
                 if(btnTurbo) {
                     btnTurbo.style.display = 'inline-flex';
                     btnTurbo.disabled = dadosCarro.turboBoostUsado || !dadosCarro.ligado || dadosCarro.velocidade === 0;
                 }
            } else if (veiculo instanceof Caminhao) {
                if(ui.infoEspecifica) ui.infoEspecifica.innerHTML = `<p><i class="fas fa-weight-hanging"></i> <strong>Carga:</strong> <span>${dadosCarro.cargaAtual ?? 0} / ${dadosCarro.capacidadeCarga ?? '?'} kg</span></p>`;
                 const btnCarregar = ui.botoesAcoesContainer?.querySelector('[data-action="carregar"]');
                 const btnDescarregar = ui.botoesAcoesContainer?.querySelector('[data-action="descarregar"]');
                 if(btnCarregar) {
                     btnCarregar.style.display = 'inline-flex';
                     btnCarregar.disabled = dadosCarro.ligado || dadosCarro.cargaAtual >= dadosCarro.capacidadeCarga;
                 }
                 if(btnDescarregar) {
                     btnDescarregar.style.display = 'inline-flex';
                     btnDescarregar.disabled = dadosCarro.ligado || dadosCarro.cargaAtual === 0;
                 }
            } else {
                 if(ui.infoEspecifica) ui.infoEspecifica.innerHTML = '<p><i>Este é um carro padrão.</i></p>';
            }
        } else {
             if(ui.infoEspecifica) ui.infoEspecifica.innerHTML = '<p><i>Controles de condução não disponíveis para este tipo de veículo.</i></p>';
             atualizarVelocimetro(0, 1);
        }
        renderizarListaManutencao(ui.historicoUl, veiculo.getHistoricoPassadoFormatado());
        renderizarListaManutencao(ui.agendamentosUl, veiculo.getAgendamentosFuturosFormatados());
    } else {
        if(ui.painelVeiculoSelecionado) ui.painelVeiculoSelecionado.style.display = 'none';
        if(ui.mensagemSelecione) ui.mensagemSelecione.style.display = 'block';
        ui.velocimetroProgressoPath = null;
        atualizarVelocimetro(0, 1);
    }
}
function atualizarInterfaceCompleta() {
    atualizarListaVeiculosSidebar();
    atualizarPainelVeiculoSelecionado();
}

// --- Funções de Interação e Gerenciamento (Garagem) ---
function lidarComAcaoVeiculo(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const acao = button.dataset.action;
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo) {
        showNotification("Selecione um veículo na lista lateral primeiro!", 'warning', 3000, ui);
        return;
    }
    let precisaSalvar = false;
    let resultadoAcao = { success: false, message: `Ação '${acao}' não implementada ou falhou.` };
    try {
        if (typeof veiculo[acao] === 'function') {
             resultadoAcao = veiculo[acao]();
             if (resultadoAcao === undefined || resultadoAcao === null) resultadoAcao = { success: true };
             precisaSalvar = resultadoAcao.success;
         } else {
              resultadoAcao = { success: false, message: `Ação '${acao}' inválida para este veículo.` };
         }
        if (resultadoAcao.message) {
            let notificationType = resultadoAcao.success ? 'info' : 'warning';
            if (resultadoAcao.success && ['ativarTurbo', 'carregar', 'descarregar'].includes(acao)) notificationType = 'success';
            else if (!resultadoAcao.success && !resultadoAcao.message.toLowerCase().includes('máxima') && !resultadoAcao.message.toLowerCase().includes('parado') && !resultadoAcao.message.toLowerCase().includes('já estava') && !resultadoAcao.message.toLowerCase().includes('primeiro') && !resultadoAcao.message.toLowerCase().includes('inválida')) notificationType = 'error';
            showNotification(resultadoAcao.message, notificationType, 3500, ui);
        } else if (resultadoAcao.success && (acao === 'acelerar' || acao === 'frear')) { /* No notification */ }
        else if (resultadoAcao.success) showNotification(`${veiculo.modelo} ${acao} com sucesso.`, 'success', 2000, ui);
    } catch (error) {
        showNotification(`Ocorreu um erro inesperado ao executar a ação '${acao}'. Verifique o console.`, 'error', 5000, ui);
    } finally {
        if (precisaSalvar) minhaGaragem.salvarNoLocalStorage();
        atualizarPainelVeiculoSelecionado();
    }
}
function adicionarNovoVeiculo(event) {
    event.preventDefault();
    if (!ui.novoVeiculoTipo || !ui.novoVeiculoModelo || !ui.novoVeiculoCor || !ui.novoVeiculoCapacidade || !ui.divCapacidadeCaminhao || !ui.modalAdicionar || !ui.formNovoVeiculo) {
        showNotification("Erro interno no formulário. Recarregue a página.", "error", 5000, ui); return;
    }
    const tipo = ui.novoVeiculoTipo.value;
    const modelo = ui.novoVeiculoModelo.value.trim();
    const cor = ui.novoVeiculoCor.value.trim();
    const capacidadeStr = ui.novoVeiculoCapacidade.value;
    let capacidadeCarga = 0;
    if (!tipo) { showNotification("Selecione o tipo de veículo.", 'warning', 3000, ui); ui.novoVeiculoTipo.focus(); return; }
    if (!modelo) { showNotification("Informe o modelo do veículo.", 'warning', 3000, ui); ui.novoVeiculoModelo.focus(); return; }
    if (!cor) { showNotification("Informe a cor do veículo.", 'warning', 3000, ui); ui.novoVeiculoCor.focus(); return; }
    let novoVeiculo = null;
    try {
        switch (tipo) {
            case 'Carro': novoVeiculo = new Carro(modelo, cor); break;
            case 'CarroEsportivo': novoVeiculo = new CarroEsportivo(modelo, cor); break;
            case 'Caminhao':
                 capacidadeCarga = parseInt(capacidadeStr, 10);
                 if (!capacidadeStr || isNaN(capacidadeCarga) || capacidadeCarga <= 0) {
                     showNotification("Para Caminhão, informe uma capacidade de carga válida (kg).", 'warning', 4000, ui);
                     ui.novoVeiculoCapacidade.focus(); return;
                 }
                novoVeiculo = new Caminhao(modelo, cor, capacidadeCarga); break;
            default: showNotification("Tipo de veículo selecionado é inválido.", 'error', 3000, ui); return;
        }
        if (!novoVeiculo) throw new Error("Falha na criação da instância do veículo.");
    } catch (error) {
        showNotification(`Erro ao criar veículo: ${error.message || 'Erro desconhecido'}`, 'error', 5000, ui); return;
    }
    const resultadoAdicao = minhaGaragem.adicionarVeiculo(novoVeiculo);
    if (resultadoAdicao.success) {
        minhaGaragem.salvarNoLocalStorage();
        showNotification(`${novoVeiculo.modelo} adicionado com sucesso!`, 'success', 3000, ui);
        ui.formNovoVeiculo.reset();
        ui.divCapacidadeCaminhao.style.display = 'none';
        if(ui.modalAdicionar.open) ui.modalAdicionar.close();
        if(minhaGaragem.selecionarVeiculo(novoVeiculo.id)) ativarTab('tab-visao-geral');
        atualizarInterfaceCompleta();
    } else {
         showNotification(resultadoAdicao.message || `Não foi possível adicionar ${modelo}.`, 'warning', 4000, ui);
         ui.novoVeiculoModelo.focus();
    }
}
function agendarOuRegistrarManutencao(event) {
    event.preventDefault();
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo) { showNotification("Selecione um veículo antes!", 'warning', 3000, ui); return; }
    if (!ui.manutencaoDataHora || !ui.manutencaoTipo || !ui.manutencaoCusto || !ui.manutencaoDescricao || !ui.formManutencao) {
        showNotification("Erro interno no formulário de manutenção.", "error", 5000, ui); return;
    }
    const dataHora = ui.manutencaoDataHora.value;
    const tipo = ui.manutencaoTipo.value.trim();
    const custoStr = ui.manutencaoCusto.value;
    const descricao = ui.manutencaoDescricao.value.trim();
    if (!dataHora) { showNotification("Selecione data e hora.", 'warning', 3000, ui); ui.manutencaoDataHora.focus(); return; }
    if (!tipo) { showNotification("Informe o tipo de serviço.", 'warning', 3000, ui); ui.manutencaoTipo.focus(); return; }
    let novaManutencao;
    try { novaManutencao = new Manutencao(dataHora, tipo, custoStr, descricao); }
    catch (error) { showNotification("Erro ao processar dados. Verifique data/hora.", 'error', 4000, ui); return; }
    const resultadoAddManut = veiculo.adicionarManutencao(novaManutencao);
    if (resultadoAddManut.success) {
        minhaGaragem.salvarNoLocalStorage();
        ui.formManutencao.reset();
        atualizarPainelVeiculoSelecionado();
        showNotification("Registro de manutenção salvo!", 'success', 3000, ui);
    } else {
        showNotification(resultadoAddManut.message || "Não foi possível salvar.", 'error', 4000, ui);
        if (resultadoAddManut.message?.toLowerCase().includes("data")) ui.manutencaoDataHora.focus();
        else if (resultadoAddManut.message?.toLowerCase().includes("tipo")) ui.manutencaoTipo.focus();
    }
}
function lidarComCliqueListaManutencao(event) {
    const removeButton = event.target.closest('.botao-remover-item');
    if (!removeButton) return;
    const liElement = removeButton.closest('li[data-item-id]');
    if (!liElement || !liElement.dataset.itemId) return;
    removerManutencaoItem(liElement.dataset.itemId);
}
function removerManutencaoItem(idManutencao) {
     const veiculo = minhaGaragem.getVeiculoSelecionado();
     if (!veiculo) return;
     const itemParaRemover = veiculo.historicoManutencao.find(m => m.id === idManutencao);
     const msgConfirm = itemParaRemover ? `Remover?\n\n"${itemParaRemover.retornarFormatada(true)}"` : "Remover item?";
     if (confirm(msgConfirm)) {
         if (veiculo.removerManutencao(idManutencao)) {
             minhaGaragem.salvarNoLocalStorage();
             atualizarPainelVeiculoSelecionado();
             showNotification("Item de manutenção removido.", 'success', 2000, ui);
         } else { showNotification("Não foi possível remover.", 'error', 3000, ui); }
     }
}
function removerVeiculoSelecionado() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo) { showNotification("Nenhum veículo selecionado.", 'warning', 3000, ui); return; }
    if (confirm(`ATENÇÃO!\n\nRemover ${veiculo.modelo} (${veiculo.cor})?\n\nEsta ação NÃO pode ser desfeita.`)) {
         if (minhaGaragem.removerVeiculo(veiculo.id)) {
              minhaGaragem.salvarNoLocalStorage();
              showNotification(`${veiculo.modelo} removido.`, 'success', 3000, ui);
              atualizarInterfaceCompleta();
         } else { showNotification(`Falha ao remover ${veiculo.modelo}.`, 'error', 3000, ui); }
    }
}

// --- Funções da API Simulada (Veículos) ---
async function buscarDetalhesVeiculoAPI(identificadorVeiculo) {
    const urlAPI = './dados_veiculos_api.json';
    try {
        const response = await fetch(urlAPI, { cache: "no-cache" });
        if (!response.ok) {
            const erroMsg = `Falha (Erro ${response.status}: ${response.statusText}). Verifique '${urlAPI}'.`;
            return { erro: true, mensagem: erroMsg };
        }
        const dadosTodosVeiculos = await response.json();
        if (!Array.isArray(dadosTodosVeiculos)) return { erro: true, mensagem: "Formato inválido no JSON." };
        const detalhes = dadosTodosVeiculos.find(v => v && v.id === identificadorVeiculo);
        return detalhes ? detalhes : null;
    } catch (error) {
        let mensagemErro = "Erro ao buscar detalhes.";
        if (error instanceof SyntaxError) mensagemErro = "Erro de formato no JSON.";
        else if (error instanceof TypeError && error.message.includes('fetch')) mensagemErro = "Erro de rede.";
        else if (error.message) mensagemErro = error.message;
        return { erro: true, mensagem: mensagemErro };
    }
}
async function lidarCliqueDetalhesExtras() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo || !veiculo.id) { showNotification("Selecione um veículo.", "warning", 3000, ui); return; }
    if (!ui.detalhesExtrasVeiculoDiv || !ui.btnVerDetalhesExtras) {
        showNotification("Erro interno na interface.", "error", 4000, ui); return;
    }
    ui.detalhesExtrasVeiculoDiv.innerHTML = `<p class="loading-feedback"><i class="fas fa-spinner fa-spin"></i> Carregando...</p>`;
    ui.detalhesExtrasVeiculoDiv.style.display = 'block';
    ui.btnVerDetalhesExtras.disabled = true;
    const detalhes = await buscarDetalhesVeiculoAPI(veiculo.id);
    if(ui.btnVerDetalhesExtras) ui.btnVerDetalhesExtras.disabled = false;
    if (detalhes && detalhes.erro) {
        ui.detalhesExtrasVeiculoDiv.innerHTML = `<p class="error-feedback"><i class="fas fa-exclamation-triangle"></i> Erro: ${detalhes.mensagem}</p>`;
    } else if (detalhes) {
        let recallStatus = detalhes.recallPendente ? `<span class="recall-pendente">Sim${detalhes.recallDescricao ? ` (${detalhes.recallDescricao})` : ''}</span>` : `<span class="recall-ok">Não</span>`;
        let dataRevisaoFormatada = 'N/A';
        if (detalhes.ultimaRevisaoAPI) {
            try {
                const dataObj = new Date(detalhes.ultimaRevisaoAPI + 'T00:00:00');
                if (!isNaN(dataObj)) dataRevisaoFormatada = dataObj.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
                else throw new Error("Data inválida.");
            } catch (e) { dataRevisaoFormatada = 'Data Inválida'; }
        }
        ui.detalhesExtrasVeiculoDiv.innerHTML = `
            <p><i class="fas fa-dollar-sign"></i> <strong>Valor FIPE:</strong> ${detalhes.valorFipe ? detalhes.valorFipe.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A'}</p>
            <p><i class="fas fa-calendar-alt"></i> <strong>Última Revisão (API):</strong> ${dataRevisaoFormatada}</p>
            <p><i class="fas fa-exclamation-circle"></i> <strong>Recall Pendente:</strong> ${recallStatus}</p>
            <p><i class="fas fa-lightbulb"></i> <strong>Dica:</strong> ${detalhes.dicaManutencao || 'N/A'}</p>
            <p><i class="fas fa-star"></i> <strong>Curiosidade:</strong> ${detalhes.fatoCurioso || '-'}</p>
        `;
    } else {
        ui.detalhesExtrasVeiculoDiv.innerHTML = `<p class="notfound-feedback"><i class="fas fa-search"></i> Nenhum detalhe extra para ${veiculo.modelo}.</p>`;
    }
}


// --- Funções da API de Previsão do Tempo (OpenWeatherMap) ---

/**
 * Busca a previsão do tempo detalhada (5 dias / 3 horas) para uma cidade.
 * @param {string} cidade - O nome da cidade.
 * @returns {Promise<object|null>} Os dados da API ou null em caso de erro.
 */
async function buscarPrevisaoDetalhadaTempo(cidade) {
    if (!WEATHER_API_KEY || WEATHER_API_KEY === "569ee28c1908ad6eaadb431e635166be") { // Verificação se a chave ainda é o placeholder
        console.error("Chave da API de Tempo não configurada ou é o placeholder.");
        // A mensagem de erro para o usuário já será exibida por handleVerificarClima
        throw new Error("Chave da API de Tempo não configurada corretamente.");
    }
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&appid=${WEATHER_API_KEY}&units=metric&lang=pt_br`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Erro ao buscar dados da previsão." }));
            console.error("Erro da API de Tempo:", errorData);
            throw new Error(errorData.message || `Erro ${response.status} ao buscar previsão.`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Falha ao buscar previsão detalhada do tempo:", error);
        throw error; 
    }
}

/**
 * Processa os dados brutos da API de forecast para um formato diário resumido.
 * @param {object} dataApi - O objeto JSON completo retornado pela API.
 * @returns {Array<object>|null} Um array de objetos, cada um representando um dia resumido, ou null.
 */
function processarDadosForecastTempo(dataApi) {
    if (!dataApi || !dataApi.list || !Array.isArray(dataApi.list) || dataApi.list.length === 0) {
        console.error("Dados da API de tempo inválidos ou lista de previsões vazia.", dataApi);
        return null;
    }
    const diasAgrupados = {};
    dataApi.list.forEach(item => {
        const dataDia = item.dt_txt.split(' ')[0];
        if (!diasAgrupados[dataDia]) {
            diasAgrupados[dataDia] = { temps: [], descricoes: [], icones: [], horas_previsao: [] };
        }
        diasAgrupados[dataDia].temps.push(item.main.temp);
        diasAgrupados[dataDia].descricoes.push(item.weather[0].description);
        diasAgrupados[dataDia].icones.push(item.weather[0].icon);
        diasAgrupados[dataDia].horas_previsao.push({
            hora: item.dt_txt.split(' ')[1],
            descricao: item.weather[0].description,
            icone: item.weather[0].icon
        });
    });

    const previsaoDiariaProcessada = [];
    for (const dataDia in diasAgrupados) {
        const diaInfo = diasAgrupados[dataDia];
        const temp_min = Math.min(...diaInfo.temps);
        const temp_max = Math.max(...diaInfo.temps);
        let descricaoRep = diaInfo.descricoes[0];
        let iconeRep = diaInfo.icones[0];
        const previsaoMeioDia = diaInfo.horas_previsao.find(p => p.hora === "12:00:00" || p.hora === "15:00:00");
        if (previsaoMeioDia) {
            descricaoRep = previsaoMeioDia.descricao;
            iconeRep = previsaoMeioDia.icone;
        } else if (diaInfo.horas_previsao.length > 0) {
            descricaoRep = diaInfo.horas_previsao[0].descricao;
            iconeRep = diaInfo.horas_previsao[0].icone;
        }
        previsaoDiariaProcessada.push({
            data: formatarDataParaExibicaoTempo(dataDia),
            temp_min: temp_min.toFixed(1),
            temp_max: temp_max.toFixed(1),
            descricao: capitalizarPrimeiraLetraTempo(descricaoRep),
            icone: iconeRep
        });
    }
    return previsaoDiariaProcessada.slice(0, 5); 
}

/**
 * Exibe a previsão do tempo detalhada na interface do usuário.
 * @param {Array<object>} previsaoDiaria - Array de objetos com a previsão processada por dia.
 * @param {string} nomeCidade - O nome da cidade para o título.
 */
function exibirPrevisaoDetalhadaTempo(previsaoDiaria, nomeCidade) {
    if (!ui.previsaoResultadoDivTempo) return;
    ui.previsaoResultadoDivTempo.innerHTML = '';

    if (!previsaoDiaria || previsaoDiaria.length === 0) {
        // A mensagem de erro já deve ter sido exibida por exibirStatusTempo
        return;
    }

    const tituloH3 = document.createElement('h3'); 
    tituloH3.textContent = `Previsão para ${capitalizarPrimeiraLetraTempo(nomeCidade)}`;
    ui.previsaoResultadoDivTempo.appendChild(tituloH3);

    const gridContainer = document.createElement('div');
    gridContainer.className = 'previsao-dias-grid';

    previsaoDiaria.forEach(dia => {
        const diaDiv = document.createElement('div');
        diaDiv.className = 'dia-previsao';

        const dataH4 = document.createElement('h4'); 
        dataH4.className = 'data-dia'; 
        const iconeImg = document.createElement('img');
        iconeImg.className = 'icone-tempo'; 
        iconeImg.src = `https://openweathermap.org/img/wn/${dia.icone}@2x.png`;
        iconeImg.alt = dia.descricao;
        dataH4.appendChild(iconeImg);
        dataH4.appendChild(document.createTextNode(dia.data));

        const tempMinP = document.createElement('p');
        tempMinP.innerHTML = `Mín: <strong>${dia.temp_min}°C</strong>`;
        const tempMaxP = document.createElement('p');
        tempMaxP.innerHTML = `Máx: <strong>${dia.temp_max}°C</strong>`;
        const descricaoP = document.createElement('p');
        descricaoP.textContent = dia.descricao;

        diaDiv.appendChild(dataH4);
        diaDiv.appendChild(tempMinP);
        diaDiv.appendChild(tempMaxP);
        diaDiv.appendChild(descricaoP);
        gridContainer.appendChild(diaDiv);
    });
    ui.previsaoResultadoDivTempo.appendChild(gridContainer);
}

/** Formata uma string de data "AAAA-MM-DD" para "DD/MM/AAAA". */
function formatarDataParaExibicaoTempo(dataString) {
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
}

/** Capitaliza a primeira letra de uma string. */
function capitalizarPrimeiraLetraTempo(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/** Exibe uma mensagem de status (carregando, erro) para a previsão do tempo. */
function exibirStatusTempo(mensagem, tipo = 'info') {
    if (!ui.statusMensagemTempoDiv) return;
    ui.statusMensagemTempoDiv.textContent = mensagem;
    ui.statusMensagemTempoDiv.className = 'status-mensagem'; // Reseta
    if (tipo) {
        ui.statusMensagemTempoDiv.classList.add(tipo);
    }
     // Remove estilos de fundo explícitos para que o CSS controle totalmente
    ui.statusMensagemTempoDiv.style.backgroundColor = '';
}

/** Lida com o clique no botão de verificar clima. */
async function handleVerificarClima() {
    if (!ui.cidadeInputTempo) return;
    const cidade = ui.cidadeInputTempo.value.trim();

    if (!cidade) {
        exibirStatusTempo("Por favor, digite o nome de uma cidade.", 'error');
        return;
    }
    // A verificação da chave placeholder será feita antes de chamar buscarPrevisaoDetalhadaTempo
    if (WEATHER_API_KEY === "569ee28c1908ad6eaadb431e635166be") {
         exibirStatusTempo("AVISO: A chave da API de Previsão do Tempo não foi configurada. Verifique o arquivo js/principal.js.", 'error');
         return;
    }

    exibirStatusTempo("Carregando previsão...", 'loading');
    if (ui.previsaoResultadoDivTempo) ui.previsaoResultadoDivTempo.innerHTML = '';

    try {
        const dadosApi = await buscarPrevisaoDetalhadaTempo(cidade); // Não precisa mais verificar a chave aqui
        // Se buscarPrevisaoDetalhadaTempo lançar erro, o catch abaixo o pegará
        if (dadosApi) { // Procede apenas se dadosApi não for null (ou seja, não houve erro na busca)
            const previsaoProcessada = processarDadosForecastTempo(dadosApi);
            if (previsaoProcessada && previsaoProcessada.length > 0) {
                exibirPrevisaoDetalhadaTempo(previsaoProcessada, cidade);
                exibirStatusTempo(""); 
            } else {
                exibirStatusTempo(`Não foi possível processar a previsão para ${capitalizarPrimeiraLetraTempo(cidade)}.`, 'error');
            }
        }
        // Não precisa de um 'else' aqui, pois se dadosApi for null, um erro já foi lançado
    } catch (error) {
        console.error("Erro no fluxo principal da previsão do tempo:", error);
        exibirStatusTempo(error.message || "Ocorreu um erro ao buscar a previsão. Tente novamente.", 'error');
    }
}


// --- Inicialização da Aplicação ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado. Iniciando Garagem Virtual V3 & Previsão do Tempo...");

    try {
        // Inicialização da Garagem (código existente)
        const pathElement = document.querySelector('.velocimetro-progresso');
        if (pathElement && typeof pathElement.getTotalLength === 'function') {
            try {
                velocimetroPathLength = pathElement.getTotalLength();
                document.documentElement.style.setProperty('--velocimetro-path-length', velocimetroPathLength);
            } catch (e) {
                 document.documentElement.style.setProperty('--velocimetro-path-length', 251.2);
            }
        } else {
            document.documentElement.style.setProperty('--velocimetro-path-length', 251.2);
        }

        const veiculosSalvos = Garagem.carregarDoLocalStorage();
        minhaGaragem.veiculos = veiculosSalvos;
        const idSelecionadoSalvo = localStorage.getItem('garagemVeiculoSelecionadoId');
        if (idSelecionadoSalvo && minhaGaragem.encontrarVeiculo(idSelecionadoSalvo)) {
            minhaGaragem.selecionarVeiculo(idSelecionadoSalvo);
        } else {
             minhaGaragem.selecionarVeiculo(null);
             if(idSelecionadoSalvo) localStorage.removeItem('garagemVeiculoSelecionadoId');
        }

        if (ui.btnAbrirModalAdicionar && ui.modalAdicionar) {
            ui.btnAbrirModalAdicionar.addEventListener('click', () => {
                if(ui.formNovoVeiculo) ui.formNovoVeiculo.reset();
                if(ui.divCapacidadeCaminhao) ui.divCapacidadeCaminhao.style.display = 'none';
                if(ui.novoVeiculoTipo) ui.novoVeiculoTipo.value = "";
                if (!ui.modalAdicionar.open) {
                    try { ui.modalAdicionar.showModal(); } catch (e) { console.error("Erro ao abrir modal:", e); }
                }
            });
        }
        if (ui.btnFecharModalAdicionar && ui.modalAdicionar) {
            ui.btnFecharModalAdicionar.addEventListener('click', () => { if (ui.modalAdicionar.open) ui.modalAdicionar.close(); });
        }
        if (ui.modalAdicionar) {
            ui.modalAdicionar.addEventListener('click', (event) => { if (event.target === ui.modalAdicionar && ui.modalAdicionar.open) ui.modalAdicionar.close(); });
        }
        if (ui.formNovoVeiculo) ui.formNovoVeiculo.addEventListener('submit', adicionarNovoVeiculo);
        if (ui.novoVeiculoTipo && ui.divCapacidadeCaminhao) {
            ui.novoVeiculoTipo.addEventListener('change', (event) => {
                ui.divCapacidadeCaminhao.style.display = (event.target.value === 'Caminhao') ? 'block' : 'none';
            });
        }
        if (ui.formManutencao) ui.formManutencao.addEventListener('submit', agendarOuRegistrarManutencao);
        if (ui.tabLinks && ui.tabLinks.length > 0) {
            ui.tabLinks.forEach(button => {
                button.addEventListener('click', () => ativarTab(button.dataset.tab));
            });
        }
        if (ui.botoesAcoesContainer) ui.botoesAcoesContainer.addEventListener('click', lidarComAcaoVeiculo);
        if(ui.botaoRemoverVeiculoHeader) ui.botaoRemoverVeiculoHeader.addEventListener('click', removerVeiculoSelecionado);
        
        const setupMaintenanceListListener = (ulElement) => {
             if (ulElement) ulElement.addEventListener('click', lidarComCliqueListaManutencao);
        };
        setupMaintenanceListListener(ui.historicoUl);
        setupMaintenanceListListener(ui.agendamentosUl);

        if (ui.notificationCloseBtn) ui.notificationCloseBtn.addEventListener('click', () => hideNotification(ui));
        if (ui.btnVerDetalhesExtras) ui.btnVerDetalhesExtras.addEventListener('click', lidarCliqueDetalhesExtras);

        // Inicialização da Previsão do Tempo
        // A verificação da chave placeholder agora é feita dentro do handleVerificarClima
        if (ui.verificarClimaBtn) {
            ui.verificarClimaBtn.addEventListener('click', handleVerificarClima);
        }
        if (ui.cidadeInputTempo) {
            ui.cidadeInputTempo.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    handleVerificarClima();
                }
            });
        }
        // Verifica se a chave é o placeholder e exibe um aviso inicial se for.
        if (WEATHER_API_KEY === "569ee28c1908ad6eaadb431e635166be") {
            exibirStatusTempo("AVISO: A chave da API de Previsão do Tempo é um placeholder. Substitua-a em js/principal.js para usar esta funcionalidade.", 'warning');
            if(ui.verificarClimaBtn) ui.verificarClimaBtn.disabled = true; // Opcional: desabilitar o botão
        }
        
        
        // Renderização Inicial da Garagem
        ativarTab('tab-visao-geral');
        atualizarInterfaceCompleta();

        // Verificação de Agendamentos da Garagem
        setTimeout(() => {
            try {
                const mensagensAgendamento = minhaGaragem.verificarAgendamentosProximos();
                if (mensagensAgendamento && mensagensAgendamento.length > 0) {
                    mensagensAgendamento.forEach((msg, index) => {
                        setTimeout(() => showNotification(msg, 'info', 8000 + index * 500, ui), index * 700);
                    });
                }
            } catch(error) {
                console.error("[Init] Erro ao verificar agendamentos próximos:", error);
            }
        }, 1500);

        console.log("✅ Garagem Virtual & Previsão do Tempo inicializados!");

    } catch (error) {
        console.error("❌===== ERRO CRÍTICO NA INICIALIZAÇÃO DA APLICAÇÃO =====", error);
        alert("Ocorreu um erro grave ao iniciar a aplicação. Verifique o console (F12).");
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = `<div style="padding: 20px; margin: 20px; background-color: #ffdddd; border: 2px solid red; color: #a02533; text-align: center; font-family: sans-serif;">
                                <h1>Erro na Aplicação</h1>
                                <p>Não foi possível carregar corretamente.</p>
                                <p><strong>Detalhes do Erro:</strong> ${error.message}</p>
                                <p><em>Verifique o console do navegador (F12).</em></p>
                              </div>`;
        }
    }
});