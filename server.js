// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
app.use(cors());
// IMPORTANTE: Adiciona o middleware para o Express entender JSON no corpo das requisições (req.body)
app.use(express.json());

// =========================================================================
// --- ENDPOINT EXISTENTE: PROXY PARA O CLIMA ---
// =========================================================================

const OWM_API_KEY = process.env.OPENWEATHER_API_KEY;

if (!OWM_API_KEY) {
  console.error("ERRO CRÍTICO: A variável de ambiente OPENWEATHER_API_KEY não está definida.");
  process.exit(1);
}

app.get('/api/weather', async (req, res) => {
  // ... (o código do endpoint de clima permanece exatamente o mesmo)
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
      if (geoResponse.data.length === 0) {
        return res.status(404).json({ message: `Cidade "${city}" não encontrada.` });
      }
      coords = { lat: geoResponse.data[0].lat, lon: geoResponse.data[0].lon };
      finalCityName = geoResponse.data[0].name;
    }
    
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${OWM_API_KEY}&units=metric&lang=pt_br`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${OWM_API_KEY}&units=metric&lang=pt_br`;

    const [weatherResponse, forecastResponse] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(forecastUrl)
    ]);
    
    if (finalCityName) {
        weatherResponse.data.name = finalCityName;
    }

    res.json({
      current: weatherResponse.data,
      forecast: forecastResponse.data
    });

  } catch (error) {
    console.error("Erro no proxy da API:", error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({ message: "Erro ao buscar dados do clima." });
  }
});

// =========================================================================
// --- INÍCIO: NOVOS ENDPOINTS PARA A GARAGEM ---
// =========================================================================

// --- Simulação de Banco de Dados (em memória) ---
let nextVehicleId = 1;
const inMemoryDatabase = {
  veiculos: [
    // Vamos começar com um veículo de exemplo
    { 
      id: nextVehicleId++,
      type: 'CarroEsportivo', 
      modelo: '911 Carrera', 
      cor: 'Amarelo', 
      imagemURL: 'https://files.porsche.com/filestore/image/multimedia/none/992-c2-modelimage-sideshot/model/cfbb8ed3-1a15-11e9-80c4-005056bbdc38/porsche-model.png' 
    }
  ],
  agendamentos: []
};
// ----------------------------------------------


// Rota para BUSCAR (GET) todos os veículos
app.get('/api/garagem/veiculos', (req, res) => {
  console.log('Recebida requisição GET para /api/garagem/veiculos');
  // Simplesmente retorna a lista de veículos da nossa "base de dados"
  res.status(200).json(inMemoryDatabase.veiculos);
});

// Rota para ADICIONAR (POST) um novo veículo
app.post('/api/garagem/veiculos', (req, res) => {
  console.log('Recebida requisição POST para /api/garagem/veiculos');
  
  // Os dados do novo veículo vêm no corpo (body) da requisição
  const novoVeiculoData = req.body;
  
  // Validação simples
  if (!novoVeiculoData || !novoVeiculoData.modelo || !novoVeiculoData.cor) {
    return res.status(400).json({ message: "Dados do veículo inválidos. 'modelo' e 'cor' são obrigatórios." });
  }

  // Cria um objeto de veículo completo, incluindo um novo ID
  const veiculoCompleto = {
    id: nextVehicleId++,
    ...novoVeiculoData // Adiciona todas as outras propriedades recebidas (type, modelo, cor, imagemURL, etc.)
  };

  // Adiciona o novo veículo à nossa "base de dados"
  inMemoryDatabase.veiculos.push(veiculoCompleto);

  console.log('Novo veículo adicionado:', veiculoCompleto);

  // Retorna o veículo recém-criado com o status 201 (Created)
  res.status(201).json(veiculoCompleto);
});

// Futuramente, podemos adicionar rotas para agendamentos aqui
// Ex: app.get('/api/garagem/agendamentos', ...);
// Ex: app.post('/api/garagem/agendamentos', ...);


app.listen(PORT, () => {
  console.log(`Servidor proxy rodando na porta ${PORT}`);
});