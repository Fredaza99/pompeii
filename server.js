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
        if (now - (player.lastShot || 0) < FIRE_RATE) {
            return; // 🔥 Evita spam de tiros
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
        let speed = 5;

        // 🔥 Cria um projétil que viaja até o inimigo
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

        // 🔥 Simula o impacto após o tempo de viagem do projétil
        setTimeout(() => {
            let dxFinal = target.x - projectile.targetX;
            let dyFinal = target.y - projectile.targetY;
            let finalDistance = Math.sqrt(dxFinal * dxFinal + dyFinal * dyFinal);

            if (finalDistance < 30) { // 🔥 Ajustado para garantir o impacto do projétil
                // 🔥 Aplica dano único ao alvo
                target.health -= DAMAGE;

                io.emit("updateHealth", { target: data.targetId, health: target.health });

                io.emit("impact", { x: target.x, y: target.y }); // 🔥 Animação de impacto no cliente

                // 🔥 Se o alvo morreu, ele é respawnado
                if (target.health <= 0) {
                    target.health = 100;
                    target.x = Math.random() * 800;
                    target.y = Math.random() * 600;
                    io.emit("updatePlayer", { id: data.targetId, ...target }); // 🔥 Atualiza a posição e vida do jogador morto
                }
            }
        }, distance / speed * 100); // 🔥 Tempo até o impacto baseado na velocidade
  

    









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

