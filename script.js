// script.js - Garagem Inteligente Pro

// --- Constants for Maintenance ---
const OIL_CHANGE_INTERVAL = 5000; // km
const TIRE_CHECK_INTERVAL = 10000; // km
const GENERAL_SERVICE_INTERVAL = 20000; // km

// --- INÍCIO: Bloco de Integração com OpenWeatherMap (Compatível com API Gratuita) ---

const weatherWidget = document.getElementById('weather-widget');
const weatherDetailsPanel = document.getElementById('weather-details-panel');
const userApiKey = 'e639aa9c6083d5cf4fa075d30beb4b54'; // Chave de API gratuita

/**
 * Busca as coordenadas (lat, lon) para um nome de cidade.
 */
async function getCoordsForCity(city, apiKey) {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`;
    const response = await fetch(geoUrl);
    if (!response.ok) throw new Error(`Não foi possível buscar as coordenadas. Status: ${response.status}`);
    const data = await response.json();
    if (data.length === 0) throw new Error(`Cidade "${city}" não encontrada.`);
    return { lat: data[0].lat, lon: data[0].lon, name: data[0].name };
}

/**
 * Busca os dados do CLIMA ATUAL usando as coordenadas (Endpoint Gratuito).
 */
async function fetchCurrentWeather(lat, lon, apiKey) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;
    const response = await fetch(weatherUrl);
    if (!response.ok) throw new Error("Falha ao buscar o clima atual.");
    return await response.json();
}

/**
 * Busca os dados da PREVISÃO DE 5 DIAS usando as coordenadas (Endpoint Gratuito).
 */
async function fetchForecastData(lat, lon, apiKey) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;
    const response = await fetch(forecastUrl);
    if (!response.ok) throw new Error("Falha ao buscar a previsão do tempo.");
    return await response.json();
}

/**
 * Atualiza o widget principal do clima.
 */
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

/**
 * Processa a lista de previsão de 3h e a transforma em uma previsão diária.
 */
function updateDetailedForecastUI(forecastData) {
    const dailyForecasts = {};

    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = {
                temps: [],
                weathers: [],
            };
        }
        dailyForecasts[date].temps.push(item.main.temp);
        dailyForecasts[date].weathers.push(item.weather[0]);
    });

    let forecastHtml = '<h4>Previsão para os Próximos Dias</h4>';
    Object.keys(dailyForecasts).slice(0, 5).forEach(dateStr => { // Mostra os próximos 5 dias disponíveis
        const dayData = dailyForecasts[dateStr];
        // Pula se for hoje e tiver poucos dados
        if(new Date(dateStr).getDate() === new Date().getDate() && dayData.weathers.length < 4) return;

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
                    <span class="temp-max">${temp_max}°</span> / 
                    <span class="temp-min">${temp_min}°</span>
                </span>
            </div>`;
    });
    
    weatherDetailsPanel.innerHTML = forecastHtml;
}

/**
 * Orquestrador principal: busca os dados e atualiza a UI.
 */
async function fetchAndDisplayWeather(lat, lon, apiKey) {
    weatherWidget.classList.add('loading');
    document.getElementById('weather-city').textContent = 'Atualizando...';
    try {
        const [currentData, forecastData] = await Promise.all([
            fetchCurrentWeather(lat, lon, apiKey),
            fetchForecastData(lat, lon, apiKey)
        ]);

        updateWeatherWidgetUI(currentData);
        updateDetailedForecastUI(forecastData);

        // ATUALIZA O CACHE com a cidade buscada com sucesso.
        localStorage.setItem('weatherCache', JSON.stringify({ lat, lon, city: currentData.name }));
        document.getElementById('owm-city').value = currentData.name;

    } catch (error) {
        showNotification(error.message, 'error');
        document.getElementById('weather-city').textContent = 'Falha ao carregar';
        console.error("Erro no clima:", error);
    } finally {
        weatherWidget.classList.remove('loading');
    }
}

/**
 * Inicia a busca pelo clima a partir de um nome de cidade do campo de input.
 */
