// js/models/Carro.js
'use strict';

import Veiculo from './veiculo.js';

/**
 * Representa um Carro comum, herdando de Veiculo.
 * @class Carro
 * @extends Veiculo
 */
export default class Carro extends Veiculo {
    /**
     * Cria uma instância de Carro.
     * @param {string} modelo - O modelo do carro.
     * @param {string} cor - A cor do carro.
     * @param {string|null} [id=null] - O ID único do veículo.
     * @param {boolean} [ligado=false] - O estado inicial do motor.
     * @param {number} [velocidade=0] - A velocidade inicial.
     */
    constructor(modelo, cor, id = null, ligado = false, velocidade = 0) {
        super(modelo, cor, id);
        this.ligado = Boolean(ligado);
        this.velocidade = Math.max(0, Number(velocidade) || 0);
        this.velocidadeMaxima = 150;
    }

    /**
     * Liga o motor do carro.
     * @returns {{success: boolean, message?: string}} Objeto indicando sucesso e mensagem.
     * @public
     */
    ligar() {
        if (!this.ligado) {
            this.ligado = true;
            console.log(`${this.modelo} ligado.`);
            return { success: true, message: `${this.modelo} ligado.` };
        }
        console.log(`${this.modelo} já estava ligado.`);
        return { success: false, message: `${this.modelo} já estava ligado.` };
    }

    /**
     * Desliga o motor do carro.
     * @returns {{success: boolean, message?: string}} Objeto indicando sucesso e mensagem.
     * @public
     */
    desligar() {
        if (this.ligado) {
            this.ligado = false;
            this.velocidade = 0; // Carro para ao desligar
            console.log(`${this.modelo} desligado.`);
            return { success: true, message: `${this.modelo} desligado. Velocidade zerada.` };
        }
        console.log(`${this.modelo} já estava desligado.`);
        return { success: false, message: `${this.modelo} já estava desligado.` };
    }

    /**
     * Aumenta a velocidade do carro.
     * @returns {{success: boolean, message?: string}} Objeto indicando sucesso e mensagem.
     * @public
     */
    acelerar() {
        if (!this.ligado) {
            console.warn(`${this.modelo} está desligado, não pode acelerar.`);
            return { success: false, message: `Ligue o ${this.modelo} primeiro!` };
        }
        if (this.velocidade < this.velocidadeMaxima) {
            this.velocidade = Math.min(this.velocidade + 10, this.velocidadeMaxima);
            console.log(`${this.modelo} acelerou para: ${this.velocidade} km/h`);
            return { success: true }; // Mensagem padrão será montada na UI se necessário
        } else {
             console.log(`${this.modelo} já está na velocidade máxima (${this.velocidadeMaxima} km/h)!`);
             return { success: false, message: `${this.modelo} já está na velocidade máxima!` };
        }
    }

    /**
     * Diminui a velocidade do carro.
     * @returns {{success: boolean, message?: string}} Objeto indicando sucesso e mensagem.
     * @public
     */
    frear() {
        if (this.velocidade > 0) {
            this.velocidade = Math.max(0, this.velocidade - 10);
            console.log(`${this.modelo} freou para: ${this.velocidade} km/h`);
            return { success: true }; // Mensagem padrão será montada na UI se necessário
        }
        console.log(`${this.modelo} já está parado.`);
        return { success: false, message: `${this.modelo} já está parado.` };
    }

    /**
     * Retorna um objeto com dados específicos do estado atual do Carro.
     * Usado para atualizar a UI.
     * @returns {{ligado: boolean, velocidade: number, velocidadeMaxima: number}} Objeto com o estado.
     * @public
     */
    getDadosEspecificos() {
        return {
            ligado: this.ligado,
            velocidade: this.velocidade,
            velocidadeMaxima: this.velocidadeMaxima
        };
    }

    /**
     * Retorna uma representação JSON do Carro para persistência.
     * @returns {object} Objeto serializável.
     * @public
     */
    toJSON() {
        const baseJSON = super.toJSON(); // Pega dados de Veiculo (modelo, cor, id, historicoManutencao)
        return {
            ...baseJSON, // Espalha os dados da classe pai
            _tipoClasse: 'Carro', // Identificador do tipo de classe
            ligado: this.ligado,
            velocidade: this.velocidade
            // velocidadeMaxima não precisa ser salva, pois é definida no construtor
        };
    }
}