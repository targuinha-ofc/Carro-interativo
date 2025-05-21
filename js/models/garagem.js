// js/models/Garagem.js
'use strict';

import Veiculo from './veiculo.js';
import Carro from './Carro.js';
import CarroEsportivo from './Carroesportivo.js'; // <-- CORRIGIDO: Nome do arquivo/classe
import Caminhao from './caminhao.js';            // <-- CORRIGIDO: Nome do arquivo
import Manutencao from './manutençao.js';        // <-- CORRIGIDO: Nome do arquivo

/**
 * Gerencia a coleção de veículos e o veículo atualmente selecionado.
 * @class Garagem
 */
export default class Garagem {
    constructor() {
        this.veiculos = [];
        this.veiculoSelecionadoId = null;
    }

    /**
     * Adiciona um veículo à garagem.
     * @param {Veiculo} veiculo - A instância do veículo.
     * @returns {{success: boolean, message?: string}} Objeto com resultado.
     * @public
     */
    adicionarVeiculo(veiculo) {
        if (!(veiculo instanceof Veiculo)) {
            console.error("Tentativa de adicionar objeto inválido à garagem:", veiculo);
            return { success: false, message: "Erro interno: Tipo de objeto inválido para adicionar." };
        }
        if (this.veiculos.some(v => v.id === veiculo.id)) {
             console.warn(`Veículo com ID ${veiculo.id} (${veiculo.modelo}) já existe.`);
             if (this.veiculos.some(v => v.modelo.toLowerCase() === veiculo.modelo.toLowerCase() && v.cor.toLowerCase() === veiculo.cor.toLowerCase())) {
                return { success: false, message: `Um veículo ${veiculo.modelo} ${veiculo.cor} já existe na garagem.` };
             }
             return { success: false, message: `Veículo com ID ${veiculo.id} já existe (erro interno).` };
        }
        this.veiculos.push(veiculo);
        console.log(`Veículo ${veiculo.modelo} (ID: ${veiculo.id}, Tipo: ${veiculo.constructor.name}) adicionado.`);
        this.veiculos.sort((a, b) => a.modelo.localeCompare(b.modelo));
        return { success: true };
    }

    /**
     * Remove um veículo da garagem pelo seu ID.
     * @param {string} idVeiculo - O ID do veículo a remover.
     * @returns {boolean} True se removido, false caso contrário.
     * @public
     */
    removerVeiculo(idVeiculo) {
        const index = this.veiculos.findIndex(v => v.id === idVeiculo);
        if (index > -1) {
            const removido = this.veiculos.splice(index, 1)[0];
            console.log(`Veículo ${removido.modelo} (ID: ${idVeiculo}) removido.`);
            if (this.veiculoSelecionadoId === idVeiculo) {
                this.veiculoSelecionadoId = null;
                 localStorage.removeItem('garagemVeiculoSelecionadoId');
                 console.log("Seleção limpa pois o veículo selecionado foi removido.");
            }
            return true;
        }
        console.warn(`Veículo com ID ${idVeiculo} não encontrado para remoção.`);
        return false;
    }

    /**
     * Encontra e retorna um veículo na garagem pelo seu ID.
     * @param {string} idVeiculo - O ID do veículo.
     * @returns {Veiculo|undefined} O veículo encontrado ou undefined.
     * @public
     */
    encontrarVeiculo(idVeiculo) {
        return this.veiculos.find(v => v.id === idVeiculo);
    }