async function loadWeatherByCityName() {
    const city = document.getElementById('owm-city').value.trim();
    if (!city) {
        showNotification("Por favor, digite o nome de uma cidade.", 'warning');
        return;
    }
    weatherWidget.classList.add('loading');
    document.getElementById('weather-city').textContent = `Buscando ${city}...`;
    try {
        const coords = await getCoordsForCity(city, userApiKey);
        await fetchAndDisplayWeather(coords.lat, coords.lon, userApiKey);
    } catch (error) {
        showNotification(error.message, 'error');
        weatherWidget.classList.remove('loading');
        document.getElementById('weather-city').textContent = 'Falha ao carregar';
        console.error(`Erro ao buscar por "${city}":`, error);
    }
}

/**
 * Tenta obter o clima usando a geolocalização do navegador.
 */
function getWeatherByGeolocation() {
    if (!navigator.geolocation) {
        showNotification("Geolocalização não é suportada. Buscando clima para São Paulo.", 'warning');
        loadWeatherByCityNameFromText("São Paulo"); // Função auxiliar para evitar conflito com input
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            fetchAndDisplayWeather(position.coords.latitude, position.coords.longitude, userApiKey);
        },
        (error) => {
            console.warn("Erro de Geolocalização:", error.message);
            showNotification("Acesso à localização negado. Buscando clima de São Paulo.", 'info');
            loadWeatherByCityNameFromText("São Paulo"); // Função auxiliar para evitar conflito com input
        }
    );
}

// Função auxiliar para fallbacks, não lê o input
async function loadWeatherByCityNameFromText(city) {
    try {
        const coords = await getCoordsForCity(city, userApiKey);
        await fetchAndDisplayWeather(coords.lat, coords.lon, userApiKey);
    } catch (error) {
        console.error(`Falha no fallback para "${city}":`, error);
        document.getElementById('weather-city').textContent = 'Erro de fallback';
    }
}


// Event Listeners para o clima
weatherWidget.addEventListener('click', () => weatherDetailsPanel.classList.toggle('hidden'));
document.getElementById('update-weather-button').addEventListener('click', loadWeatherByCityName);

// --- FIM: Bloco de Integração com OpenWeatherMap ---


// --- Utility for unique IDs ---
let nextVehicleId = 1;
let nextAppointmentId = 1;
function generateVehicleId() { return nextVehicleId++; }
function generateAppointmentId() { return nextAppointmentId++; }

// --- Notification System ---
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

// --- Classe Agendamento ---
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

