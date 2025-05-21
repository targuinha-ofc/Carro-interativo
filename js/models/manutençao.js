// js/models/manutencao.js <-- ALTERADO: Nome do arquivo sugerido (sem acento)
'use strict';

/**
 * Representa um registro de manutenção ou agendamento para um veículo.
 * Contém informações sobre data, tipo, custo e descrição do serviço.
 * @class Manutencao
 */
export default class Manutencao {
    /**
     * Cria uma instância de Manutencao.
     * @param {string|Date} dataISO - A data e hora da manutenção. Pode ser uma string ISO 8601 ou um objeto Date.
     * @param {string} tipo - O tipo de serviço realizado ou agendado (ex: "Troca de óleo").
     * @param {number|string} custo - O custo do serviço. Se string, tentará converter para número (',' vira '.'). Zero ou negativo é tratado como 0.
     * @param {string} [descricao=''] - Uma descrição opcional do serviço.
     */
    constructor(dataISO, tipo, custo, descricao = '') {
        if (dataISO instanceof Date && !isNaN(dataISO)) {
            this.data = dataISO;
        } else if (typeof dataISO === 'string') {
             try {
                // Tenta interpretar como ISO 8601. new Date() pode ser inconsistente com formatos locais.
                // Se for de um <input type="datetime-local">, geralmente já está quase ISO.
                this.data = new Date(dataISO);
                if (isNaN(this.data)) throw new Error("String de data inválida recebida.");
             } catch (e) {
                 console.error("Erro ao criar data para Manutencao a partir da string:", dataISO, e);
                 this.data = new Date(NaN);
             }
        } else {
             console.warn("Tipo de data inválido recebido para Manutencao:", dataISO);
             this.data = new Date(NaN);
        }

        this.tipo = tipo ? String(tipo).trim() : '';

        let custoNumerico = 0;
        if (custo !== null && custo !== undefined && custo !== '') {
            if (typeof custo === 'string') {
                custo = custo.replace(',', '.').replace(/[^\d.-]/g, ''); // Limpa e permite apenas números, ponto e sinal negativo
            }
            custoNumerico = parseFloat(custo);
        }
        this.custo = isNaN(custoNumerico) || custoNumerico < 0 ? 0 : custoNumerico;

        this.descricao = descricao ? String(descricao).trim() : '';

        this.id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    /**
     * Retorna uma string formatada representando a manutenção.
     * Ex: "Troca de óleo em 25/12/2023 às 10:30 - R$ 150,50 (Filtro incluído)"
     * @param {boolean} [incluirHorario=true] - Se true, inclui a hora na formatação da data. <-- ALTERADO: Padrão para true
     * @returns {string} A representação textual da manutenção.
     * @public
     */
    retornarFormatada(incluirHorario = true) {
        if (!this.isValidDate()) {
            return `${this.tipo || 'Tipo Indefinido'} - Data Inválida - ${this.formatarCusto()}${this.descricao ? ` (${this.descricao})` : ''}`;
        }
        const opcoesData = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const opcoesHora = { hour: '2-digit', minute: '2-digit' };

        let dataStr = this.data.toLocaleDateString('pt-BR', opcoesData);
        if (incluirHorario) {
             dataStr += ' às ' + this.data.toLocaleTimeString('pt-BR', opcoesHora);
        }

        return `${this.tipo} em ${dataStr} - ${this.formatarCusto()}${this.descricao ? ` (${this.descricao})` : ''}`;
    }

    /**
     * Formata o custo como moeda brasileira (BRL) ou retorna "Grátis/Agendado" se custo for zero.
     * @returns {string} O custo formatado.
     * @public
     */
    formatarCusto() {
        if (this.custo === 0) {
            return this.data > new Date() ? "Agendado" : "Grátis"; // Diferencia agendamento de serviço grátis
        }
        return this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    /**
     * Verifica se a data associada a esta manutenção é válida.
     * @returns {boolean} True se a data for um objeto Date válido, false caso contrário.
     * @public
     */
    isValidDate() {
      return this.data instanceof Date && !isNaN(this.data.getTime());
    }

    /**
     * Valida os dados essenciais da manutenção (data e tipo).
     * @returns {{valido: boolean, mensagemErro?: string}} Objeto indicando validade e mensagem.
     * @public
     */
    validarDados() { // <-- ALTERADO: Retorna objeto com status e mensagem
        if (!this.isValidDate()) {
            console.error("Erro de validação Manutencao: Data inválida.", this.data);
            return { valido: false, mensagemErro: "Data da manutenção inválida ou não informada." };
        }
        if (typeof this.tipo !== 'string' || this.tipo === '') {
            console.error("Erro de validação Manutencao: Tipo de serviço não pode ser vazio.", this.tipo);
            return { valido: false, mensagemErro: "Tipo de serviço não pode ser vazio." };
        }
        return { valido: true }; // <-- ALTERADO
    }

    /**
     * Retorna uma representação JSON simplificada do objeto Manutencao.
     * @returns {object} Objeto com os dados da manutenção.
     * @public
     */
    toJSON() {
        return {
            _tipoClasse: 'Manutencao',
            dataISO: this.isValidDate() ? this.data.toISOString() : null,
            tipo: this.tipo,
            custo: this.custo,
            descricao: this.descricao,
            id: this.id
        };
    }
}