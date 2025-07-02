// script.js - Garagem Inteligente Pro (Versão Final Corrigida e Depurada)

// ======================================================================================
// PASSO 1: COLE A URL CORRETA DO SEU BACKEND AQUI!
// Exemplo: 'https://meu-backend-incrivel.onrender.com'
const BACKEND_URL = 'https://carro-interativo-ylna.onrender.com';
// ======================================================================================

// --- BLOCO DE INTEGRAÇÃO COM O BACKEND (CLIMA) ---
const weatherWidget = document.getElementById('weather-widget');
const weatherDetailsPanel = document.getElementById('weather-details-panel');

function updateWeatherWidgetUI(currentData) {
    document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png`;
    document.getElementById('weather-icon').alt = currentData.weather[0].description;
    document.getElementById('weather-temp').textContent = `${Math.round(currentData.main.temp)}°C`;
    document.getElementById('weather-city').textContent = currentData.name;
    const weatherId = currentData.weather[0].id;
    const tipElement = document.getElementById('weather-tip');
    let tip = "";
    if (weatherId >= 200 && weatherId < 600) tip = "Pista escorregadia. Reduza a velocidade.";
    else if (weatherId >= 600 && weatherId < 700) tip = "Condições perigosas. Evite dirigir.";
    else if (weatherId === 800 && new Date().getHours() > 18) tip = "Boa noite para um passeio!";
    else if (currentData.main.temp < 5) tip = "Frio intenso! Verifique a pressão dos pneus.";
    else if (currentData.main.temp > 30) tip = "Calor extremo! Verifique o sistema de arrefecimento.";
    tipElement.textContent = tip;
}

function updateDetailedForecastUI(forecastData) {
    const dailyForecasts = {};
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyForecasts[date]) { dailyForecasts[date] = { temps: [], weathers: [] }; }
        dailyForecasts[date].temps.push(item.main.temp);
        dailyForecasts[date].weathers.push(item.weather[0]);
    });
    let forecastHtml = '<h4>Previsão para os Próximos Dias</h4>';
    Object.keys(dailyForecasts).slice(0, 5).forEach(dateStr => {
        const dayData = dailyForecasts[dateStr];
        if (new Date(dateStr).getDate() === new Date().getDate() && dayData.weathers.length < 4) return;
        const date = new Date(dateStr + "T12:00:00");
        const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
        const temp_max = Math.round(Math.max(...dayData.temps));
        const temp_min = Math.round(Math.min(...dayData.temps));
        const representativeWeather = dayData.weathers[Math.floor(dayData.weathers.length / 2)];
        forecastHtml += `
            <div class="forecast-day">
                <span class="day-name">${dayName}</span>
                <img src="https://openweathermap.org/img/wn/${representativeWeather.icon}.png" alt="${representativeWeather.description}">
                <span class="description">${representativeWeather.description}</span>
                <span class="temp-range">
                    <span class="temp-max">${temp_max}°</span> / <span class="temp-min">${temp_min}°</span>
                </span>
            </div>`;
    });
    weatherDetailsPanel.innerHTML = forecastHtml;
}

async function fetchWeatherFromBackend(params) {
    weatherWidget.classList.add('loading');
    const queryString = new URLSearchParams(params).toString();
    const url = `${BACKEND_URL}/api/weather?${queryString}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erro do servidor: ${response.status}`);
        }
        const data = await response.json();
        updateWeatherWidgetUI(data.current);
        updateDetailedForecastUI(data.forecast);
        localStorage.setItem('weatherCache', JSON.stringify({ lat: data.current.coord.lat, lon: data.current.coord.lon, city: data.current.name }));
        document.getElementById('owm-city').value = data.current.name;
    } catch (error) {
        showNotification(error.message, 'error');
        document.getElementById('weather-city').textContent = 'Falha ao carregar';
        console.error("Erro ao buscar dados do backend:", error);
    } finally {
        weatherWidget.classList.remove('loading');
    }
}

function getWeatherByGeolocation() {
    if (!navigator.geolocation) {
        showNotification("Geolocalização não suportada. Buscando por São Paulo.", 'warning');
        fetchWeatherFromBackend({ city: 'São Paulo' });
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => fetchWeatherFromBackend({ lat: position.coords.latitude, lon: position.coords.longitude }),
        () => {
            showNotification("Acesso à localização negado. Buscando por São Paulo.", 'info');
            fetchWeatherFromBackend({ city: 'São Paulo' });
        }
    );
}

function loadWeatherByCityName() {
    const city = document.getElementById('owm-city').value.trim();
    if (!city) { showNotification("Por favor, digite o nome de uma cidade.", 'warning'); return; }
    document.getElementById('weather-city').textContent = `Buscando ${city}...`;
    fetchWeatherFromBackend({ city });
}


// --- FUNÇÕES DE INTEGRAÇÃO (STATUS, DICAS, ARSENAL) ---

function updateGarageStatus() {
    const veiculosEl = document.getElementById('status-veiculos');
    const agendamentosEl = document.getElementById('status-agendamentos');
    veiculosEl.textContent = `Veículos: ${garagem.veiculos.length}`;
    const agendamentosAtivos = garagem.agendamentos.filter(a => a.status === 'Agendado').length;
    agendamentosEl.textContent = `Agendamentos: ${agendamentosAtivos}`;
}

async function fetchAndDisplayMaintenanceTips(vehicleType) {
    const tipsContentEl = document.getElementById('maintenance-tips-content');
    tipsContentEl.innerHTML = `<p class="loading-message">Buscando dicas do especialista...</p>`;
    try {
        const response = await fetch(`${BACKEND_URL}/api/dicas/${vehicleType}`);
        if (!response.ok) {
            throw new Error(`Falha ao buscar dicas: ${response.statusText}`);
        }
        const dicas = await response.json();
        tipsContentEl.innerHTML = `<ul>${dicas.map(dica => `<li>${dica}</li>`).join('')}</ul>`;
    } catch (error) {
        console.error(`Erro ao buscar dicas para ${vehicleType}:`, error);
        tipsContentEl.innerHTML = '<p class="error-message">Não foi possível carregar as dicas. Verifique se o backend está online.</p>';
    }
}

async function fetchGenericArsenalData(endpoint, containerId, renderer) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<p class="loading-message">Carregando dados...</p>`;
    try {
        const response = await fetch(`${BACKEND_URL}/api/arsenal/${endpoint}`);
        if (!response.ok) throw new Error(`Falha na API: ${response.statusText}`);
        const data = await response.json();
        if (data.length === 0) {
            container.innerHTML = `<p class="info-message">Nenhum item encontrado.</p>`;
            return;
        }
        container.innerHTML = renderer(data);
    } catch (error) {
        console.error(`Erro ao buscar ${endpoint}:`, error);
        container.innerHTML = `<p class="error-message">Falha ao carregar dados. Verifique a URL do backend e se ele está online (pode levar 30s para "acordar").</p>`;
    }
}