// --- Base Veiculo Class ---
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
        this.sounds = {};
        const soundFiles = {
            ligar: 'sounds/engine_start.mp3', desligar: 'sounds/engine_stop.mp3',
            acelerar: 'sounds/engine_running.mp3', frear: 'sounds/brake_sound.mp3',
            buzinar: 'sounds/horn.mp3'
        };
        for (const key in soundFiles) {
            try {
                this.sounds[key] = new Audio(soundFiles[key]);
                if (key === 'acelerar') this.sounds[key].loop = true;
            } catch (e) {
                console.warn(`Falha ao carregar som '${key}':`, e);
                this.sounds[key] = { play: () => Promise.resolve(), pause: () => {}, currentTime: 0, loop: false };
            }
        }
    }

    pararTodosOsSons() { Object.values(this.sounds).forEach(s => { s.pause(); s.currentTime = 0; }); }

    ligar() {
        if (!this.ligado) {
            this.ligado = true; this.pararTodosOsSons(); this.sounds.ligar?.play();
            showNotification(`${this.modelo} ligado.`, 'info');
        } else showNotification(`${this.modelo} já está ligado.`, 'warning');
        this.atualizarDisplayCompleto();
    }

    desligar() {
        if (this.ligado) {
            if (this.velocidade > 0) { showNotification(`Pare o ${this.modelo} antes de desligar.`, 'error'); return; }
            this.ligado = false; this.pararTodosOsSons(); this.sounds.desligar?.play();
            showNotification(`${this.modelo} desligado.`, 'info');
        } else showNotification(`${this.modelo} já está desligado.`, 'warning');
        this.atualizarDisplayCompleto();
    }

    acelerar(incremento = 10) {
        if (!this.ligado) { showNotification(`${this.modelo} precisa estar ligado.`, 'error'); return; }
        this.velocidade += incremento; this.kmRodados += Math.max(1, incremento / 2);
        if (this.sounds.acelerar?.paused) { this.pararTodosOsSons(); this.sounds.acelerar?.play(); }
        this.verificarManutencao(); this.atualizarDisplayCompleto();
    }

    frear(decremento = 10) {
        if (!this.ligado) { showNotification(`${this.modelo} está desligado.`, 'error'); return; }
        if (this.velocidade <= 0) { showNotification(`${this.modelo} já está parado.`, 'info'); return; }
        this.velocidade = Math.max(0, this.velocidade - decremento);
        this.pararTodosOsSons(); this.sounds.frear?.play();
        if (this.velocidade === 0 && this.ligado && this.sounds.acelerar?.paused) {
            setTimeout(() => { if (this.ligado && this.velocidade === 0) this.sounds.acelerar?.play(); }, this.sounds.frear?.duration ? this.sounds.frear.duration * 1000 : 500);
        }
        this.atualizarDisplayCompleto();
    }

    buzinar() { this.sounds.buzinar?.play(); showNotification(`${this.modelo}: Beep beep!`, 'info'); }

    adicionarRegistroHistorico(tipoServico, observacoes = "") {
        this.historicoManutencao.push({
            data: new Date().toISOString(),
            tipoServico: tipoServico,
            kmNaManutencao: this.kmRodados.toFixed(0),
            observacoes: observacoes
        });
    }

    verificarManutencao() {
        const check = (item, interval) => {
            if (this.kmRodados >= item.proximaKm) item.status = "VENCIDO";
            else if (this.kmRodados >= item.proximaKm - (interval / 5)) item.status = "PRÓXIMO";
            else item.status = "OK";
        };
        check(this.manutencao.oleo, OIL_CHANGE_INTERVAL);
        check(this.manutencao.pneus, TIRE_CHECK_INTERVAL);
        check(this.manutencao.revisaoGeral, GENERAL_SERVICE_INTERVAL);
    }

    realizarManutencaoItem(itemKey, interval, itemName, serviceDesc = itemName) {
        const item = this.manutencao[itemKey];
        item.ultimaKm = this.kmRodados; item.proximaKm = this.kmRodados + interval; item.status = "OK";
        showNotification(`${itemName} para ${this.modelo} realizada.`, 'success');
        this.adicionarRegistroHistorico(serviceDesc, `Realizado em ${this.kmRodados.toFixed(0)} km`);
        this.verificarManutencao(); this.atualizarDisplayCompleto();
    }

    realizarTrocaOleo() { this.realizarManutencaoItem('oleo', OIL_CHANGE_INTERVAL, 'Troca de óleo'); }
    verificarPneus() { this.realizarManutencaoItem('pneus', TIRE_CHECK_INTERVAL, 'Verificação de pneus', 'Verificação/Rodízio de Pneus'); }
    realizarRevisaoGeral() {
        this.realizarManutencaoItem('revisaoGeral', GENERAL_SERVICE_INTERVAL, 'Revisão geral');
        ['oleo', 'pneus'].forEach(key => {
            this.manutencao[key].ultimaKm = this.kmRodados;
            this.manutencao[key].proximaKm = this.kmRodados + (key === 'oleo' ? OIL_CHANGE_INTERVAL : TIRE_CHECK_INTERVAL);
        });
        this.adicionarRegistroHistorico('Revisão Geral Completa', `Serviços de óleo e pneus incluídos/verificados.`);
        this.verificarManutencao(); this.atualizarDisplayCompleto();
    }

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
        }
        garagem.saveToLocalStorage();
    }
}

