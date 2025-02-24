const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const ATTACK_RANGE = 400; // Distância máxima para atacar
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
        health: 100 // 🔥 Adiciona vida ao jogador
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




    // 🔥 Função para verificar se o alvo está dentro do alcance
function isTargetInRange(attacker, target) {
    let dx = target.x - attacker.x;
    let dy = target.y - attacker.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= ATTACK_RANGE; // 🔥 Retorna true se estiver dentro do alcance
}

    socket.on("shoot", (data) => {
        let player = players[socket.id];
        let target = players[data.targetId];

        if (!player || !target) return;

        let now = Date.now();
        if (now - (player.lastShot || 0) < FIRE_RATE) return;

        player.lastShot = now;

        let dx = target.x - player.x;
        let dy = target.y - player.y;

        console.log(`💥 ${socket.id} disparou contra ${data.targetId}`);

        let initialX = player.x;
        let initialY = player.y;

        if (distance > ATTACK_RANGE) {
            console.log(`🚫 ${socket.id} tentou atacar ${data.targetId}, mas estava fora do alcance!`);
            return;
        }

        player.lastShot = now;
        console.log(`💥 ${socket.id} disparou contra ${data.targetId}`);

        // 🔥 Aplica dano ao alvo
        target.health -= DAMAGE;
        console.log(`🩸 Vida do jogador ${data.targetId} agora é ${target.health}`);
        io.emit("updateHealth", { target: data.targetId, health: target.health });

        // 🔥 Se o alvo morreu, ele é respawnado
        if (target.health <= 0) {
            console.log(`💀 ${data.targetId} foi destruído! Respawnando...`);
            target.health = 100;
            target.x = Math.random() * 800;
            target.y = Math.random() * 600;
            io.emit("updatePlayer", { id: data.targetId, ...target });
        }

        // 🔥 Cálculo de velocidade fixa para evitar bug de aceleração
        let speed = 5; // 🔥 Velocidade fixa
        let angle = Math.atan2(dy, dx);
        let velocityX = Math.cos(angle) * 5;
        let velocityY = Math.sin(angle) * 5;
        let offset = 20; // Distância inicial do projétil em relação ao atacante
        let startX = player.x + Math.cos(angle) * offset;
        let startY = player.y + Math.sin(angle) * offset;

        // 🔥 Disparo de múltiplos projéteis
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {

                let projectile = {
                    id: socket.id,
                    x: startX,  // 🔥 Agora nasce um pouco mais longe
                    y: startY,
                    velocityX: velocityX,
                    velocityY: velocityY,
                    angle: angle, // 🔥 Adicionando ângulo para o cliente
                    createdAt: Date.now(),
                    targetId: data.targetId
                };
                projectiles.push(projectile);
                io.emit("newProjectile", projectile);
            }, i * 50);
        }

    // 🔥 Atualiza a posição dos projéteis no servidor
    setInterval(() => {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            let p = projectiles[i];
            if (!p) continue;

            p.x += p.velocityX;
            p.y += p.velocityY;

            let target = players[p.targetId];
            if (target) {
                let dx = target.x - p.x;
                let dy = target.y - p.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 10) { // 🔥 Se atingir o alvo, remove o projétil
                    console.log(`💥 Projétil atingiu ${p.targetId}, removendo.`);
                    io.emit("impact", { x: p.x, y: p.y });
                    projectiles.splice(i, 1);
                }
            }

            // 🔥 Remove projéteis antigos após 2 segundos
            if (Date.now() - p.createdAt > 2000) {
                projectiles.splice(i, 1);
            }
        }

        io.emit("updateProjectiles", projectiles);
    }, 50);








        // 🔥 Atualiza o alvo para todos os clientes
        io.emit("updatePlayer", { id: data.targetId, ...target });
        console.log(`📡 Enviando updatePlayer para ${data.targetId}:`, target);
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