function loadArsenalData() {
    fetchGenericArsenalData('veiculos-estrela', 'veiculos-estrela-container', data =>
        data.map(v => `
            <div class="arsenal-card">
                <img src="${v.imagemURL}" alt="Imagem de ${v.modelo}" loading="lazy">
                <div class="arsenal-card-content">
                    <h4>${v.modelo}</h4>
                    <p>${v.descricao}</p>
                </div>
            </div>
        `).join('')
    );
    fetchGenericArsenalData('agendamentos-urgentes', 'agendamentos-urgentes-container', data =>
        data.map(a => `
            <div class="arsenal-list-item" data-urgencia="${a.urgencia}">
                <strong>${a.veiculo}: ${a.servico}</strong>
                <span>Urgência: ${a.urgencia}</span>
            </div>
        `).join('')
    );
    fetchGenericArsenalData('ferramentas-dev', 'ferramentas-dev-container', data =>
        data.map(f => `
            <div class="arsenal-list-item">
                <strong>${f.nome}</strong>
                <span>${f.utilidade}</span>
            </div>
        `).join('')
    );
}

// --- CONSTANTS & UTILITIES ---
const OIL_CHANGE_INTERVAL = 5000;
const TIRE_CHECK_INTERVAL = 10000;
const GENERAL_SERVICE_INTERVAL = 20000;
let nextVehicleId = 1;
let nextAppointmentId = 1;
function generateVehicleId() { return nextVehicleId++; }
function generateAppointmentId() { return nextAppointmentId++; }

// --- NOTIFICATION SYSTEM ---
const notificationsAreaSidebar = document.getElementById('notifications-area-sidebar');
const notificationsAreaFooter = document.getElementById('notifications-area-footer');
function showNotification(message, type = 'info') {
    const notif = document.createElement('p');
    notif.textContent = message;
    notif.className = `notification ${type}`;
    const targetArea = window.innerWidth <= 768 ? notificationsAreaFooter : notificationsAreaSidebar;
    targetArea.appendChild(notif);
    targetArea.style.display = 'flex';
    setTimeout(() => {
        notif.classList.add('fade-out');
        const removeNotif = () => {
            notif.remove();
            if (targetArea.childElementCount === 0 && targetArea === notificationsAreaFooter) {
                targetArea.style.display = 'none';
            }
        };
        notif.addEventListener('transitionend', removeNotif, { once: true });
        notif.addEventListener('animationend', removeNotif, { once: true });
    }, type === 'error' ? 7000 : (type === 'warning' ? 5000 : 4000));
}

