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
        io.emit("cannonFired", data); 
    });

    socket.on("move", (data) => {
        if (players[data.id]) {
            players[data.id].x = data.x;
            players[data.id].y = data.y;
            io.emit("playerMoved", { id: data.id, x: data.x, y: data.y });
        }
    });


    socket.on("attack", (data) => {
        let { attacker, target } = data;

        if (players[attacker] && players[target]) {
            let attackerX = players[attacker].x;
            let attackerY = players[attacker].y;
            let targetX = players[target].x;
            let targetY = players[target].y;

            let distance = Math.sqrt((targetX - attackerX) ** 2 + (targetY - attackerY) ** 2);

            // 🔥 Verifica se o alvo está dentro do alcance
            if (distance > attackRange) {
                console.log(`🚫 ${attacker} tentou atacar ${target}, mas estava muito longe!`);
                return;
            }

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