class CarroEsportivo extends Veiculo {
    constructor(modelo, cor, imagemURL) {
        super(modelo, cor, imagemURL);
        this.turboAtivado = false;
        try { this.sounds.turbo = new Audio('sounds/turbo_whine.mp3'); } 
        catch (e) { console.warn("Falha ao carregar som turbo:", e); this.sounds.turbo = { play: () => {}, pause: () => {} }; }
    }
    pararTodosOsSons() { super.pararTodosOsSons(); this.sounds.turbo?.pause(); }
    ativarTurbo() {
        if (!this.ligado) { showNotification(`${this.modelo} precisa estar ligado.`, 'error'); return; }
        if (this.turboAtivado) { showNotification(`Turbo já está ativado.`, 'warning'); return; }
        this.turboAtivado = true; this.sounds.turbo?.play();
        showNotification(`Turbo ativado para ${this.modelo}!`, 'success');
        this.acelerar(20);
        this.atualizarDisplayCompleto();
    }
    desativarTurbo() {
        if (!this.turboAtivado) { showNotification(`Turbo já está desativado.`, 'warning'); return; }
        this.turboAtivado = false; this.sounds.turbo?.pause();
        showNotification(`Turbo desativado para ${this.modelo}.`, 'info');
        this.atualizarDisplayCompleto();
    }
    acelerar(incremento = 15) { super.acelerar(this.turboAtivado ? Math.round(incremento * 1.7) : incremento); }
    getInformacoesEspecificas() {
        const turboStatus = this.turboAtivado ? "<span class='status-value status-ok'>ATIVADO</span>" : "<span class='status-value status-vencido'>Desativado</span>";
        return `${super.getInformacoesEspecificas()}<br><strong>Turbo:</strong> ${turboStatus}`;
    }
}

class Caminhao extends Veiculo {
    constructor(modelo, cor, capacidadeCarga = 1000, imagemURL) {
        super(modelo, cor, imagemURL);
        this.capacidadeCarga = parseInt(capacidadeCarga, 10) || 1000;
        this.cargaAtual = 0;
    }
    carregar(peso) {
        peso = parseInt(peso, 10);
        if (isNaN(peso) || peso <= 0) { showNotification("Peso de carga inválido.", 'error'); return; }
        if (this.cargaAtual + peso <= this.capacidadeCarga) {
            this.cargaAtual += peso;
            showNotification(`${this.modelo} carregado com ${peso}kg. Atual: ${this.cargaAtual}kg.`, 'success');
        } else showNotification(`Capacidade excedida (${this.capacidadeCarga}kg).`, 'error');
        this.atualizarDisplayCompleto();
    }
    descarregar(peso) {
        peso = parseInt(peso, 10);
        if (isNaN(peso) || peso <= 0) { showNotification("Peso de descarga inválido.", 'error'); return; }
        if (this.cargaAtual - peso >= 0) {
            this.cargaAtual -= peso;
            showNotification(`${this.modelo} descarregado em ${peso}kg. Atual: ${this.cargaAtual}kg.`, 'success');
        } else showNotification(`Carga insuficiente para descarregar ${peso}kg.`, 'error');
        this.atualizarDisplayCompleto();
    }
    acelerar(incremento = 7) {
        const fatorCarga = Math.max(0.3, 1 - (this.cargaAtual / (this.capacidadeCarga * 1.5)));
        super.acelerar(Math.round(incremento * fatorCarga));
    }
    getInformacoesEspecificas() { return `${super.getInformacoesEspecificas()}<br><strong>Carga:</strong> ${this.cargaAtual} / ${this.capacidadeCarga} kg`; }
}

