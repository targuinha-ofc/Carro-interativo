// --- INÍCIO: NOVO Bloco de Integração com o Backend ---

const BACKEND_URL = 'https://render.com/docs/node-version'; // <<< CONFIRME QUE ESTA É A SUA URL DO RENDER
const weatherWidget = document.getElementById('weather-widget');
const weatherDetailsPanel = document.getElementById('weather-details-panel');

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
 * Processa a lista de previsão e a transforma em uma previsão diária.
 */
function updateDetailedForecastUI(forecastData) {
    const dailyForecasts = {};
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = { temps: [], weathers: [] };
        }
        dailyForecasts[date].temps.push(item.main.temp);
        dailyForecasts[date].weathers.push(item.weather[0]);
    });
    let forecastHtml = '<h4>Previsão para os Próximos Dias</h4>';
    Object.keys(dailyForecasts).slice(0, 5).forEach(dateStr => {
        const dayData = dailyForecasts[dateStr];
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
                    <span class="temp-max">${temp_max}°</span> / <span class="temp-min">${temp_min}°</span>
                </span>
            </div>`;
    });
    weatherDetailsPanel.innerHTML = forecastHtml;
}

/**
 * Orquestrador principal: busca os dados do NOSSO BACKEND e atualiza a UI.
 * @param {object} params - Objeto com 'lat' e 'lon' OU 'city'.
 */
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

// --- Funções de gatilho que chamam o orquestrador ---

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
    if (!city) {
        showNotification("Por favor, digite o nome de uma cidade.", 'warning');
        return;
    }
    document.getElementById('weather-city').textContent = `Buscando ${city}...`;
    fetchWeatherFromBackend({ city });
}

// Event Listeners para o clima
weatherWidget.addEventListener('click', () => weatherDetailsPanel.classList.toggle('hidden'));
document.getElementById('update-weather-button').addEventListener('click', loadWeatherByCityName);

// --- FIM: NOVO Bloco de Integração com o Backend ---