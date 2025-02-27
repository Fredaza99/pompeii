const socket = io("http://localhost:3000");



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



socket.on("updatePlayer", (player) => {
    if (ships[player.id]) {
        ships[player.id] = player;
    }
});


socket.on("removePlayer", (playerId) => {
    delete ships[playerId];
});


socket.on("newProjectile", (data) => {
    projectiles.push({
        x: data.startX,
        y: data.startY,
        velocityX: data.velocityX,
        velocityY: data.velocityY,
        targetX: data.targetX,
        targetY: data.targetY,
        targetId: data.targetId, // 🔥 Agora garantimos que o alvo está correto

    });

    console.log(`✅ Projétil adicionado à lista! Total: ${projectiles.length}`);

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