class Garagem {
    constructor() {
        this.veiculos = [];
        this.agendamentos = [];
        this.veiculoSelecionado = null;
        this.loadFromLocalStorage();
    }
    adicionarVeiculo(veiculo) {
        this.veiculos.push(veiculo);
        showNotification(`${veiculo.constructor.name.replace(/([A-Z])/g, ' $1').trim()} ${veiculo.modelo} adicionado.`, 'success');
        this.atualizarSeletorVeiculos();
        updateAppointmentVehicleSelector();
        document.getElementById('vehicle-selector').value = veiculo.id;
        this.selecionarVeiculo(veiculo.id);
    }
    removerVeiculo(idVeiculo) {
        const idNum = parseInt(idVeiculo, 10);
        const index = this.veiculos.findIndex(v => v.id === idNum);
        if (index > -1) {
            const removido = this.veiculos.splice(index, 1)[0];
            removido?.pararTodosOsSons();
            showNotification(`${removido.constructor.name.replace(/([A-Z])/g, ' $1').trim()} ${removido.modelo} removido.`, 'success');
            if (this.veiculoSelecionado?.id === idNum) {
                this.veiculoSelecionado = null;
                document.getElementById('selected-vehicle-panel').style.display = 'none';
                document.getElementById('vehicle-selector').value = "";
            }
            this.agendamentos = this.agendamentos.filter(ag => ag.idVeiculo !== idNum);
            this.atualizarSeletorVeiculos();
            updateAppointmentVehicleSelector();
            renderAppointmentsTable();
            this.saveToLocalStorage();
        } else showNotification("Veículo não encontrado para remoção.", 'error');
    }
    selecionarVeiculo(idVeiculo) {
        const idNum = parseInt(idVeiculo, 10);
        this.veiculoSelecionado?.id !== idNum && this.veiculoSelecionado?.pararTodosOsSons();
        if (!idNum) {
            this.veiculoSelecionado = null;
            document.getElementById('selected-vehicle-panel').style.display = 'none';
            document.getElementById('remove-vehicle-button').disabled = true;
        } else {
            this.veiculoSelecionado = this.veiculos.find(v => v.id === idNum) || null;
            if (this.veiculoSelecionado) {
                document.getElementById('selected-vehicle-panel').style.display = 'block';
                document.getElementById('remove-vehicle-button').disabled = false;
                this.veiculoSelecionado.atualizarDisplayCompleto();
                switchVehicleDetailTab('details');
            } else {
                document.getElementById('selected-vehicle-panel').style.display = 'none';
                document.getElementById('remove-vehicle-button').disabled = true;
            }
        }
        this.saveToLocalStorage();
    }
    atualizarSeletorVeiculos() {
        const selector = document.getElementById('vehicle-selector');
        const currentVal = selector.value;
        selector.innerHTML = '<option value="">-- Nenhum Veículo --</option>';
        this.veiculos.forEach(v => {
            const option = document.createElement('option');
            option.value = v.id;
            option.textContent = `${v.constructor.name.replace(/([A-Z])/g, ' $1').trim()} - ${v.modelo} (${v.cor})`;
            selector.appendChild(option);
        });
        selector.value = this.veiculos.find(v => v.id.toString() === currentVal) ? currentVal : "";
        document.getElementById('remove-vehicle-button').disabled = !selector.value;
    }
    adicionarAgendamento(agendamento) {
        this.agendamentos.push(agendamento);
        this.agendamentos.sort((a, b) => new Date(a.dataAgendamento) - new Date(b.dataAgendamento));
        showNotification(`Agendamento para ${agendamento.nomeVeiculo} em ${agendamento.dataFormatada} criado.`, 'success');
        renderAppointmentsTable();
        this.saveToLocalStorage();
    }
    atualizarStatusAgendamento(idAgendamento, novoStatus) {
        const ag = this.agendamentos.find(a => a.id === idAgendamento);
        if (ag) {
            ag.status = novoStatus;
            showNotification(`Agendamento para ${ag.nomeVeiculo} ${novoStatus.toLowerCase()}.`, 'info');
            if (novoStatus === "Concluído") {
                const veiculo = this.veiculos.find(v => v.id === ag.idVeiculo);
                veiculo?.adicionarRegistroHistorico(`Serviço Agendado: ${ag.tipoServico}`, `Realizado conforme agendamento. Observações: ${ag.observacoes || 'Nenhuma'}`);
                veiculo?.atualizarDisplayCompleto();
            }
            renderAppointmentsTable();
            this.saveToLocalStorage();
        }
    }
    removerAgendamento(idAgendamento) {
        const index = this.agendamentos.findIndex(ag => ag.id === idAgendamento);
        if (index > -1) {
            const removido = this.agendamentos.splice(index, 1)[0];
            showNotification(`Agendamento para ${removido.nomeVeiculo} removido.`, 'info');
            renderAppointmentsTable();
            this.saveToLocalStorage();
        }
    }
    registrarServicoConcluido(veiculo, tipoServico) {
        if (!veiculo || !tipoServico) return;
        const dataHoje = new Date().toISOString().split('T')[0];
        try {
            const novoAgendamento = new Agendamento(veiculo.id, veiculo.modelo, dataHoje, tipoServico, "Serviço realizado imediatamente via painel da garagem.");
            novoAgendamento.status = "Concluído";
            this.agendamentos.push(novoAgendamento);
            this.agendamentos.sort((a, b) => new Date(a.dataAgendamento) - new Date(b.dataAgendamento));
            showNotification(`Registro de '${tipoServico}' adicionado ao histórico de agendamentos.`, 'info');
            renderAppointmentsTable();
            this.saveToLocalStorage();
        } catch (err) {
            console.error("Erro ao registrar serviço concluído:", err);
            showNotification("Não foi possível registrar o serviço no histórico.", 'error');
        }
    }
    saveToLocalStorage() {
        const serializableVeiculos = this.veiculos.map(v => ({
            type: v.constructor.name, id: v.id, modelo: v.modelo, cor: v.cor, imagemURL: v.imagemURL,
            kmRodados: v.kmRodados, manutencao: v.manutencao, velocidade: v.velocidade, ligado: v.ligado,
            historicoManutencao: v.historicoManutencao,
            ...(v instanceof Caminhao && { capacidadeCarga: v.capacidadeCarga, cargaAtual: v.cargaAtual }),
            ...(v instanceof CarroEsportivo && { turboAtivado: v.turboAtivado }),
        }));
        localStorage.setItem('garagemVeiculos', JSON.stringify(serializableVeiculos));
        localStorage.setItem('garagemAgendamentos', JSON.stringify(this.agendamentos));
        localStorage.setItem('nextVehicleId', nextVehicleId.toString());
        localStorage.setItem('nextAppointmentId', nextAppointmentId.toString());
        localStorage.setItem('selectedVehicleId', this.veiculoSelecionado ? this.veiculoSelecionado.id.toString() : "");
    }
    loadFromLocalStorage() {
        nextVehicleId = parseInt(localStorage.getItem('nextVehicleId'), 10) || 1;
        nextAppointmentId = parseInt(localStorage.getItem('nextAppointmentId'), 10) || 1;
        const storedVeiculos = JSON.parse(localStorage.getItem('garagemVeiculos') || '[]');
        this.veiculos = storedVeiculos.map(data => {
            let veiculo;
            switch (data.type) {
                case 'CarroEsportivo': veiculo = new CarroEsportivo(data.modelo, data.cor, data.imagemURL); veiculo.turboAtivado = data.turboAtivado; break;
                case 'Caminhao': veiculo = new Caminhao(data.modelo, data.cor, data.capacidadeCarga, data.imagemURL); veiculo.cargaAtual = data.cargaAtual; break;
                default: veiculo = new Veiculo(data.modelo, data.cor, data.imagemURL); break;
            }
            Object.assign(veiculo, { id: data.id, kmRodados: data.kmRodados, manutencao: data.manutencao, velocidade: data.velocidade, ligado: data.ligado, historicoManutencao: data.historicoManutencao || [] });
            veiculo.verificarManutencao();
            return veiculo;
        });
        const storedAgendamentos = JSON.parse(localStorage.getItem('garagemAgendamentos') || '[]');
        this.agendamentos = storedAgendamentos.map(data => {
            const ag = new Agendamento(data.idVeiculo, data.nomeVeiculo, new Date(data.dataAgendamento).toISOString().split('T')[0], data.tipoServico, data.observacoes);
            Object.assign(ag, { id: data.id, status: data.status });
            return ag;
        }).sort((a, b) => new Date(a.dataAgendamento) - new Date(b.dataAgendamento));
        const selectedId = localStorage.getItem('selectedVehicleId');
        if (selectedId) this.veiculoSelecionado = this.veiculos.find(v => v.id.toString() === selectedId) || null;
    }
}
const garagem = new Garagem();

