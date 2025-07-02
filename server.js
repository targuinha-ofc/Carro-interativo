// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config(); // Carrega as variáveis do arquivo .env

const app = express();
const PORT = process.env.PORT || 3001; // Render.com fornecerá a porta

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Variável de Ambiente ---
const OWM_API_KEY = process.env.OPENWEATHER_API_KEY;

if (!OWM_API_KEY) {
  console.error("ERRO CRÍTICO: A variável de ambiente OPENWEATHER_API_KEY não está definida.");
  process.exit(1); // Impede o servidor de iniciar sem a chave
}

// --- Rota Principal do Proxy ---
// Ex: /api/weather?lat=40.71&lon=-74.01 OU /api/weather?city=New%20York
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

app.listen(PORT, () => {
  console.log(`Servidor proxy rodando na porta ${PORT}`);
});