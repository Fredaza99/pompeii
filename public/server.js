const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const ATTACK_RANGE = 600; // Distância máxima para atacar
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
    console.log("Jogador conectado, aguardando nome:", socket.id);

    socket.on("setName", (playerName) => {
        if (!playerName) return;

        // 🔥 Cria o jogador SOMENTE após definir um nome
        players[socket.id] = {
            x: Math.random() * 800,
            y: Math.random() * 600,
            angle: 0,
            health: 100,
            name: playerName
        };

        socket.emit("currentPlayers", players);
        socket.emit("setInitialPosition", players[socket.id]);
        socket.broadcast.emit("newPlayer", { id: socket.id, ...players[socket.id] });

        console.log(`Novo jogador conectado: ${playerName} (${socket.id})`);
    });

    socket.on("move", (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].angle = data.angle;
            players[socket.id].frameIndex = data.frameIndex;
            io.emit("updatePlayer", { id: socket.id, ...players[socket.id] });
        }
    });






    socket.on("shoot", (data) => {
        let player = players[socket.id];
        let target = players[data.targetId];

        if (!player || !target) return;

        let now = Date.now();
        if (now - (player.lastShot || 0) < FIRE_RATE) return;

        let dx = target.x - player.x;
        let dy = target.y - player.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > ATTACK_RANGE) return;

        player.lastShot = now;

        let angle = Math.atan2(dy, dx);
        let speed = 1;

        let projectile = {
            id: socket.id,
            startX: player.x,
            startY: player.y,
            targetX: target.x,
            targetY: target.y,
            angle: angle,
            velocityX: Math.cos(angle) * speed,
            velocityY: Math.sin(angle) * speed,
            createdAt: Date.now()
        };

        projectiles.push(projectile);
        io.emit("newProjectile", projectile);

        // 🔥 Simula o impacto após um tempo baseado na velocidade
        setTimeout(() => {
            // 🔥 Garante que o alvo ainda exista antes de calcular o impacto
            if (!players[data.targetId]) {
                console.log(`⚠️ Alvo ${data.targetId} não encontrado, removendo projétil.`);
                projectiles = projectiles.filter(p => p !== projectile);
                io.emit("updateProjectiles", projectiles);
                return;
            }

            let target = players[data.targetId]; // 🔥 Atualiza o alvo para garantir posição correta
            let dxFinal = target.x - projectile.x;
            let dyFinal = target.y - projectile.y;
            let finalDistance = Math.sqrt(dxFinal * dxFinal + dyFinal * dyFinal);

            if (finalDistance < 35) { // 🔥 Ajuste fino da hitbox para impactos mais precisos
                console.log(`💥 Projétil atingiu ${data.targetId}, aplicando ${DAMAGE} de dano.`);

                // 🔥 Aplica dano ao alvo, garantindo que a vida não fique negativa
                target.health = Math.max(target.health - DAMAGE, 0);
                io.emit("updateHealth", { target: data.targetId, health: target.health });

                io.emit("impact", { x: target.x, y: target.y });

                // 🔥 Se o alvo morreu, ele é respawnado
                if (target.health <= 0) {
                    target.health = 100;
                    target.x = Math.random() * 800;
                    target.y = Math.random() * 600;
                    io.emit("updatePlayer", { id: data.targetId, ...target });
                }
            }

            // 🔥 Remove o projétil corretamente do array
            projectiles = projectiles.filter(p => p !== projectile);
            io.emit("updateProjectiles", projectiles);
        }, distance / speed * 100);

    

    











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