// script.js
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
      if (!this.modelo || !this.cor) {
        // add this
        console.log("carro base is not yet initialized");
        return;
      }
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
      if (!this.modelo || !this.cor) {
        // add this
        console.log("carro base is not yet initialized");
        return;
      }
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
      if (!this.modelo || !this.cor) {
        // add this
        console.log("carro base is not yet initialized");
        return;
      }
      if (this.ligado) {
        this.velocidade += incremento;
        this.atualizarVelocidade();
        console.log(`Acelerando! Velocidade atual: ${this.velocidade} km/h`);
      } else {
        console.log("O carro precisa estar ligado para acelerar.");
      }
    }
  
    frear(decremento) {
      if (!this.modelo || !this.cor) {
        // add this
        console.log("carro base is not yet initialized");
        return;
      }
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
      // Implementação padrão, pode ser sobreescrita nas subclasses.
      document.getElementById("velocidade").textContent = `Velocidade: ${this.velocidade} km/h`;
    }
  
    atualizarStatus() {
      const statusElement = document.getElementById("status");
      statusElement.textContent = `Status: ${this.ligado ? "Ligado" : "Desligado"}`;
    }
  
    exibirInformacoes() {
      return `Modelo: ${this.modelo}, Cor: ${this.cor}, Ligado: ${this.ligado}, Velocidade: ${this.velocidade}`;
    }
  
    buzinar() {
      console.log("Beep beep!");
      // Add optional audio playing here.
    }
  
    ativarTurbo() {
      // Base class implementation does nothing.
      console.log("Turbo não disponível.");
    }
  
    desativarTurbo() {
      // Base class implementation does nothing.
      console.log("Turbo não disponível.");
    }
  
    carregar(peso) {
      console.log("Carregar não disponível.");
      return "Carregar não disponível.";
    }
  
    descarregar(peso) {
      console.log("Descarregar não disponível.");
      return "Descarregar não disponível.";
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
  
    exibirInformacoes() {
      return `${super.exibirInformacoes()}, Turbo: ${this.turboAtivado ? "Ativado" : "Desativado"}`;
    }
  
    atualizarVelocidade() {
      // Override necessário para atualizar a velocidade DO CARRO ESPORTIVO no HTML
      const velocidadeElement = document.getElementById("velocidadeEsportivo");
      if (velocidadeElement) {
        velocidadeElement.textContent = `Velocidade: ${this.velocidade} km/h`;
      }
    }
  
    atualizarStatus() {
      // Override necessário para atualizar o status DO CARRO ESPORTIVO no HTML
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
  
    exibirInformacoes() {
      return `${super.exibirInformacoes()}, Carga: ${this.cargaAtual}/${this.capacidadeCarga}`;
    }
  
    atualizarVelocidade() {
      // Override necessário para atualizar a velocidade DO CAMINHÃO no HTML
      document.getElementById("velocidadeCaminhao").textContent = `Velocidade: ${this.velocidade} km/h`;
    }
  
    atualizarStatus() {
      // Override necessário para atualizar o status DO CAMINHÃO no HTML
      const statusElement = document.getElementById("statusCaminhaoStatus"); // Assumindo que você tenha um elemento HTML específico para o status do caminhão
      statusElement.textContent = `Status do Caminhão: ${this.ligado ? "Ligado" : "Desligado"}`;
    }
  
    atualizarStatusCarga() {
      const cargaElement = document.getElementById("statusCaminhaoCarga"); // Elemento para exibir a carga atual
      cargaElement.textContent = `Carga: ${this.cargaAtual}/${this.capacidadeCarga}`;
    }
  }
  
  // Variáveis globais para armazenar os objetos
  let meuCarro; // Instância do carro base
  let carroEsportivo;
  let caminhao;
  
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
  
  // Funções para o polimorfismo
  
  function exibirInformacoesCarroBase() {
    if (meuCarro) {
      document.getElementById("informacoesCarroBase").textContent = meuCarro.exibirInformacoes();
    } else {
      document.getElementById("informacoesCarroBase").textContent = "Carro Base não criado.";
    }
  }
  
  function exibirInformacoesCarroEsportivo() {
    if (carroEsportivo) {
      document.getElementById("informacoesCarroEsportivo").textContent = carroEsportivo.exibirInformacoes();
    } else {
      document.getElementById("informacoesCarroEsportivo").textContent = "Carro Esportivo não criado.";
    }
  }
  
  function exibirInformacoesCaminhao() {
    if (caminhao) {
      document.getElementById("informacoesCaminhao").textContent = caminhao.exibirInformacoes();
    } else {
      document.getElementById("informacoesCaminhao").textContent = "Caminhão não criado.";
    }
  }
  
  // Função Genérica para Interagir com Veículos
  function interagir(veiculo, acao) {
    if (!veiculo) {
      alert("Veículo não criado!"); // Or display a message in the error div.
      return;
    }
  
    switch (acao) {
      case "ligar":
        veiculo.ligar();
        break;
      case "desligar":
        veiculo.desligar();
        break;
      case "acelerar":
        veiculo.acelerar(10);
        break;
      case "frear":
        veiculo.frear(10);
        break;
      case "ativarTurbo":
        if (veiculo instanceof CarroEsportivo) {
          veiculo.ativarTurbo();
        } else {
          alert("Turbo não disponível para este veículo.");
        }
        break;
      case "desativarTurbo":
        if (veiculo instanceof CarroEsportivo) {
          veiculo.desativarTurbo();
        } else {
          alert("Turbo não disponível para este veículo.");
        }
        break;
      case "buzinar":
        veiculo.buzinar(); // All vehicle classes should have this method
        break;
      case "carregar":
        if (veiculo instanceof Caminhao) {
          const peso = parseInt(document.getElementById("pesoCarga").value);
          const resultado = veiculo.carregar(peso);
          alert(resultado);
        } else {
          alert("Carregar não disponível para este veículo.");
        }
        break;
      case "descarregar":
        if (veiculo instanceof Caminhao) {
          const peso = parseInt(document.getElementById("pesoCarga").value);
          const resultado = veiculo.descarregar(peso);
          alert(resultado);
        } else {
          alert("Descarregar não disponível para este veículo.");
        }
        break;
      default:
        alert("Ação inválida.");
    }
  
    // Update the display of information after the interaction.
  
    if (veiculo === meuCarro) {
      exibirInformacoesCarroBase();
    } else if (veiculo instanceof CarroEsportivo) {
      exibirInformacoesCarroEsportivo();
      exibirStatusEsportivo(); // Update the deportivo status too
    } else if (veiculo instanceof Caminhao) {
      exibirInformacoesCaminhao();
      exibirStatusCaminhao(); // Update the caminhao status too
    }
  }