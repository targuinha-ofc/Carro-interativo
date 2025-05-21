'use strict';

// --- Conteúdo de js/utils/notificacoes.js ---
let notificationTimeout = null;

function showNotification(message, type = 'info', duration = 4000, uiElements) {
    // Adicionando verificação robusta dos uiElements aqui
    if (!uiElements || typeof uiElements !== 'object' || !uiElements.notificationArea || !uiElements.notificationMessage) {
        console.warn("showNotification: Elementos da UI de notificação inválidos ou não fornecidos.", uiElements);
        alert(`Notificação (${type}): ${message}`); // Fallback
        return;
    }
    clearTimeout(notificationTimeout);
    uiElements.notificationMessage.textContent = message;
    uiElements.notificationArea.className = 'notification';
    uiElements.notificationArea.classList.add(type, 'show');
    uiElements.notificationArea.style.display = 'flex';
    notificationTimeout = setTimeout(() => hideNotification(uiElements), duration);
}

function hideNotification(uiElements) {
    if (!uiElements || typeof uiElements !== 'object' || !uiElements.notificationArea) {
        // console.warn("hideNotification: uiElements.notificationArea não encontrado."); // Pode ser muito verboso
        return;
    }
    uiElements.notificationArea.classList.remove('show');
    const transitionDuration = 500;
    setTimeout(() => {
         if (uiElements.notificationArea && !uiElements.notificationArea.classList.contains('show')) {
             uiElements.notificationArea.style.display = 'none';
             uiElements.notificationArea.className = 'notification';
         }
    }, transitionDuration);
    clearTimeout(notificationTimeout);
    notificationTimeout = null;
}


