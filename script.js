// script.js - With Sound Effects

// --- Base Class ---
class Carro {
    constructor(modelo, cor) {
        if (!modelo || !cor) {
            throw new Error("Modelo e Cor são obrigatórios para criar um Carro.");
        }
        this.modelo = modelo;
        this.cor = cor;
        this.velocidade = 0;
        this.ligado = false;

        // --- Initialize Audio Objects ---
        try {
            // Important: Make sure the paths and filenames are correct!
            this.somLigar = new Audio('sounds/engine_start.mp3');
            this.somDesligar = new Audio('sounds/engine_stop.mp3');
            this.somAcelerar = new Audio('sounds/engine_running.mp3');
            this.somFrear = new Audio('sounds/brake_sound.mp3'); // Or a skid sound
            this.somBuzinar = new Audio('sounds/horn.mp3');

            // Configure looping sound for acceleration/engine running
            this.somAcelerar.loop = true;
            this.somAcelerar.volume = 0.7; // Adjust volume as needed

            // Preload sounds slightly (optional, might improve responsiveness)
            this.somLigar.preload = 'auto';
            this.somDesligar.preload = 'auto';
            this.somAcelerar.preload = 'auto';
            this.somFrear.preload = 'auto';
            this.somBuzinar.preload = 'auto';

        } catch (error) {
            console.error("Erro ao carregar sons:", error);
            alert("Não foi possível carregar os arquivos de som. Verifique o console e os nomes/caminhos dos arquivos.");
            // Disable sound functionality if loading fails
            this.somLigar = this.somDesligar = this.somAcelerar = this.somFrear = this.somBuzinar = { play: ()=>{}, pause: ()=>{}, loop: false, currentTime: 0 }; // Dummy objects
        }
    }

    // --- Utility to stop all sounds ---
    pararTodosOsSons() {
        this.somLigar.pause();
        this.somDesligar.pause();
        this.somAcelerar.pause();
        this.somFrear.pause();
        this.somBuzinar.pause();
        // Reset time for one-shot sounds if needed
        // this.somLigar.currentTime = 0;
        // this.somDesligar.currentTime = 0;
        // this.somFrear.currentTime = 0;
        // this.somBuzinar.currentTime = 0;
    }

    ligar() {
        if (!this.ligado) {
            this.ligado = true;
            this.pararTodosOsSons(); // Stop any lingering sounds
            this.somLigar.currentTime = 0; // Reset to start
            this.somLigar.play().catch(e => console.error("Erro ao tocar som Ligar:", e));

            // Maybe start idle sound after starting sound finishes?
            // setTimeout(() => {
            //     if (this.ligado) this.somAcelerar.play().catch(e => console.error("Erro ao tocar som Acelerar (idle):", e));
            // }, 1500); // Adjust delay based on start sound length

            console.log(`${this.constructor.name} ${this.modelo} ligado!`);
            this.atualizarStatus();
            this.atualizarVelocidade();
        } else {
            console.log(`O ${this.constructor.name} ${this.modelo} já está ligado.`);
            alert(`O ${this.constructor.name} ${this.modelo} já está ligado.`);
        }
    }

    desligar() {
        if (this.ligado) {
            if (this.velocidade > 0) {
                 console.log(`Não pode desligar o ${this.constructor.name} ${this.modelo} em movimento.`);
                 alert(`Não pode desligar o ${this.constructor.name} ${this.modelo} em movimento.`);
                 return;
            }
            this.ligado = false;
            this.velocidade = 0;

            this.pararTodosOsSons(); // Stop all sounds first
            this.somDesligar.currentTime = 0;
            this.somDesligar.play().catch(e => console.error("Erro ao tocar som Desligar:", e));

            console.log(`${this.constructor.name} ${this.modelo} desligado!`);
            this.atualizarStatus();
            this.atualizarVelocidade();
        } else {
            console.log(`O ${this.constructor.name} ${this.modelo} já está desligado.`);
             alert(`O ${this.constructor.name} ${this.modelo} já está desligado.`);
        }
    }

