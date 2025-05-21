// js/models/Veiculo.js
'use strict';

import Manutencao from './manutençao.js';

/**
 * Representa a classe base para qualquer veículo na garagem.
 * @class Veiculo
 */
export default class Veiculo {
    /**
     * Cria uma instância de Veiculo.
     * @param {string} modelo - O modelo do veículo.
     * @param {string} cor - A cor do veículo.
     * @param {string|null} [id=null] - O ID único do veículo.
     * @throws {Error} Se o modelo ou a cor não forem strings válidas e não vazias.
     */
    constructor(modelo, cor, id = null) {
        if (!modelo || typeof modelo !== 'string' || modelo.trim() === '') {
            throw new Error("Modelo do veículo é obrigatório e deve ser uma string não vazia.");
        }
        if (!cor || typeof cor !== 'string' || cor.trim() === '') {
            throw new Error("Cor do veículo é obrigatória e deve ser uma string não vazia.");
        }

        this.modelo = modelo.trim();
        this.cor = cor.trim();
        this.historicoManutencao = []; // Array de instâncias de Manutencao
        this.id = id || Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    /**
     * Adiciona um registro de manutenção ao histórico do veículo.
     * @param {Manutencao} manutencao - A instância de Manutencao a ser adicionada.
     * @returns {{success: boolean, message?: string}} Objeto indicando sucesso e mensagem opcional.
     * @public
     */
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
        // A ordenação principal da lista de manutenções (para garantir que as funções de formatação funcionem corretamente)
        // é melhor feita aqui, uma vez, ao adicionar/carregar, do que repetidamente nas funções de formatação.
        this.historicoManutencao.sort((a, b) => {
            if (!a.isValidDate() && !b.isValidDate()) return 0;
            if (!a.isValidDate()) return 1; // Datas inválidas no final
            if (!b.isValidDate()) return -1; // Datas inválidas no final
            return b.data.getTime() - a.data.getTime(); // Mais recentes primeiro
        });
        console.log(`Manutenção/Agendamento adicionado para ${this.modelo}: ${manutencao.retornarFormatada(true)}`);
        return { success: true };
    }

    /**
     * Remove um registro de manutenção do histórico pelo seu ID.
     * @param {string} idManutencao - O ID da manutenção a ser removida.
     * @returns {boolean} Retorna true se a manutenção foi encontrada e removida, false caso contrário.
     * @public
     */
    removerManutencao(idManutencao) {
        const index = this.historicoManutencao.findIndex(m => m.id === idManutencao);
        if (index > -1) {
            const removida = this.historicoManutencao.splice(index, 1)[0];
            console.log(`Manutenção ${idManutencao} (${removida.tipo}) removida de ${this.modelo}.`);
            return true;
        }
        console.warn(`Manutenção ${idManutencao} não encontrada em ${this.modelo}.`);
        return false;
    }

    /**
     * Retorna um array com as manutenções passadas formatadas como objetos {id, texto}.
     * A lista já está ordenada pela data (mais recentes primeiro).
     * @returns {Array<{id: string, texto: string}>} Lista de objetos com id e texto formatado.
     * @public
     */
    getHistoricoPassadoFormatado() {
        const agora = new Date();
        return this.historicoManutencao
            .filter(item => item.isValidDate() && item.data < agora)
            .map(manutencao => ({
                id: manutencao.id,
                texto: manutencao.retornarFormatada(true) // Inclui horário para histórico
            }));
        // Não é necessário re-ordenar aqui se a lista principal já está ordenada.
    }

    /**
     * Retorna um array com os agendamentos futuros formatados como objetos {id, texto}.
     * A lista é filtrada e depois re-ordenada para agendamentos (mais próximos primeiro).
     * @returns {Array<{id: string, texto: string}>} Lista de objetos com id e texto formatado.
     * @public
     */
    getAgendamentosFuturosFormatados() {
         const agora = new Date();
         return this.historicoManutencao
             .filter(item => item.isValidDate() && item.data >= agora)
             .sort((a, b) => a.data.getTime() - b.data.getTime()) // Agendamentos: mais próximos primeiro
             .map(manutencao => ({
                 id: manutencao.id,
                 texto: manutencao.retornarFormatada(true) // Inclui horário para agendamentos
             }));
    }

    /**
     * Retorna um objeto com as informações básicas do veículo (ID, modelo, cor).
     * @returns {{id: string, modelo: string, cor: string}} Objeto com informações base.
     * @public
     */
    exibirInformacoesBase() {
         return {
             id: this.id,
             modelo: this.modelo,
             cor: this.cor
         };
    }

    /**
     * Retorna uma representação JSON do Veiculo e seu histórico de manutenção.
     * @returns {object} Objeto serializável representando o veículo.
     * @public
     */
    toJSON() {
        return {
            _tipoClasse: this.constructor.name, // Dinamicamente pega o nome da classe
            modelo: this.modelo,
            cor: this.cor,
            id: this.id,
            historicoManutencao: this.historicoManutencao.map(m => m.toJSON())
        };
    }
}