// --- Conteúdo de js/models/Manutencao.js ---
class Manutencao {
    constructor(dataISO, tipo, custo, descricao = '') {
        if (dataISO instanceof Date && !isNaN(dataISO)) {
            this.data = dataISO;
        } else if (typeof dataISO === 'string') {
             try {
                this.data = new Date(dataISO);
                if (isNaN(this.data.getTime())) throw new Error("String de data inválida recebida.");
             } catch (e) {
                 console.error("Erro ao criar data para Manutencao a partir da string:", dataISO, e);
                 this.data = new Date(NaN);
             }
        } else {
             console.warn("Tipo de data inválido recebido para Manutencao:", dataISO);
             this.data = new Date(NaN);
        }
        this.tipo = tipo ? String(tipo).trim() : '';
        let custoNumerico = 0;
        if (custo !== null && custo !== undefined && custo !== '') {
            if (typeof custo === 'string') {
                custo = custo.replace(',', '.').replace(/[^\d.-]/g, '');
            }
            custoNumerico = parseFloat(custo);
        }
        this.custo = isNaN(custoNumerico) || custoNumerico < 0 ? 0 : custoNumerico;
        this.descricao = descricao ? String(descricao).trim() : '';
        this.id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    retornarFormatada(incluirHorario = true) {
        if (!this.isValidDate()) {
            return `${this.tipo || 'Tipo Indefinido'} - Data Inválida - ${this.formatarCusto()}${this.descricao ? ` (${this.descricao})` : ''}`;
        }
        const opcoesData = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const opcoesHora = { hour: '2-digit', minute: '2-digit' };
        let dataStr = this.data.toLocaleDateString('pt-BR', opcoesData);
        if (incluirHorario) {
             dataStr += ' às ' + this.data.toLocaleTimeString('pt-BR', opcoesHora);
        }
        return `${this.tipo} em ${dataStr} - ${this.formatarCusto()}${this.descricao ? ` (${this.descricao})` : ''}`;
    }
    formatarCusto() {
        if (this.custo === 0) {
            return this.isValidDate() && this.data > new Date() ? "Agendado" : "Grátis";
        }
        return this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    isValidDate() {
      return this.data instanceof Date && !isNaN(this.data.getTime());
    }
    validarDados() {
        if (!this.isValidDate()) {
            console.error("Erro de validação Manutencao: Data inválida.", this.data);
            return { valido: false, mensagemErro: "Data da manutenção inválida ou não informada." };
        }
        if (typeof this.tipo !== 'string' || this.tipo.trim() === '') {
            console.error("Erro de validação Manutencao: Tipo de serviço não pode ser vazio.", this.tipo);
            return { valido: false, mensagemErro: "Tipo de serviço não pode ser vazio." };
        }
        return { valido: true };
    }
    toJSON() {
        return {
            _tipoClasse: 'Manutencao',
            dataISO: this.isValidDate() ? this.data.toISOString() : null,
            tipo: this.tipo,
            custo: this.custo,
            descricao: this.descricao,
            id: this.id
        };
    }
}

// --- Conteúdo de js/models/Veiculo.js ---
class Veiculo {
    constructor(modelo, cor, id = null) {
        if (!modelo || typeof modelo !== 'string' || modelo.trim() === '') {
            throw new Error("Modelo do veículo é obrigatório e deve ser uma string não vazia.");
        }
        if (!cor || typeof cor !== 'string' || cor.trim() === '') {
            throw new Error("Cor do veículo é obrigatória e deve ser uma string não vazia.");
        }
        this.modelo = modelo.trim();
        this.cor = cor.trim();
        this.historicoManutencao = [];
        this.id = id || Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    adicionarManutencao(manutencao) {
        if (!(manutencao instanceof Manutencao)) {
             console.error("Tipo inválido passado para adicionarManutencao:", manutencao);
             return { success: false, message: "Erro interno: Tipo de manutenção inválido." };
        }
        const validacao = manutencao.validarDados();
        if (!validacao.valido) {
             console.warn(`Dados inválidos para a manutenção a ser adicionada: ${manutencao.tipo}. Motivo: ${validacao.mensagemErro}`);
             return { success: false, message: validacao.mensagemErro || "Dados da manutenção inválidos." };
        }
        if (this.historicoManutencao.some(m => m.id === manutencao.id)) {
            console.warn(`Manutenção com ID ${manutencao.id} já existe para ${this.modelo}.`);
            return { success: false, message: "Esta manutenção já foi registrada." };
        }
        this.historicoManutencao.push(manutencao);
        this.historicoManutencao.sort((a, b) => {
            if (!a.isValidDate() && !b.isValidDate()) return 0;
            if (!a.isValidDate()) return 1;
            if (!b.isValidDate()) return -1;
            return b.data.getTime() - a.data.getTime();
        });
        // console.log(`Manutenção/Agendamento adicionado para ${this.modelo}: ${manutencao.retornarFormatada(true)}`);
        return { success: true };
    }
    removerManutencao(idManutencao) {
        const index = this.historicoManutencao.findIndex(m => m.id === idManutencao);
        if (index > -1) {
            const removida = this.historicoManutencao.splice(index, 1)[0];
            // console.log(`Manutenção ${idManutencao} (${removida.tipo}) removida de ${this.modelo}.`);
            return true;
        }
        console.warn(`Manutenção ${idManutencao} não encontrada em ${this.modelo}.`);
        return false;
    }
    getHistoricoPassadoFormatado() {
        const agora = new Date();
        return this.historicoManutencao
            .filter(item => item.isValidDate() && item.data < agora)
            .map(manutencao => ({
                id: manutencao.id,
                texto: manutencao.retornarFormatada(true)
            }));
    }
    getAgendamentosFuturosFormatados() {
         const agora = new Date();
         return this.historicoManutencao
             .filter(item => item.isValidDate() && item.data >= agora)
             .sort((a, b) => a.data.getTime() - b.data.getTime())
             .map(manutencao => ({
                 id: manutencao.id,
                 texto: manutencao.retornarFormatada(true)
             }));
    }
    exibirInformacoesBase() {
         return {
             id: this.id,
             modelo: this.modelo,
             cor: this.cor
         };
    }
    toJSON() {
        return {
            _tipoClasse: this.constructor.name,
            modelo: this.modelo,
            cor: this.cor,
            id: this.id,
            historicoManutencao: this.historicoManutencao.map(m => m.toJSON())
        };
    }
}

// --- Conteúdo de js/models/Carro.js ---
class Carro extends Veiculo {
    constructor(modelo, cor, id = null, ligado = false, velocidade = 0) {
        super(modelo, cor, id);
        this.ligado = Boolean(ligado);
        this.velocidade = Math.max(0, Number(velocidade) || 0);
        this.velocidadeMaxima = 150;
    }
    ligar() {
        if (!this.ligado) {
            this.ligado = true;
            return { success: true, message: `${this.modelo} ligado.` };
        }
        return { success: false, message: `${this.modelo} já estava ligado.` };
    }
    desligar() {
        if (this.ligado) {
            this.ligado = false;
            this.velocidade = 0;
            return { success: true, message: `${this.modelo} desligado. Velocidade zerada.` };
        }
        return { success: false, message: `${this.modelo} já estava desligado.` };
    }
    acelerar() {
        if (!this.ligado) {
            return { success: false, message: `Ligue o ${this.modelo} primeiro!` };
        }
        if (this.velocidade < this.velocidadeMaxima) {
            this.velocidade = Math.min(this.velocidade + 10, this.velocidadeMaxima);
            return { success: true };
        } else {
             return { success: false, message: `${this.modelo} já está na velocidade máxima!` };
        }
    }
    frear() {
        if (this.velocidade > 0) {
            this.velocidade = Math.max(0, this.velocidade - 10);
            return { success: true };
        }
        return { success: false, message: `${this.modelo} já está parado.` };
    }
    getDadosEspecificos() {
        return {
            ligado: this.ligado,
            velocidade: this.velocidade,
            velocidadeMaxima: this.velocidadeMaxima
        };
    }
    toJSON() {
        const baseJSON = super.toJSON();
        return {
            ...baseJSON,
            _tipoClasse: 'Carro',
            ligado: this.ligado,
            velocidade: this.velocidade
        };
    }
}

// --- Conteúdo de js/models/CarroEsportivo.js ---
class CarroEsportivo extends Carro {
    constructor(modelo, cor, id = null, ligado = false, velocidade = 0, turboBoostUsado = false) {
        super(modelo, cor, id, ligado, velocidade);
        this.velocidadeMaxima = 360;
        this.turboBoostUsado = Boolean(turboBoostUsado);
    }
    ativarTurbo() {
        if (!this.ligado) {
            return { success: false, message: 'Ligue o carro antes de usar o turbo boost!' };
        }
        if (this.turboBoostUsado) {
            return { success: false, message: 'O Turbo Boost já foi utilizado neste veículo!' };
        }
        if (this.velocidade <= 0) {
             return { success: false, message: 'Acelere um pouco antes de usar o turbo!' };
        }
        const boost = 50;
        const velocidadeAntiga = this.velocidade;
        this.velocidade = Math.min(this.velocidade + boost, this.velocidadeMaxima);
        this.turboBoostUsado = true;
        return { success: true, message: 'Turbo Boost Ativado!' };
    }
    acelerar() {
        if (!this.ligado) {
             return { success: false, message: 'Ligue o veículo primeiro!' };
        }
         if (this.velocidade < this.velocidadeMaxima) {
            const incremento = 25;
            this.velocidade = Math.min(this.velocidade + incremento, this.velocidadeMaxima);
            return { success: true };
         } else {
             return { success: false, message: `${this.modelo} já está na velocidade máxima!` };
         }
    }
    getDadosEspecificos() {
        const dadosPai = super.getDadosEspecificos();
        return {
            ...dadosPai,
            velocidadeMaxima: this.velocidadeMaxima,
            turboBoostUsado: this.turboBoostUsado
        };
    }
    toJSON() {
        const baseJSON = super.toJSON();
        return {
            ...baseJSON,
            _tipoClasse: 'CarroEsportivo',
            turboBoostUsado: this.turboBoostUsado
        };
    }
}

// --- Conteúdo de js/models/Caminhao.js ---
class Caminhao extends Carro {
    constructor(modelo, cor, capacidadeCarga, id = null, ligado = false, velocidade = 0, cargaAtual = 0) {
        const capNum = Number(capacidadeCarga);
        if (isNaN(capNum) || capNum <= 0) {
            throw new Error("Capacidade de carga do caminhão deve ser um número positivo.");
        }
        super(modelo, cor, id, ligado, velocidade);
        this.capacidadeCarga = capNum;
        this.cargaAtual = Math.max(0, Math.min(Number(cargaAtual) || 0, this.capacidadeCarga));
        this.velocidadeMaxima = 120;
    }
    carregar(quantidade = 1000) {
        if (this.ligado) {
             return { success: false, message: "Desligue o caminhão para carregar/descarregar com segurança." };
        }
        const quantNum = Number(quantidade);
        if (isNaN(quantNum) || quantNum <= 0) {
            return { success: false, message: "Quantidade inválida para carregar." };
        }
        const espacoDisponivel = this.capacidadeCarga - this.cargaAtual;
        if (espacoDisponivel <= 0) {
             return { success: false, message: 'Caminhão já está na capacidade máxima!' };
        }
        const cargaAdicionada = Math.min(quantNum, espacoDisponivel);
        this.cargaAtual += cargaAdicionada;
        let message;
        if (cargaAdicionada < quantNum) {
            message = `Carga máxima atingida. ${cargaAdicionada}kg carregados. Carga atual: ${this.cargaAtual}kg`;
        } else {
            message = `${cargaAdicionada}kg carregados. Carga atual: ${this.cargaAtual}kg`;
        }
        return { success: true, message: message, cargaAtual: this.cargaAtual };
    }
    descarregar(quantidade = 500) {
        if (this.ligado) {
             return { success: false, message: "Desligue o caminhão para carregar/descarregar com segurança." };
        }
        const quantNum = Number(quantidade);
         if (isNaN(quantNum) || quantNum <= 0) {
            return { success: false, message: "Quantidade inválida para descarregar." };
        }
        if (this.cargaAtual <= 0) {
            return { success: false, message: 'Caminhão já está vazio.' };
        }
        const cargaRemovida = Math.min(quantNum, this.cargaAtual);
        this.cargaAtual -= cargaRemovida;
        const message = `${cargaRemovida}kg descarregados. Carga atual: ${this.cargaAtual}kg`;
        return { success: true, message: message, cargaAtual: this.cargaAtual };
    }
     acelerar() {
        if (!this.ligado) {
            return { success: false, message: 'Ligue o caminhão primeiro!' };
        }
        if (this.velocidade < this.velocidadeMaxima) {
            const fatorCarga = Math.max(0.3, 1 - (this.cargaAtual / (this.capacidadeCarga * 1.5)));
            const incrementoBase = 7;
            const incremento = Math.max(1, Math.round(incrementoBase * fatorCarga));
            this.velocidade = Math.min(this.velocidade + incremento, this.velocidadeMaxima);
            return { success: true };
        } else {
            return { success: false, message: `${this.modelo} já está na velocidade máxima!` };
        }
    }
    frear() {
        if (this.velocidade > 0) {
             const fatorCarga = Math.max(0.4, 1 - (this.cargaAtual / (this.capacidadeCarga * 2.0)));
             const decrementoBase = 8;
             const decremento = Math.max(2, Math.round(decrementoBase * fatorCarga));
            this.velocidade = Math.max(0, this.velocidade - decremento);
            return { success: true };
        }
        return { success: false, message: `${this.modelo} já está parado.` };
    }
    getDadosEspecificos() {
        const dadosPai = super.getDadosEspecificos();
        return {
            ...dadosPai,
            velocidadeMaxima: this.velocidadeMaxima,
            cargaAtual: this.cargaAtual,
            capacidadeCarga: this.capacidadeCarga
        };
    }
    toJSON() {
        const baseJSON = super.toJSON();
        return {
            ...baseJSON,
            _tipoClasse: 'Caminhao',
            capacidadeCarga: this.capacidadeCarga,
            cargaAtual: this.cargaAtual
        };
    }
}

// --- Conteúdo de js/models/Garagem.js ---
class Garagem {
    constructor() {
        this.veiculos = [];
        this.veiculoSelecionadoId = null;
    }
    adicionarVeiculo(veiculo) {
        if (!(veiculo instanceof Veiculo)) {
            console.error("Tentativa de adicionar objeto inválido à garagem:", veiculo);
            return { success: false, message: "Erro interno: Tipo de objeto inválido para adicionar." };
        }
        if (this.veiculos.some(v => v.id === veiculo.id)) {
             console.warn(`Veículo com ID ${veiculo.id} (${veiculo.modelo}) já existe (erro de ID duplicado).`);
             return { success: false, message: `Veículo com ID ${veiculo.id} já existe (erro interno).` };
        }
        if (this.veiculos.some(v => v.modelo.toLowerCase() === veiculo.modelo.toLowerCase() && v.cor.toLowerCase() === veiculo.cor.toLowerCase())) {
            return { success: false, message: `Um veículo ${veiculo.modelo} ${veiculo.cor} já existe na garagem.` };
        }
        this.veiculos.push(veiculo);
        this.veiculos.sort((a, b) => a.modelo.localeCompare(b.modelo));
        return { success: true };
    }
    removerVeiculo(idVeiculo) {
        const index = this.veiculos.findIndex(v => v.id === idVeiculo);
        if (index > -1) {
            this.veiculos.splice(index, 1);
            if (this.veiculoSelecionadoId === idVeiculo) {
                this.veiculoSelecionadoId = null;
                 localStorage.removeItem('garagemVeiculoSelecionadoId');
            }
            return true;
        }
        return false;
    }
    encontrarVeiculo(idVeiculo) {
        return this.veiculos.find(v => v.id === idVeiculo);
    }
    selecionarVeiculo(idVeiculo) {
         if (idVeiculo === null) {
             if (this.veiculoSelecionadoId !== null) {
                 this.veiculoSelecionadoId = null;
                 localStorage.removeItem('garagemVeiculoSelecionadoId');
                 return true;
             }
             return false;
         }
         const veiculoEncontrado = this.encontrarVeiculo(idVeiculo);
         if (veiculoEncontrado) {
             if (this.veiculoSelecionadoId !== idVeiculo) {
                 this.veiculoSelecionadoId = idVeiculo;
                 localStorage.setItem('garagemVeiculoSelecionadoId', idVeiculo);
                 return true;
             }
             return true;
         } else {
             return false;
         }
    }
    getVeiculoSelecionado() {
        return this.encontrarVeiculo(this.veiculoSelecionadoId);
    }
    salvarNoLocalStorage() {
        try {
            const garagemParaSalvar = this.veiculos.map(v => v.toJSON());
            const garagemJSON = JSON.stringify(garagemParaSalvar);
            localStorage.setItem('minhaGaragemVirtual', garagemJSON);
        } catch (error) {
            console.error("Erro CRÍTICO ao salvar garagem no LocalStorage:", error);
            // Considerar notificar o usuário de forma não obstrutiva
            if (typeof ui !== 'undefined' && ui.notificationArea) { // Verifica se ui está disponível
                showNotification("ERRO: Não foi possível salvar os dados da garagem!", "error", 5000, ui);
            }
        }
    }
    static carregarDoLocalStorage() {
        const garagemJSON = localStorage.getItem('minhaGaragemVirtual');
        const veiculosCarregados = [];
        if (!garagemJSON) {
             return veiculosCarregados;
        }
        try {
            const veiculosSalvos = JSON.parse(garagemJSON);
            veiculosSalvos.forEach(obj => {
                try {
                    if (!obj || !obj._tipoClasse) {
                        return;
                    }
                    let veiculo = null;
                    let historicoRecriado = [];
                    if (obj.historicoManutencao && Array.isArray(obj.historicoManutencao)) {
                       historicoRecriado = obj.historicoManutencao
                        .map(mObj => {
                            if (mObj && mObj._tipoClasse === 'Manutencao') {
                                try {
                                    const manut = new Manutencao(mObj.dataISO, mObj.tipo, mObj.custo, mObj.descricao);
                                    if(mObj.id) manut.id = mObj.id;
                                    return manut.isValidDate() ? manut : null;
                                } catch(manutError) {
                                    return null;
                                }
                            }
                            return null;
                        })
                        .filter(m => m !== null);
                       historicoRecriado.sort((a, b) => b.data.getTime() - a.data.getTime());
                    }
                    switch (obj._tipoClasse) {
                        case 'Carro':
                            veiculo = new Carro(obj.modelo, obj.cor, obj.id, obj.ligado, obj.velocidade);
                            break;
                        case 'CarroEsportivo':
                            veiculo = new CarroEsportivo(obj.modelo, obj.cor, obj.id, obj.ligado, obj.velocidade, obj.turboBoostUsado || false);
                            break;
                        case 'Caminhao':
                            veiculo = new Caminhao(obj.modelo, obj.cor, obj.capacidadeCarga, obj.id, obj.ligado, obj.velocidade, obj.cargaAtual);
                            break;
                    }
                    if (veiculo) {
                        veiculo.historicoManutencao = historicoRecriado;
                        if (!veiculosCarregados.some(v => v.id === veiculo.id)) {
                            veiculosCarregados.push(veiculo);
                        }
                    }
                 } catch (veiculoError) {
                      console.error(`Erro ao carregar/recriar veículo individual (ID: ${obj?.id}, Tipo: ${obj?._tipoClasse}):`, veiculoError, "Objeto original:", obj);
                 }
            });
             veiculosCarregados.sort((a, b) => a.modelo.localeCompare(b.modelo));
             return veiculosCarregados;
        } catch (error) {
            console.error("Erro CRÍTICO ao carregar/parsear dados da garagem do LS:", error);
            return [];
        }
    }
    verificarAgendamentosProximos() {
        const agora = new Date();
        const doisDiasEmMillis = 2 * 24 * 60 * 60 * 1000;
        const limite = new Date(agora.getTime() + doisDiasEmMillis);
        let notificacoesParaMostrar = [];
        this.veiculos.forEach(veiculo => {
            veiculo.historicoManutencao.forEach(manutencao => {
                if (manutencao.isValidDate() && manutencao.data >= agora && manutencao.data <= limite) {
                    const diffMillis = manutencao.data.getTime() - agora.getTime();
                    const diffHoras = Math.round(diffMillis / (1000 * 60 * 60));
                    const diffDias = Math.floor(diffMillis / (1000 * 60 * 60 * 24));
                    let tempoRestanteStr = "";
                    if (diffMillis < 30 * 60 * 1000) tempoRestanteStr = "em menos de 30 min";
                    else if (diffMillis < 60 * 60 * 1000) tempoRestanteStr = "em menos de 1h";
                    else if (diffDias === 0) tempoRestanteStr = `hoje (~${diffHoras}h)`;
                    else if (diffDias === 1) tempoRestanteStr = `amanhã (~${diffHoras}h)`;
                    else tempoRestanteStr = `em ${diffDias} dias (~${diffHoras}h)`;
                    const dataFormatada = manutencao.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                                         + ' às '
                                         + manutencao.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    notificacoesParaMostrar.push({
                        data: manutencao.data,
                        msg: `Lembrete: ${manutencao.tipo} p/ ${veiculo.modelo} ${tempoRestanteStr} (${dataFormatada}).`
                    });
                }
            });
        });
        notificacoesParaMostrar.sort((a, b) => a.data.getTime() - b.data.getTime());
        return notificacoesParaMostrar.map(n => n.msg);
    }
}

// --- Conteúdo de js/principal.js ---
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
    cidadeInputTempo: document.getElementById('cidade-input-tempo'),
    verificarClimaBtn: document.getElementById('verificar-clima-btn'),
    previsaoResultadoDivTempo: document.getElementById('previsao-tempo-resultado'),
    statusMensagemTempoDiv: document.getElementById('status-mensagem-tempo'),
};

const minhaGaragem = new Garagem();
let velocimetroPathLength = 251.2;
const WEATHER_API_KEY = "569ee28c1908ad6eaadb431e635166be";

function atualizarListaVeiculosSidebar() {
    const listaUl = ui.listaVeiculosSidebar;
    if (!listaUl) return;
    listaUl.innerHTML = '';
    if (minhaGaragem.veiculos.length === 0) {
        listaUl.innerHTML = '<li class="placeholder">Nenhum veículo na garagem.</li>';
        return;
    }
    const veiculosParaExibir = [...minhaGaragem.veiculos];
    veiculosParaExibir.sort((a,b) => a.modelo.localeCompare(b.modelo));
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
    if (!ui.velocimetroProgressoPath && ui.painelVeiculoSelecionado && ui.painelVeiculoSelecionado.style.display !== 'none') {
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
            if (!ui.velocimetroProgressoPath && ui.painelVeiculoSelecionado && ui.painelVeiculoSelecionado.style.display === 'block') {
                ui.velocimetroProgressoPath = ui.painelVeiculoSelecionado.querySelector('.velocimetro-progresso');
            }
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
            else if (!resultadoAcao.success && !resultadoAcao.message.toLowerCase().includes('máxima') &&
                     !resultadoAcao.message.toLowerCase().includes('parado') &&
                     !resultadoAcao.message.toLowerCase().includes('já estava') &&
                     !resultadoAcao.message.toLowerCase().includes('primeiro') &&
                     !resultadoAcao.message.toLowerCase().includes('inválida') &&
                     !resultadoAcao.message.toLowerCase().includes('segurança')) {
                notificationType = 'error';
            }
            showNotification(resultadoAcao.message, notificationType, 3500, ui);
        } else if (resultadoAcao.success && (acao === 'acelerar' || acao === 'frear')) { /* No notification */ }
        else if (resultadoAcao.success) {
            showNotification(`${veiculo.modelo} ${acao} com sucesso.`, 'success', 2000, ui);
        }
    } catch (error) {
        console.error(`Erro ao executar ação '${acao}':`, error, "Veículo atual:", veiculo);
        showNotification(`Ocorreu um erro inesperado ao executar a ação '${acao}'. Verifique o console.`, 'error', 5000, ui);
    } finally {
        if (precisaSalvar) {
            minhaGaragem.salvarNoLocalStorage();
        }
        atualizarPainelVeiculoSelecionado();
    }
}

function adicionarNovoVeiculo(event) {
    console.log("adicionarNovoVeiculo disparado"); // LOGGING
    event.preventDefault();

    if (!ui.formNovoVeiculo) { // Verificação crucial
        console.error("Formulário de novo veículo (formNovoVeiculo) não encontrado!");
        showNotification("Erro interno crítico: Formulário não existe.", "error", 6000, ui);
        return;
    }

    const tipo = ui.novoVeiculoTipo?.value;
    const modelo = ui.novoVeiculoModelo?.value.trim();
    const cor = ui.novoVeiculoCor?.value.trim();
    const capacidadeStr = ui.novoVeiculoCapacidade?.value;

    console.log("Dados do formulário:", { tipo, modelo, cor, capacidadeStr }); // LOGGING

    if (!tipo) { showNotification("Selecione o tipo de veículo.", 'warning', 3000, ui); ui.novoVeiculoTipo?.focus(); return; }
    if (!modelo) { showNotification("Informe o modelo do veículo.", 'warning', 3000, ui); ui.novoVeiculoModelo?.focus(); return; }
    if (!cor) { showNotification("Informe a cor do veículo.", 'warning', 3000, ui); ui.novoVeiculoCor?.focus(); return; }

    let novoVeiculo = null;
    try {
        switch (tipo) {
            case 'Carro': novoVeiculo = new Carro(modelo, cor); break;
            case 'CarroEsportivo': novoVeiculo = new CarroEsportivo(modelo, cor); break;
            case 'Caminhao':
                 const capacidadeCarga = parseInt(capacidadeStr, 10);
                 if (!capacidadeStr || isNaN(capacidadeCarga) || capacidadeCarga <= 0) {
                     showNotification("Para Caminhão, informe uma capacidade de carga válida (kg).", 'warning', 4000, ui);
                     ui.novoVeiculoCapacidade?.focus(); return;
                 }
                novoVeiculo = new Caminhao(modelo, cor, capacidadeCarga); break;
            default: showNotification("Tipo de veículo selecionado é inválido.", 'error', 3000, ui); return;
        }
        if (!novoVeiculo) throw new Error("Falha na criação da instância do veículo.");
    } catch (error) {
        showNotification(`Erro ao criar veículo: ${error.message || 'Erro desconhecido'}`, 'error', 5000, ui); return;
    }

    console.log("Novo veículo instanciado:", novoVeiculo); // LOGGING
    const resultadoAdicao = minhaGaragem.adicionarVeiculo(novoVeiculo);
    console.log("Resultado da adição:", resultadoAdicao); // LOGGING

    if (resultadoAdicao.success) {
        minhaGaragem.salvarNoLocalStorage();
        showNotification(`${novoVeiculo.modelo} adicionado com sucesso!`, 'success', 3000, ui);
        ui.formNovoVeiculo.reset();
        if(ui.divCapacidadeCaminhao) ui.divCapacidadeCaminhao.style.display = 'none';
        if(ui.modalAdicionar && ui.modalAdicionar.open) ui.modalAdicionar.close();
        if(minhaGaragem.selecionarVeiculo(novoVeiculo.id)) {
            ativarTab('tab-visao-geral');
        }
        atualizarInterfaceCompleta();
    } else {
         showNotification(resultadoAdicao.message || `Não foi possível adicionar ${modelo}.`, 'warning', 4000, ui);
         ui.novoVeiculoModelo?.focus();
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
    catch (error) { showNotification("Erro ao processar dados da manutenção. Verifique os campos.", 'error', 4000, ui); return; }
    const resultadoAddManut = veiculo.adicionarManutencao(novaManutencao);
    if (resultadoAddManut.success) {
        minhaGaragem.salvarNoLocalStorage();
        ui.formManutencao.reset();
        atualizarPainelVeiculoSelecionado();
        showNotification("Registro de manutenção salvo!", 'success', 3000, ui);
    } else {
        showNotification(resultadoAddManut.message || "Não foi possível salvar a manutenção.", 'error', 4000, ui);
        if (resultadoAddManut.message?.toLowerCase().includes("data")) ui.manutencaoDataHora.focus();
        else if (resultadoAddManut.message?.toLowerCase().includes("tipo")) ui.manutencaoTipo.focus();
    }
}

function lidarComCliqueListaManutencao(event) {
    const removeButton = event.target.closest('.botao-remover-item');
    if (!removeButton) return;
    const liElement = removeButton.closest('li[data-item-id]');
    if (!liElement || !liElement.dataset.itemId) {
        return;
    }
    removerManutencaoItem(liElement.dataset.itemId);
}

function removerManutencaoItem(idManutencao) {
     const veiculo = minhaGaragem.getVeiculoSelecionado();
     if (!veiculo) return;
     const itemParaRemover = veiculo.historicoManutencao.find(m => m.id === idManutencao);
     const msgConfirm = itemParaRemover ? `Remover este item?\n\n"${itemParaRemover.retornarFormatada(true)}"` : "Tem certeza que deseja remover este item de manutenção?";
     if (confirm(msgConfirm)) {
         if (veiculo.removerManutencao(idManutencao)) {
             minhaGaragem.salvarNoLocalStorage();
             atualizarPainelVeiculoSelecionado();
             showNotification("Item de manutenção removido.", 'success', 2000, ui);
         } else {
             showNotification("Não foi possível remover o item de manutenção.", 'error', 3000, ui);
         }
     }
}

function removerVeiculoSelecionado() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo) {
        showNotification("Nenhum veículo selecionado para remover.", 'warning', 3000, ui);
        return;
    }
    if (confirm(`ATENÇÃO!\n\nTem certeza que deseja remover o veículo ${veiculo.modelo} (${veiculo.cor}) da garagem?\n\nEsta ação NÃO pode ser desfeita.`)) {
         if (minhaGaragem.removerVeiculo(veiculo.id)) {
              minhaGaragem.salvarNoLocalStorage();
              showNotification(`${veiculo.modelo} removido com sucesso da garagem.`, 'success', 3000, ui);
              atualizarInterfaceCompleta();
         } else {
             showNotification(`Falha ao tentar remover ${veiculo.modelo}.`, 'error', 3000, ui);
         }
    }
}