    acelerar(incremento = 10) { // Default incremento
        if (this.ligado) {
            this.velocidade += incremento;
            this.atualizarVelocidade();
            console.log(`Acelerando! Velocidade atual: ${this.velocidade} km/h`);

            // Play engine running sound if not already playing
            if (this.somAcelerar.paused) {
                 this.somAcelerar.play().catch(e => console.error("Erro ao tocar som Acelerar:", e));
            }
            // Stop braking sound if it was playing
            this.somFrear.pause();
            // Optional: Increase volume slightly based on speed?
            // this.somAcelerar.volume = Math.min(1, 0.5 + (this.velocidade / 100));


        } else {
            console.log(`O ${this.constructor.name} ${this.modelo} precisa estar ligado para acelerar.`);
            alert(`O ${this.constructor.name} ${this.modelo} precisa estar ligado para acelerar.`);
        }
    }

    frear(decremento = 10) { // Default decremento
        if (this.ligado) {
             if (this.velocidade > 0) {
                const velocidadeAnterior = this.velocidade;
                this.velocidade -= decremento;
                if (this.velocidade < 0) {
                    this.velocidade = 0;
                }
                this.atualizarVelocidade();
                console.log(`Freando! Velocidade atual: ${this.velocidade} km/h`);

                // Play braking sound (one-shot)
                this.somFrear.currentTime = 0;
                this.somFrear.play().catch(e => console.error("Erro ao tocar som Frear:", e));

                // If stopped, pause the engine running sound
                if (this.velocidade === 0) {
                    this.somAcelerar.pause();
                    this.somAcelerar.currentTime = 0; // Reset engine sound
                     // Optional: Lower volume when stopped but running?
                    // this.somAcelerar.volume = 0.5;
                }

             } else {
                console.log(`${this.constructor.name} ${this.modelo} já está parado.`);
                // Ensure engine sound is paused if somehow still playing while stopped
                if (this.somAcelerar.played && !this.somAcelerar.paused) {
                    this.somAcelerar.pause();
                    this.somAcelerar.currentTime = 0;
                }
             }
        } else {
            console.log(`O ${this.constructor.name} ${this.modelo} está desligado.`);
            alert(`O ${this.constructor.name} ${this.modelo} está desligado.`);
        }
    }

    buzinar() {
        console.log(`${this.constructor.name} ${this.modelo}: Beep beep!`);
        alert(`${this.constructor.name} ${this.modelo}: Beep beep!`); // Keep alert for visual feedback

        // Play horn sound
        this.somBuzinar.currentTime = 0;
        this.somBuzinar.play().catch(e => console.error("Erro ao tocar som Buzinar:", e));
    }

    // --- Methods to be overridden or used by derived classes ---
    // (Keep atualizarVelocidade, atualizarStatus, exibirInformacoes, ativarTurbo, etc. as they were)
    // ... [Rest of the Carro class methods like atualizarVelocidade, exibirInformacoes] ...
     atualizarVelocidade() {
        // Default targets the base car's velocity display
        const el = document.getElementById("velocidade");
        if (el) el.textContent = `Velocidade: ${this.velocidade} km/h`;
    }

    atualizarStatus() {
        // Default targets the base car's status display
        const el = document.getElementById("status");
        if (el) el.textContent = `Status: ${this.ligado ? "Ligado" : "Desligado"}`;
    }

    exibirInformacoes() {
        // Provides a string summary of the object's state
        return `Modelo: ${this.modelo}, Cor: ${this.cor}, Ligado: ${this.ligado ? "Sim" : "Não"}, Velocidade: ${this.velocidade} km/h`;
    }

    ativarTurbo() {
        console.log(`Turbo não disponível para ${this.constructor.name}.`);
        alert(`Turbo não disponível para ${this.constructor.name}.`);
    }

    desativarTurbo() {
        console.log(`Turbo não disponível para ${this.constructor.name}.`);
        alert(`Turbo não disponível para ${this.constructor.name}.`);
    }

     carregar(peso) {
        console.log(`Função Carregar não disponível para ${this.constructor.name}.`);
        alert(`Função Carregar não disponível para ${this.constructor.name}.`);
        return `Função Carregar não disponível para ${this.constructor.name}.`; // Return message
    }