    /**
     * Define o veículo selecionado pelo seu ID.
     * @param {string|null} idVeiculo - O ID do veículo a selecionar ou null.
     * @returns {boolean} True se a seleção foi alterada ou confirmada.
     * @public
     */
    selecionarVeiculo(idVeiculo) {
         if (idVeiculo === null) {
             if (this.veiculoSelecionadoId !== null) {
                 this.veiculoSelecionadoId = null;
                 console.log("Seleção de veículo limpa.");
                 localStorage.removeItem('garagemVeiculoSelecionadoId');
                 return true;
             }
             return false;
         }

         const veiculoEncontrado = this.encontrarVeiculo(idVeiculo);
         if (veiculoEncontrado) {
             if (this.veiculoSelecionadoId !== idVeiculo) {
                 this.veiculoSelecionadoId = idVeiculo;
                 console.log(`Veículo selecionado: ${veiculoEncontrado.modelo} (ID: ${idVeiculo})`);
                 localStorage.setItem('garagemVeiculoSelecionadoId', idVeiculo);
                 return true;
             }
             return true; // Já estava selecionado
         } else {
             console.warn(`Tentativa de selecionar veículo com ID inválido: ${idVeiculo}`);
             return false;
         }
    }

    /**
     * Retorna a instância do veículo atualmente selecionado.
     * @returns {Veiculo|null} O veículo selecionado ou null.
     * @public
     */
    getVeiculoSelecionado() {
        return this.encontrarVeiculo(this.veiculoSelecionadoId);
    }

    /**
     * Salva o estado atual da lista de veículos no LocalStorage.
     * @returns {void}
     * @public
     */
    salvarNoLocalStorage() {
        try {
            const garagemParaSalvar = this.veiculos.map(v => v.toJSON());
            const garagemJSON = JSON.stringify(garagemParaSalvar);
            localStorage.setItem('minhaGaragemVirtual', garagemJSON);
            // console.log(`Garagem salva no LocalStorage com ${this.veiculos.length} veículo(s).`);
        } catch (error) {
            console.error("Erro CRÍTICO ao salvar garagem no LocalStorage:", error);
            alert("ERRO CRÍTICO: Não foi possível salvar os dados da garagem. Mudanças recentes podem ser perdidas.");
        }
    }

    /**
     * Carrega os dados dos veículos do LocalStorage e recria as instâncias.
     * @returns {Array<Veiculo>} Lista de veículos recriados.
     * @static
     * @public
     */
    static carregarDoLocalStorage() {
        const garagemJSON = localStorage.getItem('minhaGaragemVirtual');
        const veiculosCarregados = [];

        if (!garagemJSON) {
             console.log("Nenhum dado de garagem encontrado no LocalStorage.");
             return veiculosCarregados;
        }

        try {
            const veiculosSalvos = JSON.parse(garagemJSON);

            veiculosSalvos.forEach(obj => {
                try {
                    if (!obj || !obj._tipoClasse) {
                        console.warn("Objeto de veículo inválido ou sem _tipoClasse encontrado no LS:", obj);
                        return;
                    }

                    let veiculo = null;
                    let historicoRecriado = [];

                    if (obj.historicoManutencao && Array.isArray(obj.historicoManutencao)) {
                       historicoRecriado = obj.historicoManutencao
                        .map(mObj => {
                            if (mObj && mObj._tipoClasse === 'Manutencao') {
                                try {
                                    const manut = new Manutencao(mObj.dataISO, mObj.tipo, mObj.custo, mObj.descricao);
                                    if(mObj.id) manut.id = mObj.id;
                                    return manut.isValidDate() ? manut : null;
                                } catch(manutError) {
                                    console.error("Erro ao recriar Manutencao:", mObj, manutError);
                                    return null;
                                }
                            }
                            return null;
                        })
                        .filter(m => m !== null);

                       historicoRecriado.sort((a, b) => b.data.getTime() - a.data.getTime());
                    }

                    switch (obj._tipoClasse) {
                        case 'Carro':
                            veiculo = new Carro(obj.modelo, obj.cor, obj.id, obj.ligado, obj.velocidade);
                            break;
                        case 'CarroEsportivo': // <-- CORRIGIDO: Nome da classe
                            veiculo = new CarroEsportivo(obj.modelo, obj.cor, obj.id, obj.ligado, obj.velocidade, obj.turboBoostUsado || false);
                            break;
                        case 'Caminhao':
                            veiculo = new Caminhao(obj.modelo, obj.cor, obj.capacidadeCarga, obj.id, obj.ligado, obj.velocidade, obj.cargaAtual);
                            break;
                        default:
                            console.warn(`Tipo de veículo desconhecido ('${obj._tipoClasse}') encontrado no LS. Objeto:`, obj);
                    }

                    if (veiculo) {
                        veiculo.historicoManutencao = historicoRecriado;
                        if (!veiculosCarregados.some(v => v.id === veiculo.id)) {
                            veiculosCarregados.push(veiculo);
                        } else {
                            console.warn(`Veículo duplicado (ID: ${veiculo.id}) detectado durante carregamento.`);
                        }
                    }
                 } catch (veiculoError) {
                      console.error(`Erro ao carregar/recriar veículo individual (ID: ${obj?.id}, Tipo: ${obj?._tipoClasse}):`, veiculoError, "Objeto original:", obj);
                 }
            });

             veiculosCarregados.sort((a, b) => a.modelo.localeCompare(b.modelo));
             console.log(`${veiculosCarregados.length} veículo(s) carregado(s) e recriado(s) do LS.`);
             return veiculosCarregados;

        } catch (error) {
            console.error("Erro CRÍTICO ao carregar/parsear dados da garagem do LS:", error);
            alert("ERRO GRAVE: Não foi possível carregar os dados salvos da garagem. Resetando para um estado vazio. Verifique o console para detalhes.");
            localStorage.removeItem('minhaGaragemVirtual');
            localStorage.removeItem('garagemVeiculoSelecionadoId');
            return [];
        }
    }

