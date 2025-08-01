// server.js

// 1. CARREGUE AS VARIÁVEIS DE AMBIENTE PRIMEIRO DE TUDO
require('dotenv').config(); 

const express = require('express');

// Importa a função de conexão com o banco de dados
const connectDB = require('./config/db');

// Inicializa a aplicação Express
const app = express();

// Conecta ao Banco de Dados
connectDB();

// Middleware para permitir o uso de JSON no corpo das requisições
app.use(express.json());

// Rota de exemplo para testar se o servidor está funcionando
app.get('/', (req, res) => {
  res.send('<h1>API da Garagem Inteligente está no ar!</h1>');
});

// Define a porta do servidor a partir do arquivo .env ou usa 5000 como padrão
const PORT = process.env.PORT || 5000;

// Inicia o servidor e o faz escutar na porta definida
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});