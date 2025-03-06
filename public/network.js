const socket = io("https://pompeii.up.railway.app/"); // 🔥 Conecta ao servidor



socket.on("currentPlayers", (serverPlayers) => {
    ships = serverPlayers;
    console.log("Recebendo jogadores do servidor:", ships); // Depuração
});


socket.on("newPlayer", (player) => {
    ships[player.id] = player;
});

socket.on("setInitialPosition", (player) => {
    console.log("🚢 Recebendo posição inicial do servidor:", player.x, player.y);

    ship = {
        x: player.x,
        y: player.y,
        targetX: player.x,
        targetY: player.y,
        speed: 2.8,
        frameIndex: 0
    };

    // 🔥 Somente agora começamos a renderizar o jogo
    requestAnimationFrame(drawShips);
    requestAnimationFrame(moveShip);
});


socket.on("updatePositions", (serverPlayers) => {
    for (let id in serverPlayers) {
        if (ships[id]) {
            ships[id].x = serverPlayers[id].x;
            ships[id].y = serverPlayers[id].y;
            ships[id].angle = serverPlayers[id].angle;
            ships[id].frameIndex = serverPlayers[id].frameIndex;

            updateShipAnimation(ships[id]); // 🔥 Garante que a animação está sendo aplicada corretamente
        }
    }
});





socket.on("updatePlayer", (data) => {
    if (ships[data.id]) {
        ships[data.id].x = data.x;
        ships[data.id].y = data.y;
        ships[data.id].angle = data.angle;
        ships[data.id].frameIndex = data.frameIndex;

        updateShipAnimation(ships[data.id]); // 🔥 Agora a animação será atualizada corretamente!
    }
});


socket.on("updatePlayerFrame", (data) => {
    if (ships[data.id]) {
        ships[data.id].frameIndex = data.frameIndex;
    }
});



socket.on("removePlayer", (playerId) => {
    delete ships[playerId];
});


socket.on("newProjectile", (data) => {
    if (!data.color || typeof data.color !== "string") {
        console.warn("⚠️ Projétil recebido sem cor! Usando fallback.");
        data.color = "rgb(255, 255, 255)";
    }

    console.log(`🔥 Novo projétil recebido: x=${data.startX}, y=${data.startY}, cor=${data.color}`);

    projectiles.push({
        x: data.startX,
        y: data.startY,
        velocityX: data.velocityX,
        velocityY: data.velocityY,
        targetX: data.targetX,
        targetY: data.targetY,
        color: data.color,
        orbitBalls: data.orbitBalls || []
    });



    if (!projectileLoopRunning) {
        projectileLoopRunning = true;
        projectileLoop();
    }
});





// Define a função no objeto global window para que possa ser chamada no HTML
window.setPlayerName = function () {
    const input = document.getElementById("playerNameInput");
    const playerName = input.value.trim();

    if (playerName === "") {
        alert("Por favor, digite um nome!");
        return;
    }

    socket.emit("setName", playerName); // 🔥 Envia o nome para o servidor

    document.getElementById("nameContainer").style.display = "none"; // Esconde a tela de nome

    let fogContainer = document.getElementById("fog-container");

    fogContainer.classList.add("fog-fade-out"); // Aplica a classe CSS de fade-out

    // 🔥 Remove a névoa do DOM após a transição
    setTimeout(() => {
        fogContainer.remove();
    }, 2000); // Tempo da animação de fade-out
};



socket.on("setName", (name) => {
    if (players[socket.id]) {
        players[socket.id].name = name;
        io.emit("updatePlayer", { id: socket.id, ...players[socket.id] }); // 🔥 Envia atualização do nome para todos
    }
});



socket.on("newProjectile", (data) => {
    console.log("🔥 Novo projétil recebido:", data);

    projectiles.push({
        x: data.startX,
        y: data.startY,
        velocityX: data.velocityX,
        velocityY: data.velocityY,
        targetX: data.targetX,
        targetY: data.targetY
    });

    console.log(`✅ Projétil adicionado à lista! Total: ${projectiles.length}`);
});



