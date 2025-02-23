const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const ATTACK_RANGE = 200; // Distância máxima para atacar
const FIRE_RATE = 1000; // Tempo de recarga (1 segundo)
const DAMAGE = 10; // Dano por tiro

const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos (index.html, imagens, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Rota padrão para carregar o jogo
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

let players = {};
let projectiles = [];

io.on("connection", (socket) => {
    console.log(`Novo jogador conectado: ${socket.id}`);

    players[socket.id] = {
        x: Math.random() * 800,
        y: Math.random() * 600,
        angle: 0,
    };

    socket.emit("currentPlayers", players);
    socket.emit("setInitialPosition", players[socket.id]); // 🔥 Envia spawn correto

    socket.broadcast.emit("newPlayer", { id: socket.id, ...players[socket.id] });

    socket.on("updatePlayerFrame", (data) => {
        if (players[data.id]) {
            players[data.id].frameIndex = data.frameIndex;
            io.emit("updatePlayer", players[data.id]); // Envia a atualização para todos
        }
    });

    socket.on("move", (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].angle = data.angle;
            players[socket.id].frameIndex = data.frameIndex; // 🔥 Salvar frameIndex no servidor
            io.emit("updatePlayer", { id: socket.id, ...players[socket.id] });
        }
    });




    socket.on("shoot", (data) => {
        let player = players[socket.id];
        let target = players[data.targetId];

        if (!player || !target) {
            console.log(`❌ Erro: Atacante ou alvo inválido!`);
            return;
        }

        let now = Date.now();
        if (now - player.lastShot < FIRE_RATE) {
            console.log(`⏳ ${socket.id} tentou atirar, mas está no cooldown!`);
            return;
        }

        let dx = target.x - player.x;
        let dy = target.y - player.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        console.log(`🎯 ${socket.id} atacando ${data.targetId} a uma distância de ${distance}px`);

        if (distance > ATTACK_RANGE) {
            console.log(`🚫 ${socket.id} tentou atacar ${data.targetId}, mas estava fora do alcance!`);
            return;
        }

        console.log(`💥 Ataque confirmado! ${socket.id} acertou ${data.targetId}`);

        player.lastShot = now;
        target.health -= DAMAGE;

        io.emit("updateHealth", { target: data.targetId, health: target.health });

        if (target.health <= 0) {
            console.log(`💀 ${data.targetId} foi destruído!`);
            io.emit("playerDestroyed", data.targetId);
            target.health = 100;
            target.x = Math.random() * 800;
            target.y = Math.random() * 600;
        }


        io.emit("updatePlayer", { id: data.targetId, ...target });
    });

    socket.on("updateHealth", (data) => {
        if (ships[data.target]) {
            ships[data.target].health = data.health; // Atualiza a vida do jogador no cliente
            console.log(`🩸 Vida do jogador ${data.target} agora é ${data.health}%`);
        } else {
            console.log(`⚠️ Erro: Não foi possível atualizar a vida do jogador ${data.target}`);
        }
    });



    socket.on("disconnect", () => {
        console.log(`Jogador desconectado: ${socket.id}`);
        delete players[socket.id];
        io.emit("removePlayer", socket.id);
    });
});

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});