// --- Gerenciamento de Views e Abas ---
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
}
sidebarLinks.forEach(l => l.addEventListener('click', e => { e.preventDefault(); switchView(e.currentTarget.dataset.view); }));

function switchVehicleDetailTab(tabId) {
    vehicleTabContents.forEach(c => c.classList.toggle('active', c.id === `vehicle-${tabId}-tab`));
    vehicleTabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
}
vehicleTabButtons.forEach(b => b.addEventListener('click', e => switchVehicleDetailTab(e.currentTarget.dataset.tab)));

// --- Funções de Renderização para Histórico e Agendamentos ---
function renderMaintenanceHistory(veiculo) {
    const tableBody = document.getElementById('maintenance-history-table').querySelector('tbody');
    const noHistoryMsg = document.getElementById('no-maintenance-history');
    document.getElementById('history-vehicle-model').textContent = veiculo.modelo;
    tableBody.innerHTML = '';
    if (veiculo.historicoManutencao?.length) {
        noHistoryMsg.style.display = 'none';
        veiculo.historicoManutencao.slice().reverse().forEach(item => {
            const r = tableBody.insertRow();
            r.insertCell().textContent = new Date(item.data).toLocaleDateString('pt-BR');
            r.insertCell().textContent = item.tipoServico;
            r.insertCell().textContent = item.kmNaManutencao;
            r.insertCell().textContent = item.observacoes || '-';
        });
    } else noHistoryMsg.style.display = 'block';
}