    descarregar(peso) {
        console.log(`Função Descarregar não disponível para ${this.constructor.name}.`);
        alert(`Função Descarregar não disponível para ${this.constructor.name}.`);
        return `Função Descarregar não disponível para ${this.constructor.name}.`; // Return message
    }
}


// --- Derived Class: CarroEsportivo ---
// (No changes needed here unless you want different sounds for it)
class CarroEsportivo extends Carro {
     constructor(modelo, cor) {
        super(modelo, cor); // Calls the Carro constructor, which initializes sounds
        this.turboAtivado = false;
        // Optional: Override specific sounds if desired
        // try {
        //    this.somAcelerar = new Audio('sounds/sport_engine_running.mp3');
        //    this.somAcelerar.loop = true;
        //    // ... other specific sounds ...
        // } catch (error) { console.error("Erro ao carregar sons específicos do Esportivo:", error); }
    }

    // ... [Keep CarroEsportivo methods like ativarTurbo, desativarTurbo, overrides] ...
    ativarTurbo() {
        if (this.ligado) {
            if (!this.turboAtivado) {
                this.turboAtivado = true;
                console.log("Turbo Ativado!");
                alert("Turbo Ativado!");
                // Optional: Play a turbo sound?
                // let turboSound = new Audio('sounds/turbo_whine.mp3');
                // turboSound.play();
                this.acelerar(30);
                 this.atualizarStatus();
            } else {
                console.log("Turbo já está ativado.");
                alert("Turbo já está ativado.");
            }
        } else {
             console.log(`O ${this.constructor.name} ${this.modelo} precisa estar ligado para ativar o turbo.`);
             alert(`O ${this.constructor.name} ${this.modelo} precisa estar ligado para ativar o turbo.`);
        }
    }

    desativarTurbo() {
         if (this.turboAtivado) {
            this.turboAtivado = false;
            console.log("Turbo Desativado!");
            alert("Turbo Desativado!");
            this.atualizarStatus();
         } else {
             console.log("Turbo já está desativado.");
             alert("Turbo já está desativado.");
         }
    }

     acelerar(incremento = 20) { // Faster default acceleration
        if (this.ligado) {
            const boost = this.turboAtivado ? incremento * 1.5 : incremento; // More boost if turbo is on
             this.velocidade += Math.round(boost);
            this.atualizarVelocidade();
            console.log(`Acelerando! Velocidade atual: ${this.velocidade} km/h ${this.turboAtivado ? '(Turbo!)' : ''}`);

            // Play engine running sound if not already playing (inherited)
            if (this.somAcelerar.paused) {
                 this.somAcelerar.play().catch(e => console.error("Erro ao tocar som Acelerar (Esportivo):", e));
            }
            this.somFrear.pause(); // Stop braking sound

        } else {
            console.log(`O ${this.constructor.name} ${this.modelo} precisa estar ligado para acelerar.`);
            alert(`O ${this.constructor.name} ${this.modelo} precisa estar ligado para acelerar.`);
        }
    }

    exibirInformacoes() {
        return `${super.exibirInformacoes()}, Turbo: ${this.turboAtivado ? "Ativado" : "Desativado"}`;
    }

    atualizarVelocidade() {
        const el = document.getElementById("velocidadeEsportivo");
        if (el) el.textContent = `Velocidade: ${this.velocidade} km/h`;
    }

    atualizarStatus() {
        const el = document.getElementById("statusEsportivoStatus");
        if (el) {
            let statusText = `Status do Esportivo: ${this.ligado ? "Ligado" : "Desligado"}`;
            if (this.ligado && this.turboAtivado) {
                statusText += " (Turbo Ativo!)";
            }
            el.textContent = statusText;
        }
    }
}


