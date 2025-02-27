

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

function animateCardinalDirections(direction) {
    if (animationInterval) clearInterval(animationInterval);

    let frames = [];
    if (direction === "N") frames = [1, 2]; // Norte alterna entre SE e SO
    else if (direction === "S") frames = [0, 3]; // Sul alterna entre NO e NE
    else if (direction === "L") frames = [3, 1]; // Leste alterna entre NE e SE
    else if (direction === "O") frames = [0, 2]; // Oeste alterna entre NO e SO

    let currentFrame = 0;
    animationInterval = setInterval(() => {
        ship.frameIndex = frames[currentFrame];
        currentFrame = (currentFrame + 1) % 2;
    }, 180);
}


function moveShip() {
    if (!ship) return; // 🔥 Apenas checa se ship existe, mas não bloqueia a função

    isMoving = true; // 🔥 Marca que a função está rodando para evitar chamadas duplicadas

    function step() {
        if (!ship) {
            isMoving = false;
            return;
        }

        let dx = ship.targetX - ship.x;
        let dy = ship.targetY - ship.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > ship.speed) { // 🔥 Se ainda não chegou ao destino
            ship.x += (dx / distance) * ship.speed;
            ship.y += (dy / distance) * ship.speed;
            let angle = Math.atan2(dy, dx);

            // 🔥 Ajuste baseado no tamanho do barco para alinhar melhor com as bordas
            const HALF_SPRITE_WIDTH = SPRITE_WIDTH / 2;  // 🔥 Considera o tamanho real do barco
            const HALF_SPRITE_HEIGHT = SPRITE_HEIGHT / 2;

            // 🔥 Agora pode ir até as bordas REAIS sem erro de alinhamento
            ship.x = Math.max(HALF_SPRITE_WIDTH, Math.min(1920 - HALF_SPRITE_WIDTH, ship.x));
            ship.y = Math.max(HALF_SPRITE_HEIGHT, Math.min(1080 - HALF_SPRITE_HEIGHT, ship.y));

            // 🔥 Atualiza a direção do navio
            let newDirection = null;
            if (Math.abs(dx) > Math.abs(dy)) {
                newDirection = dx > 0 ? "L" : "O";
            } else {
                newDirection = dy > 0 ? "S" : "N";
            }

            if (newDirection !== lastDirection) {
                lastDirection = newDirection;
                if (!["N", "S", "L", "O"].includes(newDirection)) {
                    clearInterval(animationInterval);
                    ship.frameIndex = getFrameIndex(angle);
                } else {
                    animateCardinalDirections(newDirection);
                }
            }

            // 🔥 Envia a posição atualizada ao servidor
            socket.emit("move", {
                x: ship.x,
                y: ship.y,
                angle: angle,
                frameIndex: ship.frameIndex
            });

            requestAnimationFrame(step); // 🔥 Continua movendo até chegar no destino
        } else {
            isMoving = false; // 🔥 Para o movimento quando chegar ao destino
        }
    }

    requestAnimationFrame(step); // 🔥 Inicia o movimento corretamente
}



       