// --- CORE CLASSES (Agendamento, Veiculo, Garagem) ---
class Agendamento {
    constructor(idVeiculo, nomeVeiculo, dataAgendamento, tipoServico, observacoes = '') {
        if (!idVeiculo || !dataAgendamento || !tipoServico) {
            throw new Error("ID do veículo, data e tipo de serviço são obrigatórios para agendamento.");
        }
        this.id = generateAppointmentId();
        this.idVeiculo = idVeiculo;
        this.nomeVeiculo = nomeVeiculo;
        this.dataAgendamento = new Date(dataAgendamento + "T00:00:00").toISOString();
        this.tipoServico = tipoServico;
        this.observacoes = observacoes;
        this.status = "Agendado";
    }
    get dataFormatada() {
        return new Date(this.dataAgendamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }
}

class Veiculo {
    constructor(modelo, cor, imagemURL = '') {
        if (!modelo || !cor) throw new Error("Modelo e Cor são obrigatórios.");
        this.id = generateVehicleId();
        this.modelo = modelo;
        this.cor = cor;
        this.imagemURL = imagemURL || `https://via.placeholder.com/400x250.png?text=${encodeURIComponent(modelo)}`;
        this.velocidade = 0;
        this.ligado = false;
        this.kmRodados = 0;
        this.manutencao = {
            oleo: { proximaKm: OIL_CHANGE_INTERVAL, ultimaKm: 0, status: "OK" },
            pneus: { proximaKm: TIRE_CHECK_INTERVAL, ultimaKm: 0, status: "OK" },
            revisaoGeral: { proximaKm: GENERAL_SERVICE_INTERVAL, ultimaKm: 0, status: "OK" },
        };
        this.historicoManutencao = [];
    }
    ligar() { if (!this.ligado) { this.ligado = true; showNotification(`${this.modelo} ligado.`, 'info'); } else showNotification(`${this.modelo} já está ligado.`, 'warning'); this.atualizarDisplayCompleto(); }
    desligar() { if (this.ligado) { if (this.velocidade > 0) { showNotification(`Pare o ${this.modelo} antes de desligar.`, 'error'); return; } this.ligado = false; showNotification(`${this.modelo} desligado.`, 'info'); } else showNotification(`${this.modelo} já está desligado.`, 'warning'); this.atualizarDisplayCompleto(); }
    acelerar(incremento = 10) { if (!this.ligado) { showNotification(`${this.modelo} precisa estar ligado.`, 'error'); return; } this.velocidade += incremento; this.kmRodados += Math.max(1, incremento / 2); this.verificarManutencao(); this.atualizarDisplayCompleto(); }
    frear(decremento = 10) { if (!this.ligado) { showNotification(`${this.modelo} está desligado.`, 'error'); return; } if (this.velocidade <= 0) { showNotification(`${this.modelo} já está parado.`, 'info'); return; } this.velocidade = Math.max(0, this.velocidade - decremento); this.atualizarDisplayCompleto(); }
    buzinar() { showNotification(`${this.modelo}: Beep beep!`, 'info'); }
    adicionarRegistroHistorico(tipoServico, observacoes = "") { this.historicoManutencao.push({ data: new Date().toISOString(), tipoServico: tipoServico, kmNaManutencao: this.kmRodados.toFixed(0), observacoes: observacoes }); }
    verificarManutencao() { const check = (item, interval) => { if (this.kmRodados >= item.proximaKm) item.status = "VENCIDO"; else if (this.kmRodados >= item.proximaKm - (interval / 5)) item.status = "PRÓXIMO"; else item.status = "OK"; }; check(this.manutencao.oleo, OIL_CHANGE_INTERVAL); check(this.manutencao.pneus, TIRE_CHECK_INTERVAL); check(this.manutencao.revisaoGeral, GENERAL_SERVICE_INTERVAL); }
    realizarManutencaoItem(itemKey, interval, itemName, serviceDesc = itemName) { const item = this.manutencao[itemKey]; item.ultimaKm = this.kmRodados; item.proximaKm = this.kmRodados + interval; item.status = "OK"; showNotification(`${itemName} para ${this.modelo} realizada.`, 'success'); this.adicionarRegistroHistorico(serviceDesc, `Realizado em ${this.kmRodados.toFixed(0)} km`); this.verificarManutencao(); this.atualizarDisplayCompleto(); }
    realizarTrocaOleo() { this.realizarManutencaoItem('oleo', OIL_CHANGE_INTERVAL, 'Troca de óleo'); }
    verificarPneus() { this.realizarManutencaoItem('pneus', TIRE_CHECK_INTERVAL, 'Verificação de pneus', 'Verificação/Rodízio de Pneus'); }
    realizarRevisaoGeral() { this.realizarManutencaoItem('revisaoGeral', GENERAL_SERVICE_INTERVAL, 'Revisão geral'); ['oleo', 'pneus'].forEach(key => { this.manutencao[key].ultimaKm = this.kmRodados; this.manutencao[key].proximaKm = this.kmRodados + (key === 'oleo' ? OIL_CHANGE_INTERVAL : TIRE_CHECK_INTERVAL); }); this.adicionarRegistroHistorico('Revisão Geral Completa', `Serviços de óleo e pneus incluídos/verificados.`); this.verificarManutencao(); this.atualizarDisplayCompleto(); }
    getInformacoesBase() { return `<strong>Modelo:</strong> ${this.modelo}, <strong>Cor:</strong> ${this.cor}`; }
    getInformacoesEspecificas() { return `<strong>KM Rodados:</strong> ${this.kmRodados.toFixed(0)} km`; }
    atualizarDisplayCompleto() {
        if (garagem.veiculoSelecionado?.id === this.id) {
            document.getElementById('vehicle-image').src = this.imagemURL;
            document.getElementById('vehicle-image').alt = `Imagem de ${this.modelo}`;
            document.getElementById('selected-vehicle-name').textContent = `${this.constructor.name.replace(/([A-Z])/g, ' $1').trim()} ${this.modelo}`;
            document.getElementById('vehicle-info-basic').innerHTML = this.getInformacoesBase();
            document.getElementById('vehicle-status').innerHTML = `<strong>Status:</strong> ${this.ligado ? "<span class='status-ok'>Ligado</span>" : "<span class='status-vencido'>Desligado</span>"}`;
            document.getElementById('vehicle-speed').innerHTML = `<strong>Velocidade:</strong> ${this.velocidade} km/h`;
            document.getElementById('vehicle-info-specific').innerHTML = this.getInformacoesEspecificas();
            document.getElementById('km-driven').textContent = this.kmRodados.toFixed(0);
            const formatStatus = (s) => `<span class="status-badge status-${s.toLowerCase()}">${s}</span>`;
            let maint = `<strong>Óleo:</strong> ${formatStatus(this.manutencao.oleo.status)} (Próx.: ${this.manutencao.oleo.proximaKm.toFixed(0)} km) <br>`;
            maint += `<strong>Pneus:</strong> ${formatStatus(this.manutencao.pneus.status)} (Próx.: ${this.manutencao.pneus.proximaKm.toFixed(0)} km) <br>`;
            maint += `<strong>Revisão:</strong> ${formatStatus(this.manutencao.revisaoGeral.status)} (Próx.: ${this.manutencao.revisaoGeral.proximaKm.toFixed(0)} km)`;
            document.getElementById('maintenance-status-report').innerHTML = maint;
            document.querySelector('[data-action="ativarTurbo"]').style.display = (this instanceof CarroEsportivo) ? 'inline-flex' : 'none';
            document.querySelector('[data-action="desativarTurbo"]').style.display = (this instanceof CarroEsportivo) ? 'inline-flex' : 'none';
            document.getElementById('truck-load-actions').style.display = (this instanceof Caminhao) ? 'flex' : 'none';
            renderMaintenanceHistory(this);
            fetchAndDisplayMaintenanceTips(this.constructor.name);
        }
        garagem.saveToLocalStorage();
    }
}

class CarroEsportivo extends Veiculo {
    constructor(modelo, cor, imagemURL) { super(modelo, cor, imagemURL); this.turboAtivado = false; }
    ativarTurbo() { if (!this.ligado) { showNotification(`${this.modelo} precisa estar ligado.`, 'error'); return; } if (this.turboAtivado) { showNotification(`Turbo já está ativado.`, 'warning'); return; } this.turboAtivado = true; showNotification(`Turbo ativado para ${this.modelo}!`, 'success'); this.acelerar(20); this.atualizarDisplayCompleto(); }
    desativarTurbo() { if (!this.turboAtivado) { showNotification(`Turbo já está desativado.`, 'warning'); return; } this.turboAtivado = false; showNotification(`Turbo desativado para ${this.modelo}.`, 'info'); this.atualizarDisplayCompleto(); }
    acelerar(incremento = 15) { super.acelerar(this.turboAtivado ? Math.round(incremento * 1.7) : incremento); }
    getInformacoesEspecificas() { const turboStatus = this.turboAtivado ? "<span class='status-value status-ok'>ATIVADO</span>" : "<span class='status-value status-vencido'>Desativado</span>"; return `${super.getInformacoesEspecificas()}<br><strong>Turbo:</strong> ${turboStatus}`; }
}

class Caminhao extends Veiculo {
    constructor(modelo, cor, capacidadeCarga = 1000, imagemURL) { super(modelo, cor, imagemURL); this.capacidadeCarga = parseInt(capacidadeCarga, 10) || 1000; this.cargaAtual = 0; }
    carregar(peso) { peso = parseInt(peso, 10); if (isNaN(peso) || peso <= 0) { showNotification("Peso de carga inválido.", 'error'); return; } if (this.cargaAtual + peso <= this.capacidadeCarga) { this.cargaAtual += peso; showNotification(`${this.modelo} carregado com ${peso}kg. Atual: ${this.cargaAtual}kg.`, 'success'); } else showNotification(`Capacidade excedida (${this.capacidadeCarga}kg).`, 'error'); this.atualizarDisplayCompleto(); }
    descarregar(peso) { peso = parseInt(peso, 10); if (isNaN(peso) || peso <= 0) { showNotification("Peso de descarga inválido.", 'error'); return; } if (this.cargaAtual - peso >= 0) { this.cargaAtual -= peso; showNotification(`${this.modelo} descarregado em ${peso}kg. Atual: ${this.cargaAtual}kg.`, 'success'); } else showNotification(`Carga insuficiente para descarregar ${peso}kg.`, 'error'); this.atualizarDisplayCompleto(); }
    acelerar(incremento = 7) { const fatorCarga = Math.max(0.3, 1 - (this.cargaAtual / (this.capacidadeCarga * 1.5))); super.acelerar(Math.round(incremento * fatorCarga)); }
    getInformacoesEspecificas() { return `${super.getInformacoesEspecificas()}<br><strong>Carga:</strong> ${this.cargaAtual} / ${this.capacidadeCarga} kg`; }
}

class Garagem {
    constructor() { this.veiculos = []; this.agendamentos = []; this.veiculoSelecionado = null; this.loadFromLocalStorage(); }
    adicionarVeiculo(veiculo) { this.veiculos.push(veiculo); showNotification(`${veiculo.constructor.name.replace(/([A-Z])/g, ' $1').trim()} ${veiculo.modelo} adicionado.`, 'success'); this.atualizarSeletorVeiculos(); updateAppointmentVehicleSelector(); document.getElementById('vehicle-selector').value = veiculo.id; this.selecionarVeiculo(veiculo.id); updateGarageStatus(); }
    removerVeiculo(idVeiculo) { const idNum = parseInt(idVeiculo, 10); const index = this.veiculos.findIndex(v => v.id === idNum); if (index > -1) { const removido = this.veiculos.splice(index, 1)[0]; showNotification(`${removido.constructor.name.replace(/([A-Z])/g, ' $1').trim()} ${removido.modelo} removido.`, 'success'); if (this.veiculoSelecionado?.id === idNum) { this.veiculoSelecionado = null; document.getElementById('selected-vehicle-panel').style.display = 'none'; document.getElementById('vehicle-selector').value = ""; } this.agendamentos = this.agendamentos.filter(ag => ag.idVeiculo !== idNum); this.atualizarSeletorVeiculos(); updateAppointmentVehicleSelector(); renderAppointmentsTable(); this.saveToLocalStorage(); updateGarageStatus(); } else showNotification("Veículo não encontrado para remoção.", 'error'); }
    selecionarVeiculo(idVeiculo) { const idNum = idVeiculo ? parseInt(idVeiculo, 10) : null; if (!idNum) { this.veiculoSelecionado = null; document.getElementById('selected-vehicle-panel').style.display = 'none'; document.getElementById('remove-vehicle-button').disabled = true; document.getElementById('maintenance-tips-content').innerHTML = '<p>Selecione um veículo para ver as dicas.</p>'; } else { this.veiculoSelecionado = this.veiculos.find(v => v.id === idNum) || null; if (this.veiculoSelecionado) { document.getElementById('selected-vehicle-panel').style.display = 'block'; document.getElementById('remove-vehicle-button').disabled = false; this.veiculoSelecionado.atualizarDisplayCompleto(); switchVehicleDetailTab('details'); } else { document.getElementById('selected-vehicle-panel').style.display = 'none'; document.getElementById('remove-vehicle-button').disabled = true; } } this.saveToLocalStorage(); }
    atualizarSeletorVeiculos() { const selector = document.getElementById('vehicle-selector'); const currentVal = selector.value; selector.innerHTML = '<option value="">-- Nenhum Veículo --</option>'; this.veiculos.forEach(v => { const option = document.createElement('option'); option.value = v.id; option.textContent = `${v.constructor.name.replace(/([A-Z])/g, ' $1').trim()} - ${v.modelo} (${v.cor})`; selector.appendChild(option); }); selector.value = this.veiculos.find(v => v.id.toString() === currentVal) ? currentVal : ""; document.getElementById('remove-vehicle-button').disabled = !selector.value; }
    adicionarAgendamento(agendamento) { this.agendamentos.push(agendamento); this.agendamentos.sort((a, b) => new Date(a.dataAgendamento) - new Date(b.dataAgendamento)); showNotification(`Agendamento para ${agendamento.nomeVeiculo} em ${agendamento.dataFormatada} criado.`, 'success'); renderAppointmentsTable(); this.saveToLocalStorage(); updateGarageStatus(); }
    atualizarStatusAgendamento(idAgendamento, novoStatus) { const ag = this.agendamentos.find(a => a.id === idAgendamento); if (ag) { ag.status = novoStatus; showNotification(`Agendamento para ${ag.nomeVeiculo} foi ${novoStatus.toLowerCase()}.`, 'info'); if (novoStatus === "Concluído") { const veiculo = this.veiculos.find(v => v.id === ag.idVeiculo); veiculo?.adicionarRegistroHistorico(`Serviço Agendado: ${ag.tipoServico}`, `Realizado conforme agendamento. Observações: ${ag.observacoes || 'Nenhuma'}`); veiculo?.atualizarDisplayCompleto(); } renderAppointmentsTable(); this.saveToLocalStorage(); updateGarageStatus(); } }
    removerAgendamento(idAgendamento) { const index = this.agendamentos.findIndex(ag => ag.id === idAgendamento); if (index > -1) { const removido = this.agendamentos.splice(index, 1)[0]; showNotification(`Agendamento para ${removido.nomeVeiculo} removido.`, 'info'); renderAppointmentsTable(); this.saveToLocalStorage(); updateGarageStatus(); } }
    saveToLocalStorage() { const serializableVeiculos = this.veiculos.map(v => ({ type: v.constructor.name, id: v.id, modelo: v.modelo, cor: v.cor, imagemURL: v.imagemURL, kmRodados: v.kmRodados, manutencao: v.manutencao, velocidade: v.velocidade, ligado: v.ligado, historicoManutencao: v.historicoManutencao, ...(v instanceof Caminhao && { capacidadeCarga: v.capacidadeCarga, cargaAtual: v.cargaAtual }), ...(v instanceof CarroEsportivo && { turboAtivado: v.turboAtivado }), })); localStorage.setItem('garagemVeiculos', JSON.stringify(serializableVeiculos)); localStorage.setItem('garagemAgendamentos', JSON.stringify(this.agendamentos)); localStorage.setItem('nextVehicleId', nextVehicleId.toString()); localStorage.setItem('nextAppointmentId', nextAppointmentId.toString()); localStorage.setItem('selectedVehicleId', this.veiculoSelecionado ? this.veiculoSelecionado.id.toString() : ""); }
    loadFromLocalStorage() { nextVehicleId = parseInt(localStorage.getItem('nextVehicleId'), 10) || 1; nextAppointmentId = parseInt(localStorage.getItem('nextAppointmentId'), 10) || 1; const storedVeiculos = JSON.parse(localStorage.getItem('garagemVeiculos') || '[]'); this.veiculos = storedVeiculos.map(data => { let veiculo; switch (data.type) { case 'CarroEsportivo': veiculo = new CarroEsportivo(data.modelo, data.cor, data.imagemURL); veiculo.turboAtivado = data.turboAtivado; break; case 'Caminhao': veiculo = new Caminhao(data.modelo, data.cor, data.capacidadeCarga, data.imagemURL); veiculo.cargaAtual = data.cargaAtual; break; default: veiculo = new Veiculo(data.modelo, data.cor, data.imagemURL); break; } Object.assign(veiculo, { id: data.id, kmRodados: data.kmRodados, manutencao: data.manutencao, velocidade: data.velocidade, ligado: data.ligado, historicoManutencao: data.historicoManutencao || [] }); veiculo.verificarManutencao(); return veiculo; }); const storedAgendamentos = JSON.parse(localStorage.getItem('garagemAgendamentos') || '[]'); this.agendamentos = storedAgendamentos.map(data => { const ag = new Agendamento(data.idVeiculo, data.nomeVeiculo, new Date(data.dataAgendamento).toISOString().split('T')[0], data.tipoServico, data.observacoes); Object.assign(ag, { id: data.id, status: data.status }); return ag; }).sort((a, b) => new Date(a.dataAgendamento) - new Date(b.dataAgendamento)); const selectedId = localStorage.getItem('selectedVehicleId'); if (selectedId) this.veiculoSelecionado = this.veiculos.find(v => v.id.toString() === selectedId) || null; }
}
const garagem = new Garagem();

// --- VIEW & UI MANAGEMENT ---
const viewTitleElement = document.getElementById('current-view-title');
const sidebarLinks = document.querySelectorAll('#sidebar a[data-view]');
const viewSections = document.querySelectorAll('.view-section');
const vehicleTabButtons = document.querySelectorAll('#selected-vehicle-panel .tab-button');
const vehicleTabContents = document.querySelectorAll('#selected-vehicle-panel .tab-content');

function switchView(viewId) {
    viewSections.forEach(s => s.classList.toggle('active', s.id === viewId));
    sidebarLinks.forEach(l => {
        l.classList.toggle('active-view', l.dataset.view === viewId);
        if (l.dataset.view === viewId) viewTitleElement.textContent = l.textContent.replace(/<i.*><\/i>\s*/, '');
    });
    if (viewId === 'scheduling-view') { updateAppointmentVehicleSelector(); renderAppointmentsTable(); }
    if (viewId === 'garage-view' && garagem.veiculoSelecionado) switchVehicleDetailTab('details');
    if (viewId === 'arsenal-view') { loadArsenalData(); }
}

function switchVehicleDetailTab(tabId) {
    vehicleTabContents.forEach(c => c.classList.toggle('active', c.id === `vehicle-${tabId}-tab`));
    vehicleTabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
}

// --- RENDERING FUNCTIONS ---
function renderMaintenanceHistory(veiculo) {
    const tableBody = document.getElementById('maintenance-history-table').querySelector('tbody');
    const noHistoryMsg = document.getElementById('no-maintenance-history');
    document.getElementById('history-vehicle-model').textContent = veiculo.modelo;
    tableBody.innerHTML = '';
    if (veiculo.historicoManutencao?.length) { noHistoryMsg.style.display = 'none'; veiculo.historicoManutencao.slice().reverse().forEach(item => { const r = tableBody.insertRow(); r.insertCell().textContent = new Date(item.data).toLocaleDateString('pt-BR'); r.insertCell().textContent = item.tipoServico; r.insertCell().textContent = item.kmNaManutencao; r.insertCell().textContent = item.observacoes || '-'; }); } else noHistoryMsg.style.display = 'block';
}

function updateAppointmentVehicleSelector() {
    const selector = document.getElementById('appointment-vehicle-selector');
    const currentVal = selector.value;
    selector.innerHTML = '<option value="">-- Selecione um Veículo --</option>';
    garagem.veiculos.forEach(v => { const opt = document.createElement('option'); opt.value = v.id; opt.textContent = `${v.modelo} (${v.cor})`; selector.appendChild(opt); });
    if (garagem.veiculos.find(v => v.id.toString() === currentVal)) selector.value = currentVal;
}

function renderAppointmentsTable() {
    const tableBody = document.getElementById('appointments-table').querySelector('tbody');
    const noAppointmentsMsg = document.getElementById('no-appointments');
    tableBody.innerHTML = '';
    if (garagem.agendamentos.length) {
        noAppointmentsMsg.style.display = 'none';
        garagem.agendamentos.forEach(ag => {
            const r = tableBody.insertRow();
            r.insertCell().textContent = ag.dataFormatada;
            r.insertCell().textContent = ag.nomeVeiculo;
            r.insertCell().textContent = ag.tipoServico;
            r.insertCell().innerHTML = `<span class="status-${ag.status.toLowerCase()}">${ag.status}</span>`;
            const actionsCell = r.insertCell();
            if (ag.status === "Agendado") { ['Concluir', 'Cancelar'].forEach(action => { const btn = document.createElement('button'); btn.textContent = action; btn.classList.add('action-button', action.toLowerCase()); btn.onclick = () => garagem.atualizarStatusAgendamento(ag.id, action === 'Concluir' ? 'Concluído' : 'Cancelado'); actionsCell.appendChild(btn); }); } else { const btn = document.createElement('button'); btn.textContent = "Remover"; btn.classList.add('action-button', 'remove'); btn.onclick = () => { if (confirm(`Remover agendamento ${ag.status.toLowerCase()}?`)) garagem.removerAgendamento(ag.id); }; actionsCell.appendChild(btn); }
        });
    } else noAppointmentsMsg.style.display = 'block';
}

// --- DOM EVENT LISTENERS & INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Initial setup calls ---
    getWeatherByGeolocation();
    updateGarageStatus();
    garagem.atualizarSeletorVeiculos();
    updateAppointmentVehicleSelector();
    renderAppointmentsTable();
    switchView('garage-view');
    if (garagem.veiculoSelecionado) {
        document.getElementById('vehicle-selector').value = garagem.veiculoSelecionado.id;
        garagem.selecionarVeiculo(garagem.veiculoSelecionado.id);
    } else {
        document.getElementById('selected-vehicle-panel').style.display = 'none';
    }