    /**
     * Verifica agendamentos de manutenção próximos (2 dias).
     * @returns {Array<string>} Uma lista de mensagens de notificação para agendamentos próximos.
     * @public
     */
    verificarAgendamentosProximos() {
        const agora = new Date();
        const doisDiasEmMillis = 2 * 24 * 60 * 60 * 1000;
        const limite = new Date(agora.getTime() + doisDiasEmMillis);
        let notificacoesParaMostrar = [];

        this.veiculos.forEach(veiculo => {
            veiculo.historicoManutencao.forEach(manutencao => {
                if (manutencao.isValidDate() && manutencao.data >= agora && manutencao.data <= limite) {
                    const diffMillis = manutencao.data.getTime() - agora.getTime();
                    const diffHoras = Math.round(diffMillis / (1000 * 60 * 60));
                    const diffDias = Math.floor(diffMillis / (1000 * 60 * 60 * 24));

                    let tempoRestanteStr = "";
                    if (diffMillis < 30 * 60 * 1000) tempoRestanteStr = "em menos de 30 min";
                    else if (diffMillis < 60 * 60 * 1000) tempoRestanteStr = "em menos de 1h";
                    else if (diffDias === 0) tempoRestanteStr = `hoje (~${diffHoras}h)`;
                    else if (diffDias === 1) tempoRestanteStr = `amanhã (~${diffHoras}h)`;
                    else tempoRestanteStr = `em ${diffDias} dias (~${diffHoras}h)`;

                    const dataFormatada = manutencao.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                                         + ' às '
                                         + manutencao.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                    notificacoesParaMostrar.push({
                        data: manutencao.data,
                        msg: `Lembrete: ${manutencao.tipo} p/ ${veiculo.modelo} ${tempoRestanteStr} (${dataFormatada}).`
                    });
                }
            });
        });

        notificacoesParaMostrar.sort((a, b) => a.data.getTime() - b.data.getTime());

        if (notificacoesParaMostrar.length > 0) {
            console.log(`Agendamentos próximos encontrados: ${notificacoesParaMostrar.length}`);
        } else {
            console.log("Nenhum agendamento próximo encontrado.");
        }
        return notificacoesParaMostrar.map(n => n.msg);
    }
}