// --- Derived Class: Caminhao ---
// (No changes needed here unless you want different sounds)
class Caminhao extends Carro {
    constructor(modelo, cor, capacidadeCarga) {
        super(modelo, cor); // Calls the Carro constructor, which initializes sounds
        this.capacidadeCarga = capacidadeCarga || 0;
        this.cargaAtual = 0;
         // Optional: Override specific sounds if desired
        // try {
        //    this.somLigar = new Audio('sounds/truck_start.mp3');
        //    this.somAcelerar = new Audio('sounds/truck_engine.mp3');
        //    this.somAcelerar.loop = true;
        //    this.somBuzinar = new Audio('sounds/truck_horn.mp3');
        //    // ... other specific sounds ...
        // } catch (error) { console.error("Erro ao carregar sons específicos do Caminhão:", error); }
    }

    // ... [Keep Caminhao methods like carregar, descarregar, overrides] ...
     carregar(peso) {
        if (isNaN(peso) || peso <= 0) {
            alert("Por favor, insira um peso válido para carregar.");
            return "Peso inválido.";
        }
        if (this.cargaAtual + peso <= this.capacidadeCarga) {
            this.cargaAtual += peso;
            console.log(`Caminhão carregado com ${peso}kg. Carga atual: ${this.cargaAtual}kg.`);
             // Optional: Play a loading sound?
            // let loadSound = new Audio('sounds/loading.mp3');
            // loadSound.play();
            this.atualizarStatusCarga();
            return "Caminhão carregado com sucesso.";
        } else {
             const overweight = (this.cargaAtual + peso) - this.capacidadeCarga;
             console.log(`Carga excede a capacidade em ${overweight}kg.`);
             alert(`Carga excede a capacidade do caminhão em ${overweight}kg! (Capacidade: ${this.capacidadeCarga}kg, Tentando adicionar: ${peso}kg, Carga Atual: ${this.cargaAtual}kg)`);
             return "Carga excede a capacidade do caminhão.";
        }
    }

    descarregar(peso) {
         if (isNaN(peso) || peso <= 0) {
            alert("Por favor, insira um peso válido para descarregar.");
            return "Peso inválido.";
        }
        if (this.cargaAtual - peso >= 0) {
            this.cargaAtual -= peso;
             console.log(`Caminhão descarregado em ${peso}kg. Carga atual: ${this.cargaAtual}kg.`);
              // Optional: Play an unloading sound?
             // let unloadSound = new Audio('sounds/unloading.mp3');
             // unloadSound.play();
             this.atualizarStatusCarga();
             return "Caminhão descarregado com sucesso.";
        } else {
            console.log(`Não há carga suficiente para descarregar ${peso}kg. Carga atual: ${this.cargaAtual}kg.`);
            alert(`Não há carga suficiente para descarregar ${peso}kg. (Carga Atual: ${this.cargaAtual}kg)`);
            return "Não há carga suficiente para descarregar.";
        }
    }

     acelerar(incremento = 5) { // Slower default acceleration
        if (this.ligado) {
            const fatorCarga = 1 - (this.cargaAtual / (this.capacidadeCarga * 2));
            const accelReal = Math.max(1, Math.round(incremento * fatorCarga));
            this.velocidade += accelReal;
            this.atualizarVelocidade();
            console.log(`Acelerando! Velocidade atual: ${this.velocidade} km/h (Carga: ${this.cargaAtual}kg)`);

             // Play engine running sound if not already playing (inherited)
            if (this.somAcelerar.paused) {
                 this.somAcelerar.play().catch(e => console.error("Erro ao tocar som Acelerar (Caminhão):", e));
            }
            this.somFrear.pause(); // Stop braking sound

        } else {
             console.log(`O ${this.constructor.name} ${this.modelo} precisa estar ligado para acelerar.`);
            alert(`O ${this.constructor.name} ${this.modelo} precisa estar ligado para acelerar.`);
        }
    }

