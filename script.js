class Carro {
    constructor(modelo, cor) {
      this.modelo = modelo;
      this.cor = cor;
      this.velocidade = 0;
      this.ligado = false;
      this.somLigando = new Audio("mp3/ligando.mp3"); // Carrega o som
      this.somAcelerando = new Audio("mp3/acelerando.mp3")
      this.somAcelerando.loop = true;
      this.somAcelerando.volume = 1;
    }
  
    ligar() {
      if (!this.ligado) {
        this.ligado = true;
        this.somLigando.play(); // Toca o som ao ligar
        this.atualizarStatus();
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
  
    atualizarVelocidade() {
      document.getElementById("velocidade").textContent = `Velocidade: ${this.velocidade} km/h`;
    }
  
    atualizarStatus() {
      const statusElement = document.getElementById("status");
      statusElement.textContent = `Status: ${this.ligado ? "Ligado" : "Desligado"}`;
    }
  }
  
  // Criar uma instância do carro
  const meuCarro = new Carro("Sedan", "Prata");
  
  // Adicionar eventos aos botões
  document.getElementById("ligarBtn").addEventListener("click", () => meuCarro.ligar());
  document.getElementById("desligarBtn").addEventListener("click", () => meuCarro.desligar());
  document.getElementById("acelerarBtn").addEventListener("click", () => meuCarro.acelerar(10));