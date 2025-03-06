let lastClickX = null;
let lastClickY = null;

// 🔥 Função para verificar se o jogador clicou em um inimigo
function getClickedPlayer(event) {
    let rect = canvas.getBoundingClientRect(); // 🔥 Obtém o tamanho real do canvas na tela
    let scaleX = canvas.width / rect.width;  // 🔥 Calcula a escala horizontal
    let scaleY = canvas.height / rect.height; // 🔥 Calcula a escala vertical

    let clickX = (event.clientX - rect.left) * scaleX; // 🔥 Ajusta X do clique
    let clickY = (event.clientY - rect.top) * scaleY;  // 🔥 Ajusta Y do clique

    for (let id in ships) {
        if (id !== socket.id) { // Evita selecionar a si mesmo
            let player = ships[id];

            // Define área clicável do navio
            let shipLeft = player.x - SPRITE_WIDTH / 2;
            let shipRight = player.x + SPRITE_WIDTH / 2;
            let shipTop = player.y - SPRITE_HEIGHT / 2;
            let shipBottom = player.y + SPRITE_HEIGHT / 2;

            if (clickX >= shipLeft && clickX <= shipRight && clickY >= shipTop && clickY <= shipBottom) {
                return id; // Retorna o ID do inimigo clicado
            }
        }
    }
    return null; // Retorna nulo se nenhum inimigo foi clicado
}


function selectTarget(targetId) {
    if (selectedTargetId !== targetId) {
        selectedTargetId = targetId;
        console.log(`🎯 Novo alvo selecionado: ${selectedTargetId}`);
        startTargetLoop(); // 🔥 Agora o círculo vermelho será desenhado corretamente
    }
}



document.addEventListener("click", (event) => {
    if (!ship) return;

    let rect = canvas.getBoundingClientRect(); // 🔥 Pega o tamanho real do canvas na tela
    let scaleX = canvas.width / rect.width;  // 🔥 Calcula a escala horizontal
    let scaleY = canvas.height / rect.height; // 🔥 Calcula a escala vertical

    let correctedX = (event.clientX - rect.left) * scaleX; // 🔥 Ajusta X do clique
    let correctedY = (event.clientY - rect.top) * scaleY; // 🔥 Ajusta Y do clique

    let clickedEnemy = getClickedPlayer(event);

    if (clickedEnemy) {
        if (selectedTargetId !== clickedEnemy) { // 🔥 Evita redefinir o mesmo alvo várias vezes
            selectTarget(clickedEnemy);
        }
    } else {
        // 🔥 Verifica se o jogador está clicando no mesmo lugar
        if (correctedX === lastClickX && correctedY === lastClickY) {
            console.log("🛑 Clique repetido! Nada será atualizado.");
            return; // 🔥 Cancela a execução para evitar chamadas desnecessárias
        }

        // 🔥 Envia a intenção de movimento para o servidor
        socket.emit("move", { targetX: correctedX, targetY: correctedY });

        // 🔥 Atualiza o destino no cliente apenas para animação
        ship.targetX = correctedX;
        ship.targetY = correctedY;

        if (!isMoving) { // 🔥 Só chama moveShip() se o navio estiver parado
            moveShip();
        }

        // 🔥 Atualiza a posição do último clique
        lastClickX = correctedX;
        lastClickY = correctedY;
    }
});



// 🔥 Função de ataque (pressionando espaço ou "A")
function shoot() {
    if (!selectedTargetId || !canShoot) return; // Se não há alvo ou o disparo está em cooldown, cancela

    console.log(`🔫 Disparando contra ${selectedTargetId}...`);

    socket.emit("shoot", { targetId: selectedTargetId }); // Envia um único disparo

    canShoot = false; // Bloqueia novos disparos
    setTimeout(() => {
        canShoot = true; // Libera o disparo após cooldown
    }, 3000);
}



// 🔥 Atira ao pressionar espaço ou "A"
document.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.code === "KeyA") {
        shoot();
    }
});