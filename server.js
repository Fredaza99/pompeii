const express = require('express'); // 🔥 Adicionando importação do Express
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

// 🔥 Servir arquivos da pasta "public" (onde estará o index.html)
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// 🔥 Rota principal para carregar o jogo
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔥 Armazena os jogadores conectados
let players = {};
let playerHealth = {}; // Armazena a vida dos jogadores


io.on("connection", (socket) => {
    console.log(`Novo jogador conectado: ${socket.id}`);

    players[socket.id] = { x: Math.random() * 800, y: Math.random() * 600, id: socket.id };
    playerHealth[socket.id] = 100; // Cada jogador começa com 100 de vida

    socket.emit("currentPlayers", players);
    io.emit("newPlayer", players[socket.id]);

    socket.on("fireCannon", (data) => {
        console.log(`💥 ${data.attacker} disparou contra ${data.target}`);
        io.emit("cannonFired", data); // 🔥 Envia para TODOS os jogadores
    });

    // 🔥 Processa o ataque recebido
    socket.on("attack", (data) => {
        let { attacker, target } = data;

        if (players[target]) {
            playerHealth[target] -= 10; // Cada tiro causa 10 de dano
            console.log(`🔥 ${attacker} atacou ${target}, vida restante: ${playerHealth[target]}`);

            io.emit("updateHealth", { target, health: playerHealth[target] });

            if (playerHealth[target] <= 0) {
                console.log(`💀 ${target} foi destruído!`);
                io.emit("playerDestroyed", target);
                delete players[target];
                delete playerHealth[target];
            }
        }
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
