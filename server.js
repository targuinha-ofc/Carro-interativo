// server.js - Versão Final à Prova de Falhas
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Dados Simulados (Banco de Dados em Memória) ---
const dicasManutencao = {
    Veiculo: ["Verifique o nível do óleo a cada 1.000 km.", "Mantenha os pneus calibrados conforme o manual.", "Troque o filtro de ar a cada 15.000 km."],
    CarroEsportivo: ["Use sempre gasolina de alta octanagem.", "Verifique o sistema de freios com mais frequência.", "O aquecimento dos pneus é crucial para a aderência."],
    Caminhao: ["Verifique o sistema de freios a ar diariamente.", "Inspecione o estado dos pneus e do estepe antes de cada viagem.", "Respeite o limite de carga."]
};
const veiculosEstrela = [
    { id: 'estrela-01', modelo: 'Fusca "Herbie"', descricao: 'Um clássico atemporal que marcou gerações.', imagemURL: 'https://img.olx.com.br/images/94/945370631627993.jpg' },
    { id: 'estrela-02', modelo: 'Caminhão Scania "Rei da Estrada"', descricao: 'Potência e robustez para cruzar o país.', imagemURL: 'https://caminhoes-e-carretas.com/wp-content/uploads/2021/01/2-Scania-rei-da-estrada-2.jpg' },
    { id: 'estrela-03', modelo: 'DeLorean DMC-12', descricao: 'Mais que um carro, uma máquina do tempo.', imagemURL: 'https://quatrorodas.abril.com.br/wp-content/uploads/2020/10/delorean_dmc-12_hero.jpg?quality=70&strip=info' }
];
const agendamentosUrgentes = [
    { id: 'ag-01', veiculo: 'Ford Maverick V8', servico: 'Verificação do sistema de freios', urgencia: 'Alta' },
    { id: 'ag-02', veiculo: 'Honda Civic', servico: 'Troca de óleo e filtros', urgencia: 'Média' },
    { id: 'ag-03', veiculo: 'Volvo FH', servico: 'Inspeção do motor de partida', urgencia: 'Alta' }
];
const ferramentasProgramador = [
    { nome: 'VS Code', utilidade: 'Nosso ambiente de desenvolvimento, onde a mágica acontece.' },
    { nome: 'Node.js', utilidade: 'A fundação do nosso backend, permitindo JavaScript no servidor.' },
    { nome: 'Render.com', utilidade: 'A plataforma que hospeda nosso backend.' },
    { nome: 'Git & GitHub', utilidade: 'Para controle de versão e colaboração no código-fonte.' }
];

// --- ROTAS DA API ---

app.get('/api/dicas/:vehicleType', (req, res) => {
    const { vehicleType } = req.params;
    const dicas = dicasManutencao[vehicleType];
    if (dicas) res.status(200).json(dicas);
    else res.status(404).json({ message: 'Nenhuma dica específica encontrada.' });
});

app.get('/api/weather', async (req, res) => {
    const OWM_API_KEY = process.env.OPENWEATHER_API_KEY;
    if (!OWM_API_KEY) {
        console.error("ERRO GRAVE: A variável de ambiente OPENWEATHER_API_KEY não está configurada no servidor.");
        return res.status(500).json({ message: "Serviço de clima indisponível: Chave da API não configurada no servidor." });
    }
    try {
        const { lat, lon, city } = req.query;
        if ((!lat || !lon) && !city) {
            return res.status(400).json({ message: "Parâmetros 'lat' e 'lon', ou 'city' são obrigatórios." });
        }
        let coords = { lat, lon };
        if (city) {
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OWM_API_KEY}`;
            const geoResponse = await axios.get(geoUrl);
            if (geoResponse.data.length === 0) return res.status(404).json({ message: `Cidade "${city}" não encontrada.` });
            coords = { lat: geoResponse.data[0].lat, lon: geoResponse.data[0].lon };
        }
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${OWM_API_KEY}&units=metric&lang=pt_br`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${OWM_API_KEY}&units=metric&lang=pt_br`;
        const [weatherResponse, forecastResponse] = await Promise.all([axios.get(weatherUrl), axios.get(forecastUrl)]);
        res.status(200).json({ current: weatherResponse.data, forecast: forecastResponse.data });
    } catch (error) {
        console.error("Erro no proxy da API de clima:", error.message);
        res.status(500).json({ message: "Erro ao buscar dados do clima." });
    }
});

app.get('/api/arsenal/veiculos-estrela', (req, res) => res.status(200).json(veiculosEstrela));
app.get('/api/arsenal/agendamentos-urgentes', (req, res) => res.status(200).json(agendamentosUrgentes));
app.get('/api/arsenal/ferramentas-dev', (req, res) => res.status(200).json(ferramentasProgramador));
app.get('/', (req, res) => res.send('<h1>Backend da Garagem Inteligente Pro está no ar!</h1>'));

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));