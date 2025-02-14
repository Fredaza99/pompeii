const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

let players = {};
let playerHealth = {};
const attackRange = 300; // 🔥 Definição correta do alcance

io.on("connection", (socket) => {
    console.log(`Novo jogador conectado: ${socket.id}`);

    players[socket.id] = { x: Math.random() * 800, y: Math.random() * 600, id: socket.id };
    playerHealth[socket.id] = 100; // 🔥 Cada jogador começa com 100 de vida

    socket.emit("currentPlayers", players);
    io.emit("newPlayer", players[socket.id]);
    
    
    socket.on("attack", (data) => {
        let { attacker, target } = data;

        console.log(`🔥 Servidor recebeu ataque: ${attacker} atacando ${target}`);

        if (!players[attacker] || !players[target]) {
            console.error(`❌ ERRO: Atacante ou alvo inválidos!`);
            return;
        }

        let attackerX = players[attacker].x;
        let attackerY = players[attacker].y;
        let targetX = players[target].x;
        let targetY = players[target].y;

        let distance = Math.sqrt((targetX - attackerX) ** 2 + (targetY - attackerY) ** 2);

        if (distance > attackRange) {
            console.log(`🚫 ${attacker} tentou atacar ${target}, mas estava muito longe!`);
            return;
        }

        if (playerHealth[target] === undefined) {
            console.warn(`⚠️ Vida do jogador ${target} não encontrada! Inicializando com 100.`);
            playerHealth[target] = 100;
        }

        // 🔥 Criar a animação da bala para todos os jogadores
        io.emit("cannonFired", { attacker, target });

        playerHealth[target] -= 10;
        console.log(`💥 ${attacker} atacou ${target}, vida agora: ${playerHealth[target]}%`);

        io.emit("updateHealth", { target, health: playerHealth[target] });

        if (playerHealth[target] <= 0) {
            console.log(`💀 ${target} foi destruído!`);
            io.emit("playerDestroyed", target);
            delete players[target];
            delete playerHealth[target];
        }
    });

    socket.on("pingTest", () => {
        socket.emit("pongTest");
    });



    socket.on("fireCannon", (data) => {
        console.log(`💥 ${data.attacker} disparou contra ${data.target}`);
        io.emit("cannonFired", data);
    });

    socket.on("move", (data) => {
        if (!players[data.id]) return;

        // 🔥 Garante que o servidor só armazene a última posição válida
        players[data.id].x = data.x;
        players[data.id].y = data.y;

        io.emit("playerMoved", { id: data.id, x: data.x, y: data.y });
    });



    socket.on("disconnect", () => {
        console.log(`Jogador desconectado: ${socket.id}`);
        delete players[socket.id];
        delete playerHealth[socket.id];
        io.emit("playerDisconnected", socket.id);
    });
});

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