async function buscarDetalhesVeiculoAPI(identificadorVeiculo) {
    const urlAPI = './dados_veiculos_api.json';
    try {
        const response = await fetch(urlAPI, { cache: "no-cache" });
        if (!response.ok) {
            const erroMsg = `Falha ao buscar detalhes (Erro ${response.status}: ${response.statusText}). Verifique o arquivo '${urlAPI}'.`;
            return { erro: true, mensagem: erroMsg };
        }
        const dadosTodosVeiculos = await response.json();
        if (!Array.isArray(dadosTodosVeiculos)) {
            return { erro: true, mensagem: "Formato de dados inválido na API de veículos." };
        }
        const detalhes = dadosTodosVeiculos.find(v => v && v.id === identificadorVeiculo);
        return detalhes ? detalhes : null;
    } catch (error) {
        let mensagemErro = "Erro desconhecido ao buscar detalhes do veículo.";
        if (error instanceof SyntaxError) mensagemErro = "Erro de formato (JSON inválido) na API de veículos.";
        else if (error instanceof TypeError && error.message.includes('fetch')) mensagemErro = "Erro de rede ao conectar com a API de veículos.";
        else if (error.message) mensagemErro = error.message;
        return { erro: true, mensagem: mensagemErro };
    }
}

async function lidarCliqueDetalhesExtras() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo || !veiculo.id) {
        showNotification("Selecione um veículo para ver detalhes extras.", "warning", 3000, ui);
        return;
    }
    if (!ui.detalhesExtrasVeiculoDiv || !ui.btnVerDetalhesExtras) {
        showNotification("Erro interno na interface de detalhes extras.", "error", 4000, ui);
        return;
    }
    ui.detalhesExtrasVeiculoDiv.innerHTML = `<p class="loading-feedback"><i class="fas fa-spinner fa-spin"></i> Carregando detalhes extras...</p>`;
    ui.detalhesExtrasVeiculoDiv.style.display = 'block';
    ui.btnVerDetalhesExtras.disabled = true;
    const detalhes = await buscarDetalhesVeiculoAPI(veiculo.id);
    if(ui.btnVerDetalhesExtras) ui.btnVerDetalhesExtras.disabled = false;
    if (detalhes && detalhes.erro) {
        ui.detalhesExtrasVeiculoDiv.innerHTML = `<p class="error-feedback"><i class="fas fa-exclamation-triangle"></i> Erro ao carregar: ${detalhes.mensagem}</p>`;
    } else if (detalhes) {
        let recallStatus = detalhes.recallPendente
            ? `<span class="recall-pendente">Sim${detalhes.recallDescricao ? ` (${detalhes.recallDescricao})` : ''}</span>`
            : `<span class="recall-ok">Não</span>`;
        let dataRevisaoFormatada = 'N/A';
        if (detalhes.ultimaRevisaoAPI) {
            try {
                const dataObj = new Date(detalhes.ultimaRevisaoAPI + 'T00:00:00');
                if (!isNaN(dataObj.getTime())) {
                    dataRevisaoFormatada = dataObj.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
                } else {
                    throw new Error("Data de revisão da API inválida.");
                }
            } catch (e) {
                dataRevisaoFormatada = 'Data Inválida';
            }
        }
        ui.detalhesExtrasVeiculoDiv.innerHTML = `
            <p><i class="fas fa-dollar-sign"></i> <strong>Valor FIPE:</strong> ${detalhes.valorFipe ? detalhes.valorFipe.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A'}</p>
            <p><i class="fas fa-calendar-alt"></i> <strong>Última Revisão (API):</strong> ${dataRevisaoFormatada}</p>
            <p><i class="fas fa-exclamation-circle"></i> <strong>Recall Pendente:</strong> ${recallStatus}</p>
            <p><i class="fas fa-lightbulb"></i> <strong>Dica:</strong> ${detalhes.dicaManutencao || 'N/A'}</p>
            <p><i class="fas fa-star"></i> <strong>Curiosidade:</strong> ${detalhes.fatoCurioso || '-'}</p>
        `;
    } else {
        ui.detalhesExtrasVeiculoDiv.innerHTML = `<p class="notfound-feedback"><i class="fas fa-search"></i> Nenhum detalhe extra encontrado para ${veiculo.modelo}.</p>`;
    }
}