function updateAppointmentVehicleSelector() {
    const selector = document.getElementById('appointment-vehicle-selector');
    const currentVal = selector.value;
    selector.innerHTML = '<option value="">-- Selecione um Veículo --</option>';
    garagem.veiculos.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id; opt.textContent = `${v.modelo} (${v.cor})`;
        selector.appendChild(opt);
    });
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
            if (ag.status === "Agendado") {
                ['Concluir', 'Cancelar'].forEach(action => {
                    const btn = document.createElement('button');
                    btn.textContent = action;
                    btn.classList.add('action-button', action.toLowerCase());
                    btn.onclick = () => garagem.atualizarStatusAgendamento(ag.id, action === 'Concluir' ? 'Concluído' : 'Cancelado');
                    actionsCell.appendChild(btn);
                });
            } else {
                const btn = document.createElement('button');
                btn.textContent = "Remover"; btn.classList.add('action-button', 'remove');
                btn.onclick = () => { if (confirm(`Remover agendamento ${ag.status.toLowerCase()}?`)) garagem.removerAgendamento(ag.id); };
                actionsCell.appendChild(btn);
            }
        });
    } else noAppointmentsMsg.style.display = 'block';
}

// --- DOM Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica de Inicialização do Clima ---
    const weatherCache = JSON.parse(localStorage.getItem('weatherCache') || 'null');
    if (weatherCache && weatherCache.lat && weatherCache.lon) {
        fetchAndDisplayWeather(weatherCache.lat, weatherCache.lon, userApiKey);
    } else {
        getWeatherByGeolocation();
    }

    // --- Restante da inicialização da página ---
    const vehicleTypeSelector = document.getElementById('vehicle-type-selector');
    const newTruckCapacityInput = document.getElementById('new-truck-capacity');
    const addVehicleButton = document.getElementById('add-vehicle-button');
    const vehicleSelectorDropdown = document.getElementById('vehicle-selector');
    const removeVehicleBtn = document.getElementById('remove-vehicle-button');
    const selectedVehiclePanel = document.getElementById('selected-vehicle-panel');
    const addAppointmentButton = document.getElementById('add-appointment-button');

    garagem.atualizarSeletorVeiculos();
    updateAppointmentVehicleSelector();
    renderAppointmentsTable();
    switchView('garage-view');
    if (garagem.veiculoSelecionado) {
        vehicleSelectorDropdown.value = garagem.veiculoSelecionado.id;
        garagem.selecionarVeiculo(garagem.veiculoSelecionado.id);
    } else {
        document.getElementById('selected-vehicle-panel').style.display = 'none';
    }

    vehicleTypeSelector.addEventListener('change', e => newTruckCapacityInput.style.display = (e.target.value === 'Caminhao') ? 'block' : 'none');

    addVehicleButton.addEventListener('click', () => {
        const type = vehicleTypeSelector.value;
        const modelo = document.getElementById('new-vehicle-model').value.trim();
        const cor = document.getElementById('new-vehicle-color').value.trim();
        const img = document.getElementById('new-vehicle-image').value.trim();
        if (!modelo || !cor) { showNotification("Modelo e Cor são obrigatórios!", 'error'); return; }
        try {
            let novoVeiculo;
            if (type === 'Caminhao') {
                const cap = parseInt(newTruckCapacityInput.value, 10);
                if (isNaN(cap) || cap <= 0) { showNotification("Capacidade de carga inválida.", 'error'); return; }
                novoVeiculo = new Caminhao(modelo, cor, cap, img);
            } else if (type === 'CarroEsportivo') novoVeiculo = new CarroEsportivo(modelo, cor, img);
            else novoVeiculo = new Veiculo(modelo, cor, img);
            garagem.adicionarVeiculo(novoVeiculo);
            ['new-vehicle-model', 'new-vehicle-color', 'new-vehicle-image', 'new-truck-capacity'].forEach(id => document.getElementById(id).value = '');
            vehicleTypeSelector.value = "Veiculo"; newTruckCapacityInput.style.display = 'none';
        } catch (err) { showNotification(`Erro: ${err.message}`, 'error'); console.error(err); }
    });

    vehicleSelectorDropdown.addEventListener('change', e => garagem.selecionarVeiculo(e.target.value));
    removeVehicleBtn.addEventListener('click', () => {
        if (garagem.veiculoSelecionado && confirm(`Remover ${garagem.veiculoSelecionado.modelo}?`)) {
            garagem.removerVeiculo(garagem.veiculoSelecionado.id);
        } else if (!garagem.veiculoSelecionado) showNotification("Nenhum veículo selecionado.", 'warning');
    });

    selectedVehiclePanel.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON' && e.target.dataset.action && garagem.veiculoSelecionado) {
            const acao = e.target.dataset.action;
            const v = garagem.veiculoSelecionado;
            try {
                if (typeof v[acao] === 'function') {
                    v[acao]();
                } else if (acao === 'carregar' || acao === 'descarregar') {
                    const peso = document.getElementById('truck-cargo-weight').value;
                    v[acao](peso); document.getElementById('truck-cargo-weight').value = '';
                } else if (acao.startsWith('service')) {
                    const serviceMap = {
                        serviceOil: { method: 'realizarTrocaOleo', name: 'Troca de Óleo' },
                        serviceTires: { method: 'verificarPneus', name: 'Verificação/Rodízio de Pneus' },
                        serviceGeneral: { method: 'realizarRevisaoGeral', name: 'Revisão Geral Completa' }
                    };
                    const serviceInfo = serviceMap[acao];
                    if (serviceInfo && typeof v[serviceInfo.method] === 'function') {
                        v[serviceInfo.method]();
                        garagem.registrarServicoConcluido(v, serviceInfo.name);
                    }
                }
            } catch (err) { showNotification(`Erro: ${err.message}`, 'error'); console.error(err); }
        }
    });

    addAppointmentButton.addEventListener('click', () => {
        const vehId = parseInt(document.getElementById('appointment-vehicle-selector').value, 10);
        const date = document.getElementById('appointment-date').value;
        const type = document.getElementById('appointment-service-type').value.trim();
        const notes = document.getElementById('appointment-notes').value.trim();
        if (!vehId || !date || !type) { showNotification("Veículo, data e tipo de serviço são obrigatórios.", 'error'); return; }
        if (new Date(date + "T00:00:00") < new Date().setHours(0,0,0,0) && !confirm("A data é no passado. Continuar?")) { showNotification("Agendamento não criado.", 'warning'); return; }
        const veiculo = garagem.veiculos.find(v => v.id === vehId);
        if (!veiculo) { showNotification("Veículo do agendamento não encontrado.", 'error'); return; }
        try {
            garagem.adicionarAgendamento(new Agendamento(vehId, veiculo.modelo, date, type, notes));
            ['appointment-vehicle-selector', 'appointment-date', 'appointment-service-type', 'appointment-notes'].forEach(id => document.getElementById(id).value = '');
        } catch (err) { showNotification(`Erro: ${err.message}`, 'error'); console.error(err); }
    });
});