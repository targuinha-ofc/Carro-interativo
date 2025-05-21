// js/models/Caminhao.js
'use strict';

import Carro from './Carro.js';
// <-- ALTERADO: Removido import de showNotification

/**
 * Representa um Caminhão, uma especialização de Carro.
 * @class Caminhao
 * @extends Carro
 */
export default class Caminhao extends Carro {
    /**
     * Cria uma instância de Caminhao.
     * @param {string} modelo - O modelo.
     * @param {string} cor - A cor.
     * @param {number|string} capacidadeCarga - A capacidade máxima de carga em KG.
     * @param {string|null} [id=null] - O ID.
     * @param {boolean} [ligado=false] - Estado inicial do motor.
     * @param {number} [velocidade=0] - Velocidade inicial.
     * @param {number|string} [cargaAtual=0] - A carga inicial em KG.
     * @throws {Error} Se a capacidade de carga for inválida.
     */
    constructor(modelo, cor, capacidadeCarga, id = null, ligado = false, velocidade = 0, cargaAtual = 0) {
        const capNum = Number(capacidadeCarga);
        if (isNaN(capNum) || capNum <= 0) {
            throw new Error("Capacidade de carga do caminhão deve ser um número positivo.");
        }

        super(modelo, cor, id, ligado, velocidade);

        this.capacidadeCarga = capNum;
        this.cargaAtual = Math.max(0, Math.min(Number(cargaAtual) || 0, this.capacidadeCarga));
        this.velocidadeMaxima = 120;
    }

    /**
     * Adiciona carga ao caminhão.
     * @param {number} [quantidade=1000] - A quantidade de carga (KG) a adicionar.
     * @returns {{success: boolean, message: string, cargaAtual?: number}} Objeto com resultado.
     * @public
     */
    carregar(quantidade = 1000) { // <-- ALTERADO: Retorna objeto, remove showNotification
        if (this.ligado) {
             return { success: false, message: "Desligue o caminhão para carregar/descarregar com segurança." };
        }
        const quantNum = Number(quantidade);
        if (isNaN(quantNum) || quantNum <= 0) {
            return { success: false, message: "Quantidade inválida para carregar." };
        }

        const espacoDisponivel = this.capacidadeCarga - this.cargaAtual;
        if (espacoDisponivel <= 0) {
             return { success: false, message: 'Caminhão já está na capacidade máxima!' };
        }

        const cargaAdicionada = Math.min(quantNum, espacoDisponivel);
        this.cargaAtual += cargaAdicionada;
        console.log(`Carga adicionada: ${cargaAdicionada}kg. Carga atual: ${this.cargaAtual}kg / ${this.capacidadeCarga}kg.`);

        let message;
        if (cargaAdicionada < quantNum) {
            message = `Carga máxima atingida. ${cargaAdicionada}kg carregados. Carga atual: ${this.cargaAtual}kg`;
        } else {
            message = `${cargaAdicionada}kg carregados. Carga atual: ${this.cargaAtual}kg`;
        }
        return { success: true, message: message, cargaAtual: this.cargaAtual };
    }

    /**
     * Remove carga do caminhão.
     * @param {number} [quantidade=500] - A quantidade de carga (KG) a remover.
     * @returns {{success: boolean, message: string, cargaAtual?: number}} Objeto com resultado.
     * @public
     */
    descarregar(quantidade = 500) { // <-- ALTERADO: Retorna objeto, remove showNotification
        if (this.ligado) {
             return { success: false, message: "Desligue o caminhão para carregar/descarregar com segurança." };
        }
        const quantNum = Number(quantidade);
         if (isNaN(quantNum) || quantNum <= 0) {
            return { success: false, message: "Quantidade inválida para descarregar." };
        }

        if (this.cargaAtual <= 0) {
            return { success: false, message: 'Caminhão já está vazio.' };
        }

        const cargaRemovida = Math.min(quantNum, this.cargaAtual);
        this.cargaAtual -= cargaRemovida;
        console.log(`Carga removida: ${cargaRemovida}kg. Carga atual: ${this.cargaAtual}kg.`);
        const message = `${cargaRemovida}kg descarregados. Carga atual: ${this.cargaAtual}kg`;
        return { success: true, message: message, cargaAtual: this.cargaAtual };
    }

     /**
      * Acelera o caminhão.
      * @returns {{success: boolean, message?: string}} Objeto indicando sucesso e mensagem.
      * @override
      * @public
      */
     acelerar() { // <-- ALTERADO: Retorna objeto
        if (!this.ligado) {
            return { success: false, message: 'Ligue o caminhão primeiro!' }; // <-- ALTERADO
        }
        if (this.velocidade < this.velocidadeMaxima) {
            const fatorCarga = Math.max(0.3, 1 - (this.cargaAtual / (this.capacidadeCarga * 1.5)));
            const incrementoBase = 7;
            const incremento = Math.max(1, Math.round(incrementoBase * fatorCarga));

            this.velocidade = Math.min(this.velocidade + incremento, this.velocidadeMaxima);
            console.log(`${this.modelo} (Caminhão) acelerou para: ${this.velocidade} km/h (fator carga: ${fatorCarga.toFixed(2)})`);
            return { success: true }; // <-- ALTERADO
        } else {
            console.log(`${this.modelo} já está na velocidade máxima (${this.velocidadeMaxima} km/h)!`);
            return { success: false, message: `${this.modelo} já está na velocidade máxima!` }; // <-- ALTERADO
        }
    }

    /**
     * Freia o caminhão.
     * @returns {{success: boolean, message?: string}} Objeto indicando sucesso e mensagem.
     * @override
     * @public
     */
    frear() { // <-- ALTERADO: Retorna objeto
        if (this.velocidade > 0) {
             const fatorCarga = Math.max(0.4, 1 - (this.cargaAtual / (this.capacidadeCarga * 2.0)));
             const decrementoBase = 8;
             const decremento = Math.max(2, Math.round(decrementoBase * fatorCarga));

            this.velocidade = Math.max(0, this.velocidade - decremento);
            console.log(`${this.modelo} (Caminhão) freou para: ${this.velocidade} km/h`);
            return { success: true }; // <-- ALTERADO
        }
        return { success: false, message: `${this.modelo} já está parado.` }; // <-- ALTERADO
    }

    /**
     * Retorna dados específicos do Caminhão.
     * @returns {{ligado: boolean, velocidade: number, velocidadeMaxima: number, cargaAtual: number, capacidadeCarga: number}} Objeto com o estado.
     * @override
     * @public
     */
    getDadosEspecificos() {
        const dadosPai = super.getDadosEspecificos();
        return {
            ...dadosPai,
            velocidadeMaxima: this.velocidadeMaxima,
            cargaAtual: this.cargaAtual,
            capacidadeCarga: this.capacidadeCarga
        };
    }

    /**
     * Retorna uma representação JSON do Caminhao.
     * @returns {object} Objeto serializável.
     * @override
     * @public
     */
    toJSON() {
        const baseJSON = super.toJSON();
        return {
            ...baseJSON,
            _tipoClasse: 'Caminhao',
            capacidadeCarga: this.capacidadeCarga,
            cargaAtual: this.cargaAtual
        };
    }
}