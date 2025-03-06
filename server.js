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

const DIAGONAL_TOLERANCE = 0.5; // 🔥 Define o limite para diferenciar cardeal e diagonal



let players = {};
let projectiles = [];

let lastUpdateTime = Date.now();


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

    socket.on("pingCheck", () => {
        socket.emit("pingResponse"); // 🔥 Retorna a resposta para o cliente
    });


    function getFrameIndex(angle) {
        if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
            return 3; // Nordeste (NE)
        } else if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4) {
            return 0; // Noroeste (NO)
        } else if (angle >= -3 * Math.PI / 4 && angle < -Math.PI / 4) {
            return 1; // Sudeste (SE)
        } else {
            return 2; // Sudoeste (SO)
        }
    }

    function getDirectionByShipPosition(shipX, shipY, targetX, targetY) {
        let dx = targetX - shipX;
        let dy = targetY - shipY;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 20) return "diagonal"; // 🔥 Se o destino for muito perto, mantém a direção atual

        let angle = Math.atan2(dy, dx) * (180 / Math.PI); // 🔥 Converte para graus

        if (angle >= -20 && angle < 20) return "L";  // 🔹 Leste
        if (angle >= 20 && angle < 70) return "SE";  // 🔹 Sudeste
        if (angle >= 70 && angle < 110) return "S";  // 🔹 Sul
        if (angle >= 110 && angle < 160) return "SO";  // 🔹 Sudoeste
        if (angle >= 160 || angle <= -160) return "O";  // 🔹 Oeste
        if (angle >= -160 && angle < -110) return "NO";  // 🔹 Noroeste
        if (angle >= -110 && angle < -70) return "N";  // 🔹 Norte
        if (angle >= -70 && angle < -20) return "NE";  // 🔹 Nordeste

        return "diagonal";  // 🔥 Se não encaixar, define como diagonal genérica
    }

    function animateCardinalDirections(player, direction) {
        if (!player) return;

        if (player.animationInterval) {
            clearInterval(player.animationInterval);
            player.animationInterval = null;
        }

        let frames = [];
        if (direction === "N") frames = [1, 2];
        else if (direction === "S") frames = [3, 0];
        else if (direction === "L") frames = [3, 1];
        else if (direction === "O") frames = [2, 0];

        let currentFrame = 0;

        player.animationInterval = setInterval(() => {
            player.frameIndex = frames[currentFrame];
            io.emit("updatePlayerFrame", { id: player.id, frameIndex: player.frameIndex });
            currentFrame = (currentFrame + 1) % frames.length;
        }, 180);
    }







    function updatePlayerPositions() {
        let now = Date.now();
        let deltaTime = (now - lastUpdateTime) / 1000;
        lastUpdateTime = now;

        let speed = 200;

        for (let playerId in players) {
            let player = players[playerId];

            if (player.targetX !== undefined && player.targetY !== undefined) {
                let dx = player.targetX - player.x;
                let dy = player.targetY - player.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > speed * deltaTime) {
                    player.x += (dx / distance) * speed * deltaTime;
                    player.y += (dy / distance) * speed * deltaTime;

                    player.angle = Math.atan2(dy, dx);
                    let newDirection = getDirectionByShipPosition(player.x, player.y, player.targetX, player.targetY);

                    if (newDirection !== player.lastStableDirection) {
                        player.lastStableDirection = newDirection;

                        if (!["N", "S", "L", "O"].includes(newDirection)) {
                            if (player.animationInterval) {
                                clearInterval(player.animationInterval);
                                player.animationInterval = null;
                            }
                            player.frameIndex = getFrameIndex(player.angle);
                        } else {
                            animateCardinalDirections(player, newDirection);
                        }
                    }
                } else {
                    player.x = player.targetX;
                    player.y = player.targetY;

                    if (player.animationInterval) {
                        clearInterval(player.animationInterval);
                        player.animationInterval = null;
                    }
                }
            }
        }

        let sanitizedPlayers = {};
        for (let id in players) {
            sanitizedPlayers[id] = { ...players[id] };
            delete sanitizedPlayers[id].animationInterval;
        }

        io.emit("updatePositions", sanitizedPlayers);
    }








    setInterval(updatePlayerPositions, 1000 / 60); // 🔥 Atualiza 60 vezes por segundo



    socket.on("move", (data) => {
        if (players[socket.id]) {
            players[socket.id].targetX = data.targetX;
            players[socket.id].targetY = data.targetY;

            let dx = players[socket.id].targetX - players[socket.id].x;
            let dy = players[socket.id].targetY - players[socket.id].y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                players[socket.id].angle = Math.atan2(dy, dx); // 🔥 Atualiza o ângulo corretamente
            }
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
    
        const projectileColors = [
            "rgb(227, 13, 13)",  "rgb(246, 161, 5)",  "rgb(255, 255, 20)", 
            "rgb(36, 255, 36)",  "rgb(62, 255, 255)", "rgb(47, 47, 255)", 
            "rgb(128, 0, 128)",  "rgb(255, 55, 162)"
        ];
    
        let chosenColor = projectileColors[Math.floor(Math.random() * projectileColors.length)];
    
        // 🔥 Gera 8 bolas orbitantes com spawnTime espaçados corretamente
        const orbitBalls = [];
        const MAX_DELAY = 800; // 🔥 Define um atraso maior para garantir espaçamento real

        for (let i = 0; i < 8; i++) {
            let angleOffset = (i / 8) * (Math.PI * 2);
            let ballColor = projectileColors[i % projectileColors.length];
        
            // 🔥 Agora cada bola tem um delay progressivo e aleatório
            let delay = (i * 150) + Math.random() * MAX_DELAY;  
        
            orbitBalls.push({
                angleOffset: angleOffset,
                color: ballColor,
                spawnTime: now + delay  // Agora os tempos de spawn são bem distribuídos!
            });
        }
        
    
        let projectile = {
            id: socket.id,
            startX: player.x,
            startY: player.y,
            targetX: target.x,
            targetY: target.y,
            angle: angle,
            velocityX: Math.cos(angle) * speed,
            velocityY: Math.sin(angle) * speed,
            createdAt: Date.now(),
            color: chosenColor,
            orbitBalls: orbitBalls
        };
    
        console.log(`✅ Projétil criado no servidor com cor: ${projectile.color}`);
    
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
    console.log("servidor rodando na porta 3000")
});