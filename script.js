const ARMAZENAMENTO = "dados_time";

let jogadores = [];
let time = { vitorias: 0, derrotas: 0 };

const output = document.getElementById("output");
const input = document.getElementById("cmd-input");

function imprimir(texto = "") {
    output.textContent += texto + "\n";
    output.scrollTop = output.scrollHeight;
}

function salvarDados() {
    const dados = { jogadores, time };
    localStorage.setItem(ARMAZENAMENTO, JSON.stringify(dados));
}

function carregarDados() {
    const bruto = localStorage.getItem(ARMAZENAMENTO);
    if (bruto) {
        const dados = JSON.parse(bruto);
        jogadores = dados.jogadores || [];
        time = dados.time || { vitorias: 0, derrotas: 0 };
    } else {
        jogadores = [];
        time = { vitorias: 0, derrotas: 0 };
    }
}

// ---- Máquina de estados para simular input() sequencial no navegador ----
// Cada fluxo (adicionar jogador, editar gols, etc.) é uma lista de passos.
// Cada passo pergunta algo e guarda a resposta até o fluxo terminar.

let fluxoAtual = null; // { passos: [...], indice: 0, respostas: {} }

function iniciarFluxo(passos, aoFinalizar) {
    fluxoAtual = { passos, indice: 0, respostas: {}, aoFinalizar };
    perguntarProximoPasso();
}

function perguntarProximoPasso() {
    const passo = fluxoAtual.passos[fluxoAtual.indice];
    imprimir(passo.texto);
}

function validarInteiro(valor) {
    const numero = parseInt(valor, 10);
    return Number.isNaN(numero) ? null : numero;
}

function processarRespostaFluxo(valor) {
    const passo = fluxoAtual.passos[fluxoAtual.indice];

    if (passo.tipo === "int") {
        const numero = validarInteiro(valor);
        if (numero === null) {
            imprimir("Valor inválido, digite um número inteiro.");
            perguntarProximoPasso(); // repete a mesma pergunta
            return;
        }
        fluxoAtual.respostas[passo.chave] = numero;
    } else {
        fluxoAtual.respostas[passo.chave] = valor;
    }

    fluxoAtual.indice++;

    if (fluxoAtual.indice < fluxoAtual.passos.length) {
        perguntarProximoPasso();
    } else {
        const respostas = fluxoAtual.respostas;
        const callback = fluxoAtual.aoFinalizar;
        fluxoAtual = null;
        callback(respostas);
        mostrarMenu();
    }
}

// ---- Ações equivalentes às funções do JS/Python original ----

function addJogador() {
    iniciarFluxo(
        [
            { chave: "nome", texto: "Digite o nome do jogador: ", tipo: "texto" },
            { chave: "camisa", texto: "Digite o número da camisa do jogador: ", tipo: "int" },
            { chave: "posicao", texto: "Digite a posição do jogador: ", tipo: "texto" }
        ],
        (r) => {
            jogadores.push({ nome: r.nome, camisa: r.camisa, posicao: r.posicao, gols: 0 });
            imprimir("Jogador adicionado com sucesso");
            salvarDados();
        }
    );
}

function removerJogador() {
    iniciarFluxo(
        [{ chave: "camisa", texto: "Digite o número da camisa do jogador a ser removido: ", tipo: "int" }],
        (r) => {
            const index = jogadores.findIndex((j) => j.camisa === r.camisa);
            if (index !== -1) {
                const [removido] = jogadores.splice(index, 1);
                imprimir(`Jogador ${removido.nome} removido com sucesso`);
                salvarDados();
            } else {
                imprimir("Jogador não encontrado");
            }
        }
    );
}

function mostrarTime() {
    imprimir("\n--- Informações do Time ---");
    imprimir(`Vitórias: ${time.vitorias}`);
    imprimir(`Derrotas: ${time.derrotas}`);
    imprimir(`Total de jogadores: ${jogadores.length}`);
}

function editarResultado() {
    imprimir("1 - Registrar vitória");
    imprimir("2 - Registrar derrota");
    iniciarFluxo(
        [{ chave: "opcao", texto: "Escolha: ", tipo: "texto" }],
        (r) => {
            if (r.opcao === "1") {
                time.vitorias += 1;
                imprimir("Vitória registrada!");
            } else if (r.opcao === "2") {
                time.derrotas += 1;
                imprimir("Derrota registrada!");
            } else {
                imprimir("Opção inválida");
                return;
            }
            salvarDados();
        }
    );
}

function listarJogadores() {
    if (jogadores.length === 0) {
        imprimir("Nenhum jogador cadastrado.");
        return;
    }
    imprimir("\n--- Lista de Jogadores ---");
    for (const jogador of jogadores) {
        imprimir(
            `Nome: ${jogador.nome} | Camisa: ${jogador.camisa} | Posição: ${jogador.posicao} | Gols: ${jogador.gols}`
        );
    }
}

function editarGols() {
    iniciarFluxo(
        [{ chave: "camisa", texto: "Digite o número da camisa do jogador: ", tipo: "int" }],
        (r) => {
            const jogador = jogadores.find((j) => j.camisa === r.camisa);
            if (!jogador) {
                imprimir("Jogador não encontrado");
                return;
            }
            iniciarFluxo(
                [{ chave: "gols", texto: "Quantos gols marcar? ", tipo: "int" }],
                (r2) => {
                    jogador.gols = r2.gols;
                    imprimir(`Gols atualizados! ${jogador.nome} agora tem ${jogador.gols} gols.`);
                    salvarDados();
                }
            );
        }
    );
}

// ---- Menu principal ----

function mostrarMenu() {
    imprimir("\n===== MENU =====");
    imprimir("1 - Adicionar jogador");
    imprimir("2 - Remover jogador");
    imprimir("3 - Listar jogadores");
    imprimir("4 - Editar gols de um jogador");
    imprimir("5 - Ver informações do time");
    imprimir("6 - Registrar vitória/derrota");
    imprimir("0 - Sair");
    imprimir("Escolha uma opção:");
}

function processarOpcaoMenu(opcao) {
    switch (opcao) {
        case "1":
            addJogador();
            break;
        case "2":
            removerJogador();
            break;
        case "3":
            listarJogadores();
            mostrarMenu();
            break;
        case "4":
            editarGols();
            break;
        case "5":
            mostrarTime();
            mostrarMenu();
            break;
        case "6":
            editarResultado();
            break;
        case "0":
            imprimir("Saindo do programa...");
            input.disabled = true;
            break;
        default:
            imprimir("Opção inválida, tente novamente.");
            mostrarMenu();
    }
}

// ---- Loop de entrada do "terminal" ----

input.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
        const valor = input.value;
        input.value = "";
        imprimir("> " + valor);

        if (fluxoAtual) {
            processarRespostaFluxo(valor);
        } else {
            processarOpcaoMenu(valor);
        }
    }
});

// ---- Início ----
carregarDados();
mostrarMenu();