async function buscarPrevisaoDetalhadaTempo(cidade) {
    console.log(`Buscando previsão para: ${cidade}`); // LOGGING
    // A verificação da chave placeholder foi movida para handleVerificarClima para dar feedback mais cedo
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&appid=${WEATHER_API_KEY}&units=metric&lang=pt_br`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Resposta da API de tempo:", data); // LOGGING
        if (!response.ok) {
            throw new Error(data.message || `Erro ${response.status} ao buscar previsão.`);
        }
        if (data.cod && String(data.cod) !== "200") { // API pode retornar "200" como string
            throw new Error(data.message || `API de tempo retornou erro: ${data.cod}`);
        }
        return data;
    } catch (error) {
        console.error("Falha ao buscar previsão detalhada do tempo:", error.message); // LOGGING
        throw error;
    }
}

function processarDadosForecastTempo(dataApi) {
    if (!dataApi || !dataApi.list || !Array.isArray(dataApi.list) || dataApi.list.length === 0) {
        console.warn("processarDadosForecastTempo: Dados da API inválidos.", dataApi); // LOGGING
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
            hora: item.dt_txt.split(' ')[1].substring(0,5),
            temp: item.main.temp,
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
        const previsaoRepresentativa = diaInfo.horas_previsao.find(p => p.hora === "12:00" || p.hora === "15:00" || p.hora === "14:00");
        if (previsaoRepresentativa) {
            descricaoRep = previsaoRepresentativa.descricao;
            iconeRep = previsaoRepresentativa.icone;
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
    console.log("Previsão processada:", previsaoDiariaProcessada); // LOGGING
    return previsaoDiariaProcessada.slice(0, 5);
}

function exibirPrevisaoDetalhadaTempo(previsaoDiaria, nomeCidade) {
    if (!ui.previsaoResultadoDivTempo) return;
    ui.previsaoResultadoDivTempo.innerHTML = '';
    if (!previsaoDiaria || previsaoDiaria.length === 0) {
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

function formatarDataParaExibicaoTempo(dataString) {
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
}

function capitalizarPrimeiraLetraTempo(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function exibirStatusTempo(mensagem, tipo = 'info') {
    if (!ui.statusMensagemTempoDiv) return;
    ui.statusMensagemTempoDiv.textContent = mensagem;
    ui.statusMensagemTempoDiv.className = 'status-mensagem';
    if (tipo && tipo !== 'info') {
        ui.statusMensagemTempoDiv.classList.add(tipo);
    }
    ui.statusMensagemTempoDiv.style.backgroundColor = '';
    ui.statusMensagemTempoDiv.style.display = mensagem ? 'block' : 'none';
}

async function handleVerificarClima() {
    console.log("handleVerificarClima disparado"); // LOGGING
    if (!ui.cidadeInputTempo || !ui.verificarClimaBtn || !ui.previsaoResultadoDivTempo || !ui.statusMensagemTempoDiv) {
        console.error("Elementos da UI para previsão do tempo não encontrados!");
        alert("Erro: Interface de previsão do tempo não carregada.");
        return;
    }

    const cidade = ui.cidadeInputTempo.value.trim();
    console.log(`Cidade para verificar: '${cidade}'`); // LOGGING

    if (!cidade) {
        exibirStatusTempo("Por favor, digite o nome de uma cidade.", 'error');
        ui.previsaoResultadoDivTempo.innerHTML = '';
        return;
    }
    if (WEATHER_API_KEY === "YOUR_API_KEY_HERE" || WEATHER_API_KEY === "569ee28c1908ad6eaadb431e635166be" /* Sua chave placeholder */) {
         exibirStatusTempo("AVISO: A chave da API de Previsão do Tempo não foi configurada. Verifique o código.", 'error');
         ui.previsaoResultadoDivTempo.innerHTML = '';
         return;
    }

    exibirStatusTempo("Carregando previsão...", 'loading');
    ui.previsaoResultadoDivTempo.innerHTML = '';
    ui.verificarClimaBtn.disabled = true; // Desabilita botão durante a busca

    try {
        const dadosApi = await buscarPrevisaoDetalhadaTempo(cidade);
        const nomeCidadeApi = dadosApi.city && dadosApi.city.name ? dadosApi.city.name : cidade;
        const previsaoProcessada = processarDadosForecastTempo(dadosApi);

        if (previsaoProcessada && previsaoProcessada.length > 0) {
            exibirPrevisaoDetalhadaTempo(previsaoProcessada, nomeCidadeApi);
            exibirStatusTempo("");
        } else {
            exibirStatusTempo(`Não foi possível obter uma previsão válida para ${capitalizarPrimeiraLetraTempo(nomeCidadeApi)}. Verifique o nome da cidade.`, 'error');
        }
    } catch (error) {
        console.error("Erro em handleVerificarClima:", error.message); // LOGGING
        if (error.message && error.message.toLowerCase().includes("city not found")) {
             exibirStatusTempo(`Cidade "${capitalizarPrimeiraLetraTempo(cidade)}" não encontrada.`, 'error');
        } else if (error.message && error.message.toLowerCase().includes("invalid api key")) {
            exibirStatusTempo("Erro de autenticação com a API de tempo (chave inválida).", 'error');
        } else {
             exibirStatusTempo(error.message || "Ocorreu um erro desconhecido ao buscar a previsão.", 'error');
        }
    } finally {
        if(ui.verificarClimaBtn) ui.verificarClimaBtn.disabled = false; // Reabilita o botão
    }
}

// --- Inicialização da Aplicação ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado. Iniciando Garagem Virtual V3 & Previsão do Tempo...");

    let uiElementsOk = true;
    for (const key in ui) {
        if (ui[key] === null && !key.endsWith('Path')) {
            console.error(`[UI Check Error] Elemento da UI não encontrado: ${key} (ID: ${key}) - Verifique o HTML.`);
            uiElementsOk = false;
        }
    }
    if (!uiElementsOk) {
        alert("ERRO CRÍTICO: Alguns elementos essenciais da interface não foram encontrados. A aplicação não funcionará corretamente. Verifique o console (F12) para detalhes sobre quais IDs estão faltando no HTML.");
        // Poderia parar a execução aqui se elementos muito críticos estiverem faltando
        // return;
    }

    try {
        const pathElement = document.querySelector('svg.velocimetro-svg .velocimetro-progresso');
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

        // Listeners da Garagem
        if (ui.btnAbrirModalAdicionar && ui.modalAdicionar) {
            ui.btnAbrirModalAdicionar.addEventListener('click', () => {
                console.log("Botão 'Adicionar Novo Veículo' clicado."); // LOGGING
                if(ui.formNovoVeiculo) ui.formNovoVeiculo.reset();
                if(ui.divCapacidadeCaminhao) ui.divCapacidadeCaminhao.style.display = 'none';
                if(ui.novoVeiculoTipo) ui.novoVeiculoTipo.value = "";
                if (ui.modalAdicionar && typeof ui.modalAdicionar.showModal === 'function' && !ui.modalAdicionar.open) {
                    try { ui.modalAdicionar.showModal(); } catch (e) { console.error("Erro ao abrir modal:", e); }
                } else if (!ui.modalAdicionar || typeof ui.modalAdicionar.showModal !== 'function') {
                    console.error("Elemento modalAdicionar não encontrado ou não é um dialog.");
                }
            });
        } else { console.warn("Botão de abrir modal ou o próprio modal não encontrados."); }

        if (ui.btnFecharModalAdicionar && ui.modalAdicionar) {
            ui.btnFecharModalAdicionar.addEventListener('click', () => { if (ui.modalAdicionar && ui.modalAdicionar.open) ui.modalAdicionar.close(); });
        }
        if (ui.modalAdicionar) {
            ui.modalAdicionar.addEventListener('click', (event) => { if (event.target === ui.modalAdicionar && ui.modalAdicionar.open) ui.modalAdicionar.close(); });
        }
        if (ui.formNovoVeiculo) { // Adiciona listener SE o form existir
             ui.formNovoVeiculo.addEventListener('submit', adicionarNovoVeiculo);
        } else { console.error("Formulário formNovoVeiculo não encontrado. Adicionar veículo não funcionará."); }


        if (ui.novoVeiculoTipo && ui.divCapacidadeCaminhao) {
            ui.novoVeiculoTipo.addEventListener('change', (event) => {
                if(ui.divCapacidadeCaminhao) ui.divCapacidadeCaminhao.style.display = (event.target.value === 'Caminhao') ? 'block' : 'none';
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

        if (ui.notificationCloseBtn && ui.notificationArea) ui.notificationCloseBtn.addEventListener('click', () => hideNotification(ui));
        if (ui.btnVerDetalhesExtras) ui.btnVerDetalhesExtras.addEventListener('click', lidarCliqueDetalhesExtras);

        // Listeners da Previsão do Tempo
        if (ui.verificarClimaBtn) {
            ui.verificarClimaBtn.addEventListener('click', handleVerificarClima);
        } else { console.error("Botão verificarClimaBtn não encontrado."); }

        if (ui.cidadeInputTempo) {
            ui.cidadeInputTempo.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    handleVerificarClima();
                }
            });
        } else { console.error("Input cidadeInputTempo não encontrado."); }

        if (WEATHER_API_KEY === "YOUR_API_KEY_HERE" || WEATHER_API_KEY === "569ee28c1908ad6eaadb431e635166be") {
            exibirStatusTempo("AVISO: A chave da API de Previsão do Tempo não foi configurada. Verifique o código.", 'warning');
            if(ui.verificarClimaBtn) ui.verificarClimaBtn.disabled = true;
        }

        ativarTab('tab-visao-geral');
        atualizarInterfaceCompleta();

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
        alert("Ocorreu um erro grave ao iniciar a aplicação. Algumas funcionalidades podem estar indisponíveis. Verifique o console do navegador (F12) para mais detalhes.");
        const body = document.querySelector('body');
        if (body) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = "padding: 20px; margin: 20px; background-color: #ffdddd; border: 2px solid red; color: #a02533; text-align: center; font-family: sans-serif; position: fixed; top: 0; left: 0; width: 100%; z-index: 9999;";
            errorDiv.innerHTML = `<h1>Erro na Aplicação</h1><p>Não foi possível carregar corretamente.</p><p><strong>Detalhes do Erro (ver console para mais):</strong> ${error.message}</p><p><em>Verifique o console do navegador (F12).</em></p>`;
            body.prepend(errorDiv);
        }
    }
});