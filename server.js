// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// =========================================================================
// --- DADOS SIMULADOS (PARA DEMONSTRAÇÃO E TESTES) ---
// =========================================================================
// Em um sistema real, isso viria de um banco de dados.
let veiculosDB = []; 
let agendamentosDB = []; 
let nextVehicleId = 1;
let nextAppointmentId = 1;

const dicasManutencao = {
    Veiculo: ["Verifique o nível do óleo a cada 1.000 km.", "Mantenha os pneus calibrados conforme o manual.", "Troque o filtro de ar a cada 15.000 km."],
    CarroEsportivo: ["Use sempre gasolina de alta octanagem.", "Verifique o sistema de freios com mais frequência devido à alta performance.", "O aquecimento dos pneus é crucial para a aderência."],
    Caminhao: ["Verifique o sistema de freios a ar diariamente.", "Inspecione o estado dos pneus e do estepe antes de cada viagem longa.", "Respeite o limite de carga para evitar desgaste prematuro."]
};

const veiculosEstrela = [
    { id: 'estrela-01', modelo: 'Fusca "Herbie"', descricao: 'Um clássico atemporal que marcou gerações. Confiável e cheio de personalidade.', imagemURL: 'https://img.olx.com.br/images/94/945370631627993.jpg' },
    { id: 'estrela-02', modelo: 'Caminhão Scania "Rei da Estrada"', descricao: 'Potência e robustez para cruzar o país. O parceiro ideal para longas jornadas.', imagemURL: 'https://caminhoes-e-carretas.com/wp-content/uploads/2021/01/2-Scania-rei-da-estrada-2.jpg' },
    { id: 'estrela-03', modelo: 'DeLorean DMC-12', descricao: 'Mais que um carro, uma máquina do tempo. Requer plutônio (ou um raio) para funcionar.', imagemURL: 'https://quatrorodas.abril.com.br/wp-content/uploads/2020/10/delorean_dmc-12_hero.jpg?quality=70&strip=info' }
];

const agendamentosUrgentes = [
    { id: 'ag-01', veiculo: 'Ford Maverick V8', servico: 'Verificação do sistema de freios', urgencia: 'Alta' },
    { id: 'ag-02', veiculo: 'Honda Civic', servico: 'Troca de óleo e filtros', urgencia: 'Média' },
    { id: 'ag-03', veiculo: 'Volvo FH', servico: 'Inspeção do motor de partida', urgencia: 'Alta' }
];

const ferramentasProgramador = [
    { nome: 'VS Code', utilidade: 'Nosso ambiente de desenvolvimento, onde a mágica acontece.' },
    { nome: 'Node.js', utilidade: 'A fundação do nosso backend, permitindo JavaScript no servidor.' },
    { nome: 'Render.com', utilidade: 'A plataforma que hospeda nosso backend e o torna acessível a todos.' },
    { nome: 'Thunder Client / Postman', utilidade: 'Ferramenta essencial para testar nossos endpoints de API.' },
    { nome: 'Git & GitHub', utilidade: 'Para controle de versão e colaboração no código-fonte.' }
];

// =========================================================================
// --- ROTAS DA API ---
// =========================================================================

// --- Endpoint de Status da Garagem ---
app.get('/api/garagem/status', (req, res) => {
    // Simulando a contagem de dados que estariam no DB
    const totalVeiculos = veiculosDB.length;
    const totalAgendamentos = agendamentosDB.filter(a => a.status === 'Agendado').length;
    res.json({ totalVeiculos, totalAgendamentos });
});

// --- Endpoint para Dicas de Manutenção ---
app.get('/api/dicas/:vehicleType', (req, res) => {
    const { vehicleType } = req.params;
    const dicas = dicasManutencao[vehicleType];
    if (dicas) {
        res.json(dicas);
    } else {
        res.status(404).json({ message: 'Nenhuma dica específica encontrada para este tipo de veículo.' });
    }
});

// --- Endpoint do Clima (Proxy para OpenWeatherMap) ---
const OWM_API_KEY = process.env.OPENWEATHER_API_KEY;
if (!OWM_API_KEY) {
    console.error("ERRO CRÍTICO: A variável de ambiente OPENWEATHER_API_KEY não está definida!");
} else {
    app.get('/api/weather', async (req, res) => {
        try {
            const { lat, lon, city } = req.query;
            if ((!lat || !lon) && !city) {
                return res.status(400).json({ message: "Parâmetros 'lat' e 'lon', ou 'city' são obrigatórios." });
            }
            let coords = { lat, lon };
            let finalCityName = '';
            if (city) {
                const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OWM_API_KEY}`;
                const geoResponse = await axios.get(geoUrl);
                if (geoResponse.data.length === 0) return res.status(404).json({ message: `Cidade "${city}" não encontrada.` });
                coords = { lat: geoResponse.data[0].lat, lon: geoResponse.data[0].lon };
                finalCityName = geoResponse.data[0].name;
            }
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${OWM_API_KEY}&units=metric&lang=pt_br`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${OWM_API_KEY}&units=metric&lang=pt_br`;
            const [weatherResponse, forecastResponse] = await Promise.all([axios.get(weatherUrl), axios.get(forecastUrl)]);
            if (finalCityName) { weatherResponse.data.name = finalCityName; }
            res.json({ current: weatherResponse.data, forecast: forecastResponse.data });
        } catch (error) {
            console.error("Erro no proxy da API:", error.response ? error.response.data : error.message);
            res.status(error.response?.status || 500).json({ message: "Erro ao buscar dados do clima." });
        }
    });
}


// --- Endpoints do Arsenal de Dados ---
app.get('/api/arsenal/veiculos-estrela', (req, res) => {
    console.log('Requisição recebida: GET /api/arsenal/veiculos-estrela');
    res.status(200).json(veiculosEstrela);
});

app.get('/api/arsenal/agendamentos-urgentes', (req, res) => {
    console.log('Requisição recebida: GET /api/arsenal/agendamentos-urgentes');
    res.status(200).json(agendamentosUrgentes);
});

app.get('/api/arsenal/ferramentas-dev', (req, res) => {
    console.log('Requisição recebida: GET /api/arsenal/ferramentas-dev');
    res.status(200).json(ferramentasProgramador);
});

// --- Rota de Boas-Vindas ---
app.get('/', (req, res) => {
    res.send('<h1>Backend da Garagem Inteligente Pro está no ar!</h1><p>Acesse os endpoints da API para interagir com a aplicação.</p>');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    if (!OWM_API_KEY) {
        console.warn("AVISO: O endpoint de clima /api/weather não funcionará sem a chave da API.");
    }
});