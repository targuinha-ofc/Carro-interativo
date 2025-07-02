# Garagem Inteligente Pro - Backend

Servidor Node.js/Express para a aplicação Garagem Inteligente Pro.

## Descrição

Este servidor atua como um backend para a aplicação, fornecendo uma API para gerenciamento de dados de veículos, agendamentos e um proxy para a API de clima da OpenWeatherMap.

## API Endpoints

### Clima

*   **Endpoint:** `GET /api/weather`
*   **Descrição:** Retorna os dados atuais do clima e a previsão para 5 dias. Funciona como um proxy para a API da OpenWeatherMap, mantendo a chave de API segura no servidor.
*   **Parâmetros de Query:**
    *   `city={nome_da_cidade}` OU
    *   `lat={latitude}&lon={longitude}`
*   **Resposta de Sucesso (200):** Objeto JSON com as chaves `current` e `forecast`.

### Status da Garagem (NOVO)

*   **Endpoint:** `GET /api/garagem/status`
*   **Descrição:** Fornece um resumo rápido da quantidade de veículos e agendamentos cadastrados (em memória no servidor).
*   **Resposta de Sucesso (200):** Objeto JSON no formato `{ "totalVeiculos": number, "totalAgendamentos": number }`.

### Dicas de Manutenção (NOVO)

*   **Endpoint:** `GET /api/dicas/:tipoVeiculo`
*   **Descrição:** Retorna uma lista de dicas de manutenção específicas para o tipo de veículo informado.
*   **Parâmetro de Rota:**
    *   `tipoVeiculo` (string): O nome da classe do veículo. Valores válidos: `Veiculo`, `CarroEsportivo`, `Caminhao`.
*   **Resposta de Sucesso (200):** Array de strings, onde cada string é uma dica. `["Dica 1", "Dica 2"]`.
*   **Resposta de Erro (404):** Objeto JSON com uma mensagem de erro se o `tipoVeiculo` for inválido ou não tiver dicas. `{ "message": "Tipo de veículo não encontrado..." }`.

### Gerenciamento de Veículos

*   **Endpoint:** `GET /api/garagem/veiculos`
*   **Descrição:** Retorna a lista completa de veículos na garagem (em memória).
*   **Resposta de Sucesso (200):** Array de objetos, onde cada objeto representa um veículo.

*   **Endpoint:** `POST /api/garagem/veiculos`
*   **Descrição:** Adiciona um novo veículo à garagem.
*   **Corpo da Requisição (Body):** Objeto JSON com os dados do veículo (ex: `{ "type": "Caminhao", "modelo": "Scania", "cor": "Branco" }`).
*   **Resposta de Sucesso (201):** O objeto do veículo recém-criado, incluindo o novo `id` gerado pelo servidor.