     frear(decremento = 8) { // Slightly less effective default braking
        if (this.ligado) {
             if (this.velocidade > 0) {
                 const fatorCarga = 1 + (this.cargaAtual / (this.capacidadeCarga * 3));
                 const freioReal = Math.round(decremento / fatorCarga);
                  const velocidadeAnterior = this.velocidade; // Store before modification
                 this.velocidade -= Math.max(1, freioReal);
                 if (this.velocidade < 0) {
                    this.velocidade = 0;
                 }
                 this.atualizarVelocidade();
                 console.log(`Freando! Velocidade atual: ${this.velocidade} km/h`);

                 // Play braking sound (one-shot)
                this.somFrear.currentTime = 0;
                this.somFrear.play().catch(e => console.error("Erro ao tocar som Frear (Caminhão):", e));

                // If stopped, pause the engine running sound
                if (this.velocidade === 0) {
                    this.somAcelerar.pause();
                    this.somAcelerar.currentTime = 0;
                }

             } else {
                 console.log(`${this.constructor.name} ${this.modelo} já está parado.`);
                  if (this.somAcelerar.played && !this.somAcelerar.paused) {
                    this.somAcelerar.pause();
                    this.somAcelerar.currentTime = 0;
                  }
             }
        } else {
             console.log(`O ${this.constructor.name} ${this.modelo} está desligado.`);
             alert(`O ${this.constructor.name} ${this.modelo} está desligado.`);
        }
    }


    exibirInformacoes() {
        return `${super.exibirInformacoes()}, Capacidade: ${this.capacidadeCarga}kg, Carga Atual: ${this.cargaAtual}kg`;
    }

    atualizarVelocidade() {
        const el = document.getElementById("velocidadeCaminhao");
        if(el) el.textContent = `Velocidade: ${this.velocidade} km/h`;
    }

    atualizarStatus() {
        const el = document.getElementById("statusCaminhaoStatus");
        if (el) el.textContent = `Status do Caminhão: ${this.ligado ? "Ligado" : "Desligado"}`;
    }

    atualizarStatusCarga() {
        const el = document.getElementById("statusCaminhaoCarga");
        if (el) el.textContent = `Carga: ${this.cargaAtual} / ${this.capacidadeCarga} kg`;
    }
}

// --- Global Variables ---
let meuCarro;
let carroEsportivo;
let caminhao;

// --- Creation Functions ---
// (Keep criarCarroBase, criarCarroEsportivo, criarCaminhao as they were)
// ... [Creation functions - no changes needed] ...
function criarCarroBase() {
    const modelo = document.getElementById("modeloBase").value.trim();
    const cor = document.getElementById("corBase").value.trim();
    if (!modelo || !cor) {
        alert("Por favor, insira o Modelo e a Cor do Carro Base.");
        return;
    }
    meuCarro = new Carro(modelo, cor);
    console.log("Carro Base criado:", meuCarro);
    meuCarro.atualizarStatus(); // Update status display
    meuCarro.atualizarVelocidade(); // Update velocity display
    exibirInformacoesCarroBase(); // Update detailed info display
}

function criarCarroEsportivo() {
    const modelo = document.getElementById("modeloEsportivo").value.trim();
    const cor = document.getElementById("corEsportivo").value.trim();
     if (!modelo || !cor) {
        alert("Por favor, insira o Modelo e a Cor do Carro Esportivo.");
        return;
    }
    carroEsportivo = new CarroEsportivo(modelo, cor);
    console.log("Carro Esportivo criado:", carroEsportivo);
    carroEsportivo.atualizarStatus(); // Update status display
    carroEsportivo.atualizarVelocidade(); // Update velocity display
    exibirInformacoesCarroEsportivo(); // Update detailed info display
}

function criarCaminhao() {
    const modelo = document.getElementById("modeloCaminhao").value.trim();
    const cor = document.getElementById("corCaminhao").value.trim();
    const capacidadeInput = document.getElementById("capacidadeCarga");
    const capacidadeCarga = parseInt(capacidadeInput.value, 10);

     if (!modelo || !cor) {
        alert("Por favor, insira o Modelo e a Cor do Caminhão.");
        return;
    }
     if (isNaN(capacidadeCarga) || capacidadeCarga <= 0) {
        alert("Por favor, insira uma Capacidade de Carga válida (número positivo).");
        capacidadeInput.focus(); // Focus the input for correction
        return;
     }

    caminhao = new Caminhao(modelo, cor, capacidadeCarga);
    console.log("Caminhão criado:", caminhao);
    caminhao.atualizarStatus(); // Update status display
    caminhao.atualizarVelocidade(); // Update velocity display
    caminhao.atualizarStatusCarga(); // Update load display
    exibirInformacoesCaminhao(); // Update detailed info display
}