    // --- Sidebar navigation ---
    sidebarLinks.forEach(l => l.addEventListener('click', e => { e.preventDefault(); switchView(e.currentTarget.dataset.view); }));
    vehicleTabButtons.forEach(b => b.addEventListener('click', e => switchVehicleDetailTab(e.currentTarget.dataset.tab)));
    
    // --- Garage Management Listeners ---
    document.getElementById('vehicle-type-selector').addEventListener('change', e => document.getElementById('new-truck-capacity').style.display = (e.target.value === 'Caminhao') ? 'block' : 'none');
    document.getElementById('add-vehicle-button').addEventListener('click', () => {
        const type = document.getElementById('vehicle-type-selector').value;
        const modelo = document.getElementById('new-vehicle-model').value.trim();
        const cor = document.getElementById('new-vehicle-color').value.trim();
        const img = document.getElementById('new-vehicle-image').value.trim();
        if (!modelo || !cor) { showNotification("Modelo e Cor são obrigatórios!", 'error'); return; }
        try {
            let novoVeiculo;
            if (type === 'Caminhao') { const cap = parseInt(document.getElementById('new-truck-capacity').value, 10); if (isNaN(cap) || cap <= 0) { showNotification("Capacidade de carga inválida.", 'error'); return; } novoVeiculo = new Caminhao(modelo, cor, cap, img); } 
            else if (type === 'CarroEsportivo') novoVeiculo = new CarroEsportivo(modelo, cor, img);
            else novoVeiculo = new Veiculo(modelo, cor, img);
            garagem.adicionarVeiculo(novoVeiculo);
            ['new-vehicle-model', 'new-vehicle-color', 'new-vehicle-image', 'new-truck-capacity'].forEach(id => document.getElementById(id).value = '');
            document.getElementById('vehicle-type-selector').value = "Veiculo"; document.getElementById('new-truck-capacity').style.display = 'none';
        } catch (err) { showNotification(`Erro: ${err.message}`, 'error'); console.error(err); }
    });
    document.getElementById('vehicle-selector').addEventListener('change', e => garagem.selecionarVeiculo(e.target.value));
    document.getElementById('remove-vehicle-button').addEventListener('click', () => {
        if (garagem.veiculoSelecionado && confirm(`Remover ${garagem.veiculoSelecionado.modelo}?`)) { garagem.removerVeiculo(garagem.veiculoSelecionado.id); } 
        else if (!garagem.veiculoSelecionado) showNotification("Nenhum veículo selecionado.", 'warning');
    });

