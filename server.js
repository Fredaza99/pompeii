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






    socket.on("shoot", (data) => {
        let player = players[socket.id];
        let target = players[data.targetId];

        if (!player || !target) return;

        let now = Date.now();
        if (now - (player.lastShot || 0) < FIRE_RATE) {
            return;
        }

        // 🔥 Calcula a distância entre o jogador e o inimigo
        let dx = target.x - player.x;
        let dy = target.y - player.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > ATTACK_RANGE) { // 🔥 Se o inimigo estiver muito longe, cancela o ataque
            return;
        }

        player.lastShot = now;

        let angle = Math.atan2(dy, dx);

        // 🔥 Aplica dano único ao alvo
        target.health -= DAMAGE;

        io.emit("updateHealth", { target: data.targetId, health: target.health });

        // 🔥 Se o alvo morreu, ele é respawnado
        if (target.health <= 0) {
            target.health = 100;
            target.x = Math.random() * 800;
            target.y = Math.random() * 600;
            io.emit("updatePlayer", { id: data.targetId, ...target }); // 🔥 Atualiza a posição e vida do jogador morto
        }

        // 🔥 Disparo de múltiplos projéteis
        let initialX = player.x;
        let initialY = player.y;
        let speed = 2;

        let velocityX = Math.cos(angle) * speed;
        let velocityY = Math.sin(angle) * speed;

        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                let projectile = {
                    id: socket.id,
                    x: initialX,
                    y: initialY,
                    angle: angle,
                    velocityX: velocityX,
                    velocityY: velocityY,
                    speed: speed,
                    createdAt: Date.now(),
                    targetId: data.targetId // Associa ao alvo para animação de impacto
                };
                projectiles.push(projectile);
                io.emit("newProjectile", projectile);
            }, i * 50);
        }

        setInterval(() => {
            projectiles.forEach((p, index) => {
                if (!p) return;

                // 🔥 Agora, o projétil mantém a velocidade original, sem recalcular a cada frame
                p.x += p.velocityX;
                p.y += p.velocityY;

                // 🔥 Verifica colisão com o alvo
                let target = players[p.targetId];
                if (target) {
                    let dx = target.x - p.x;
                    let dy = target.y - p.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 20) { // Se o projétil atingir o alvo
                        io.emit("impact", { x: p.x, y: p.y });
                        projectiles.splice(index, 1);
                    }
                }

                // 🔥 Remove projéteis após 2 segundos para evitar acúmulo
                if (Date.now() - p.createdAt > 2000) {
                    projectiles.splice(index, 1);
                }
            });

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
});