// --- Display Functions for Detailed Info ---
// (Keep exibirInformacoesCarroBase, etc. as they were)
// ... [Display functions - no changes needed] ...
function exibirInformacoesCarroBase() {
    const el = document.getElementById("informacoesCarroBase");
    if (el) {
        el.textContent = meuCarro ? meuCarro.exibirInformacoes() : "Carro Base não criado.";
    }
}

function exibirInformacoesCarroEsportivo() {
     const el = document.getElementById("informacoesCarroEsportivo");
    if (el) {
        el.textContent = carroEsportivo ? carroEsportivo.exibirInformacoes() : "Carro Esportivo não criado.";
    }
}

function exibirInformacoesCaminhao() {
    const el = document.getElementById("informacoesCaminhao");
    if (el) {
         el.textContent = caminhao ? caminhao.exibirInformacoes() : "Caminhão não criado.";
    }
}


// --- Polymorphic Interaction Function ---
// (Keep interagir as it was - it calls the methods which now handle sound)
// ... [interagir function - no changes needed] ...
function interagir(veiculo, acao) {
    // 1. Check if the vehicle object exists
    if (!veiculo) {
        alert("Erro: O veículo ainda não foi criado! Crie o veículo primeiro.");
        console.error("Tentativa de interagir com veículo indefinido.");
        return; // Stop execution if vehicle doesn't exist
    }

     // 2. Log the interaction attempt
     console.log(`Interagindo com ${veiculo.constructor.name} (${veiculo.modelo}): Ação = ${acao}`);

    // 3. Perform the action using a switch statement
    let resultadoAcao = ""; // To store results from actions like load/unload
    try { // Wrap in try...catch for unexpected errors in vehicle methods
        switch (acao) {
            case "ligar":
                veiculo.ligar();
                break;
            case "desligar":
                veiculo.desligar();
                break;
            case "acelerar":
                veiculo.acelerar(); // Use default increment or specific logic within the method
                break;
            case "frear":
                veiculo.frear(); // Use default decrement or specific logic within the method
                break;
            case "buzinar": // Added Buzinar action
                veiculo.buzinar();
                break;
            case "ativarTurbo":
                veiculo.ativarTurbo();
                break;
            case "desativarTurbo":
                veiculo.desativarTurbo();
                break;
            case "carregar":
                if (veiculo instanceof Caminhao) {
                    const pesoInput = document.getElementById("pesoCarga");
                    const peso = parseInt(pesoInput.value, 10);
                     if (!isNaN(peso)) {
                         resultadoAcao = veiculo.carregar(peso);
                     } else {
                        alert("Por favor, insira um peso válido para carregar.");
                     }
                     pesoInput.value = "";
                } else {
                    veiculo.carregar(0);
                }
                break;
            case "descarregar":
                 if (veiculo instanceof Caminhao) {
                     const pesoInput = document.getElementById("pesoCarga");
                     const peso = parseInt(pesoInput.value, 10);
                      if (!isNaN(peso)) {
                          resultadoAcao = veiculo.descarregar(peso);
                      } else {
                          alert("Por favor, insira um peso válido para descarregar.");
                      }
                      pesoInput.value = "";
                 } else {
                     veiculo.descarregar(0);
                 }
                break;
            default:
                console.warn(`Ação desconhecida: ${acao}`);
                alert(`Ação desconhecida: ${acao}`);
        }
    } catch (error) {
         console.error(`Erro durante a ação '${acao}' no veículo ${veiculo.modelo}:`, error);
         alert(`Ocorreu um erro inesperado ao tentar realizar a ação '${acao}'. Verifique o console.`);
    }

    // 4. Update the detailed information display
    if (veiculo === meuCarro) {
        exibirInformacoesCarroBase();
    } else if (veiculo === carroEsportivo) {
        exibirInformacoesCarroEsportivo();
    } else if (veiculo === caminhao) {
        exibirInformacoesCaminhao();
    }
}