// Classe Carro (Base)
class Carro {
    constructor(modelo, cor) {
        this.modelo = modelo;
        this.cor = cor;
        this.velocidade = 0;
        this.ligado = false;
        this.somLigando = new Audio("mp3/ligando.mp3"); // Carrega o som
        this.somAcelerando = new Audio("mp3/acelerando.mp3");
        this.somAcelerando.loop = true;
        this.somAcelerando.volume = 1;
    }

    ligar() {
        if (!this.ligado) {
            this.ligado = true;
            this.somLigando.play(); // Toca o som ao ligar
            this.atualizarStatus();
            this.atualizarVelocidade();
            console.log("Carro ligado!");
        } else {
            console.log("O carro já está ligado.");
        }
    }

    desligar() {
        if (this.ligado) {
            this.ligado = false;
            this.velocidade = 0; // Reseta a velocidade ao desligar
            this.atualizarVelocidade();
            this.atualizarStatus();
            console.log("Carro desligado!");
        } else {
            console.log("O carro já está desligado.");
        }
    }

    acelerar(incremento) {
        if (this.ligado) {
            this.velocidade += incremento;
            this.atualizarVelocidade();
            console.log(`Acelerando! Velocidade atual: ${this.velocidade} km/h`);
        } else {
            console.log("O carro precisa estar ligado para acelerar.");
        }
    }

    frear(decremento) {
        if (this.ligado) {
            this.velocidade -= decremento;
            if (this.velocidade < 0) {
                this.velocidade = 0; // Impede velocidade negativa
            }
            this.atualizarVelocidade();
            console.log(`Freando! Velocidade atual: ${this.velocidade} km/h`);
        } else {
            console.log("O carro precisa estar ligado para frear.");
        }
    }

    atualizarVelocidade() {
        document.getElementById("velocidade").textContent = `Velocidade: ${this.velocidade} km/h`;
    }

    atualizarStatus() {
        const statusElement = document.getElementById("status");
        statusElement.textContent = `Status: ${this.ligado ? "Ligado" : "Desligado"}`;
    }

    exibirStatus() {
        return `Modelo: ${this.modelo}, Cor: ${this.cor}, Ligado: ${this.ligado}, Velocidade: ${this.velocidade}`;
    }
}

// Classes CarroEsportivo e Caminhao (Herança)
class CarroEsportivo extends Carro {
    constructor(modelo, cor) {
        super(modelo, cor);
        this.turboAtivado = false;
    }

    ativarTurbo() {
        if (this.ligado) {
            this.turboAtivado = true;
            this.acelerar(50);
        }
    }

    desativarTurbo() {
        this.turboAtivado = false;
    }

    exibirStatus() {
        return `${super.exibirStatus()}, Turbo: ${this.turboAtivado}`;
    }

    atualizarVelocidade() { // Override necessário para atualizar a velocidade DO CARRO ESPORTIVO no HTML
        const velocidadeElement = document.getElementById("velocidadeEsportivo");
        if (velocidadeElement) {
            velocidadeElement.textContent = `Velocidade: ${this.velocidade} km/h`;
        }
    }

    atualizarStatus() { // Override necessário para atualizar o status DO CARRO ESPORTIVO no HTML
        const statusElement = document.getElementById("statusEsportivoStatus"); // Assumindo que você tenha um element HTML específico para o status do carro esportivo
        if (statusElement) {
            statusElement.textContent = `Status do Esportivo: ${this.ligado ? "Ligado" : "Desligado"}`;
        }
    }
}

class Caminhao extends Carro {
    constructor(modelo, cor, capacidadeCarga) {
        super(modelo, cor);
        this.modelo = modelo; // Make sure to set the model in the constructor!
        this.cor = cor;
        this.capacidadeCarga = capacidadeCarga;
        this.cargaAtual = 0;
    }

    carregar(peso) {
        if (this.cargaAtual + peso <= this.capacidadeCarga) {
            this.cargaAtual += peso;
            this.atualizarStatusCarga(); // Atualiza o status da carga após o carregamento
            return "Caminhão carregado com sucesso.";
        } else {
            return "Carga excede a capacidade do caminhão.";
        }
    }

    descarregar(peso) {
        if (this.cargaAtual - peso >= 0) {
            this.cargaAtual -= peso;
            this.atualizarStatusCarga(); // Atualiza o status da carga após o descarregamento
            return "Caminhão descarregado com sucesso.";
        } else {
            return "Não há carga suficiente para descarregar.";
        }
    }

    exibirStatus() {
        return `Modelo: ${this.modelo}, Cor: ${this.cor}, Ligado: ${this.ligado}, Velocidade: ${this.velocidade}, Carga: ${this.cargaAtual}/${this.capacidadeCarga}`;
    }


    atualizarVelocidade() { // Override necessário para atualizar a velocidade DO CAMINHÃO no HTML
        document.getElementById("velocidadeCaminhao").textContent = `Velocidade: ${this.velocidade} km/h`;
    }