    // --- Vehicle Actions (Event Delegation) ---
    document.getElementById('selected-vehicle-panel').addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON' && e.target.dataset.action && garagem.veiculoSelecionado) {
            const acao = e.target.dataset.action;
            const v = garagem.veiculoSelecionado;
            try {
                if (typeof v[acao] === 'function') v[acao]();
                else if (acao === 'carregar' || acao === 'descarregar') { const peso = document.getElementById('truck-cargo-weight').value; v[acao](peso); document.getElementById('truck-cargo-weight').value = ''; }
                else if (acao.startsWith('service')) { const serviceMap = { serviceOil: 'realizarTrocaOleo', serviceTires: 'verificarPneus', serviceGeneral: 'realizarRevisaoGeral' }; if (serviceMap[acao]) v[serviceMap[acao]](); }
            } catch (err) { showNotification(`Erro: ${err.message}`, 'error'); console.error(err); }
        }
    });

    // --- Scheduling Listeners ---
    document.getElementById('add-appointment-button').addEventListener('click', () => {
        const vehId = parseInt(document.getElementById('appointment-vehicle-selector').value, 10);
        const date = document.getElementById('appointment-date').value;
        const type = document.getElementById('appointment-service-type').value.trim();
        const notes = document.getElementById('appointment-notes').value.trim();
        if (!vehId || !date || !type) { showNotification("Veículo, data e tipo de serviço são obrigatórios.", 'error'); return; }
        if (new Date(date + "T00:00:00") < new Date().setHours(0,0,0,0) && !confirm("A data é no passado. Continuar?")) { showNotification("Agendamento não criado.", 'warning'); return; }
        const veiculo = garagem.veiculos.find(v => v.id === vehId);
        if (!veiculo) { showNotification("Veículo do agendamento não encontrado.", 'error'); return; }
        try { garagem.adicionarAgendamento(new Agendamento(vehId, veiculo.modelo, date, type, notes)); ['appointment-vehicle-selector', 'appointment-date', 'appointment-service-type', 'appointment-notes'].forEach(id => document.getElementById(id).value = ''); } 
        catch (err) { showNotification(`Erro: ${err.message}`, 'error'); console.error(err); }
    });

    // --- Weather Listeners ---
    weatherWidget.addEventListener('click', () => weatherDetailsPanel.classList.toggle('hidden'));
    document.getElementById('update-weather-button').addEventListener('click', loadWeatherByCityName);
});