    atualizarStatus() { // Override necessário para atualizar o status DO CAMINHÃO no HTML
        const statusElement = document.getElementById("statusCaminhaoStatus"); // Assumindo que você tenha um elemento HTML específico para o status do caminhão
        statusElement.textContent = `Status do Caminhão: ${this.ligado ? "Ligado" : "Desligado"}`;
    }

    atualizarStatusCarga() {
        const cargaElement = document.getElementById("statusCaminhaoCarga"); // Elemento para exibir a carga atual
        cargaElement.textContent = `Carga: ${this.cargaAtual}/${this.capacidadeCarga}`;
    }
}


// Variáveis globais para armazenar os objetos
let meuCarro = new Carro("Sedan", "Prata"); // Instância do carro base
let carroEsportivo;
let caminhao;

// Funções para interagir com o carro base
document.getElementById("ligarBtn").addEventListener("click", () => {
  meuCarro.ligar();
});
document.getElementById("desligarBtn").addEventListener("click", () => meuCarro.desligar());
document.getElementById("acelerarBtn").addEventListener("click", () => meuCarro.acelerar(10));
document.getElementById("frearBtn").addEventListener("click", () => meuCarro.frear(10));

// Funções para criar os objetos CarroEsportivo e Caminhao
function criarCarroEsportivo() {
    const modelo = document.getElementById("modeloEsportivo").value;
    const cor = document.getElementById("corEsportivo").value;
    carroEsportivo = new CarroEsportivo(modelo, cor);
    exibirStatusEsportivo();
}

function criarCaminhao() {
    const modelo = document.getElementById("modeloCaminhao").value;
    const cor = document.getElementById("corCaminhao").value;
    const capacidadeCarga = parseInt(document.getElementById("capacidadeCarga").value);
    caminhao = new Caminhao(modelo, cor, capacidadeCarga);
    exibirStatusCaminhao();
}

// Funções para interagir com o Carro Esportivo
function ligarCarroEsportivo() {
    if (carroEsportivo) {
        carroEsportivo.ligar();
        carroEsportivo.atualizarStatus();  // Update the status element for the deportivo
        exibirStatusEsportivo();
    }
}

function desligarCarroEsportivo() {
    if (carroEsportivo) {
        carroEsportivo.desligar();
        carroEsportivo.atualizarStatus(); // Update the status element for the deportivo
        exibirStatusEsportivo();
    }
}

function acelerarCarroEsportivo() {
    if (carroEsportivo) {
        carroEsportivo.acelerar(10);
        carroEsportivo.atualizarVelocidade(); // Update the velocity element for the deportivo
        exibirStatusEsportivo();
    }
}

function frearCarroEsportivo() {
    if (carroEsportivo) {
        carroEsportivo.frear(10);
        carroEsportivo.atualizarVelocidade(); // Update the velocity element for the deportivo
        exibirStatusEsportivo();
    }
}

function ativarTurbo() {
    if (carroEsportivo) {
        carroEsportivo.ativarTurbo();
        carroEsportivo.atualizarVelocidade(); // Update the velocity element for the deportivo
        exibirStatusEsportivo();
    }
}

function desativarTurbo() {
    if (carroEsportivo) {
        carroEsportivo.desativarTurbo();
        exibirStatusEsportivo();
    }
}

// Funções para interagir com o Caminhão
function ligarCaminhao() {
    if (caminhao) {
        caminhao.ligar();
        caminhao.atualizarStatus();
        exibirStatusCaminhao();
    }
}

function desligarCaminhao() {
    if (caminhao) {
        caminhao.desligar();
        caminhao.atualizarStatus();
        exibirStatusCaminhao();
    }
}

function acelerarCaminhao() {
    if (caminhao) {
        caminhao.acelerar(5);
        caminhao.atualizarVelocidade();
        exibirStatusCaminhao();
    }
}

function frearCaminhao() {
    if (caminhao) {
        caminhao.frear(5);
        caminhao.atualizarVelocidade();
        exibirStatusCaminhao();
    }
}

function carregarCaminhao() {
    if (caminhao) {
        const peso = parseInt(document.getElementById("pesoCarga").value);
        const resultado = caminhao.carregar(peso);
        alert(resultado); // Exibe o resultado do carregamento
        exibirStatusCaminhao();
    }
}

function descarregarCaminhao() {
    if (caminhao) {
        const peso = parseInt(document.getElementById("pesoCarga").value);
        const resultado = caminhao.descarregar(peso);
        alert(resultado); // Exibe o resultado do descarregamento
        exibirStatusCaminhao();
    }
}

// Funções para exibir o status dos objetos
function exibirStatusEsportivo() {
    if (carroEsportivo) {
        document.getElementById("statusEsportivo").textContent = carroEsportivo.exibirStatus();
    }
}

function exibirStatusCaminhao() {
    if (caminhao) {
        document.getElementById("statusCaminhao").textContent = caminhao.exibirStatus();
    }
}