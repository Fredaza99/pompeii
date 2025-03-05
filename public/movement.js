const DIAGONAL_TOLERANCE = 0.5; // 🔥 Define o limite para diferenciar cardeal e diagonal
let lastStableDirection = null; // 🔥 Guarda a última direção confirmada



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

function getDirectionByShipPosition(shipX, shipY, clickX, clickY) {
    let dx = clickX - shipX;
    let dy = clickY - shipY;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 20) return "diagonal"; // 🔥 Se o clique for muito perto, mantém a direção atual

    let normalizedDx = dx / distance; // 🔥 Normaliza para evitar distorções
    let normalizedDy = dy / distance;

    let angle = Math.atan2(normalizedDy, normalizedDx) * (180 / Math.PI); // 🔥 Converte para graus

    if ((angle >= -20 && angle < 20)) return "L";  // 🔹 Leste
    if ((angle >= 20 && angle < 70)) return "SE";  // 🔹 Sudeste
    if ((angle >= 70 && angle < 110)) return "S";  // 🔹 Sul
    if ((angle >= 110 && angle < 160)) return "SO";  // 🔹 Sudoeste
    if ((angle >= 160 || angle <= -160)) return "O";  // 🔹 Oeste
    if ((angle >= -160 && angle < -110)) return "NO";  // 🔹 Noroeste
    if ((angle >= -110 && angle < -70)) return "N";  // 🔹 Norte
    if ((angle >= -70 && angle < -20)) return "NE";  // 🔹 Nordeste

    return "diagonal";  // 🔥 Se não encaixar, define como diagonal genérica
}








function animateCardinalDirections(direction) {
    if (animationInterval) clearInterval(animationInterval);

    let frames = [];
    if (direction === "N") frames = [1, 2]; // 🔹 Norte agora alterna entre SE e SO (correto!)
    else if (direction === "S") frames = [3, 0]; // 🔹 Sul agora alterna entre NE e NO (correto!)
    else if (direction === "L") frames = [3, 1]; // 🔹 Leste alterna entre NE e SE
    else if (direction === "O") frames = [2, 0]; // 🔹 Oeste alterna entre NO e SO
    else if (direction === "NE") frames = [1]; // 🔹 Nordeste (Frame fixo)
    else if (direction === "SE") frames = [3]; // 🔹 Sudeste (Frame fixo)
    else if (direction === "NO") frames = [2]; // 🔹 Noroeste (Frame fixo)
    else if (direction === "SO") frames = [0]; // 🔹 Sudoeste (Frame fixo)

    let currentFrame = 0;
    animationInterval = setInterval(() => {
        ship.frameIndex = frames[currentFrame];
        currentFrame = (currentFrame + 1) % frames.length;
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
            const HALF_SPRITE_WIDTH = SPRITE_WIDTH / 2;
            const HALF_SPRITE_HEIGHT = SPRITE_HEIGHT / 2;

            // 🔥 Agora pode ir até as bordas REAIS sem erro de alinhamento
            ship.x = Math.max(HALF_SPRITE_WIDTH, Math.min(1920 - HALF_SPRITE_WIDTH, ship.x));
            ship.y = Math.max(HALF_SPRITE_HEIGHT, Math.min(1080 - HALF_SPRITE_HEIGHT, ship.y));

            // 🔥 Atualiza a direção do navio baseada na posição real do barco e no clique
            let newDirection = getDirectionByShipPosition(ship.x, ship.y, ship.targetX, ship.targetY);

            if (newDirection !== lastDirection) {
                lastDirection = newDirection;
                if (!["N", "S", "L", "O"].includes(newDirection)) {
                    clearInterval(animationInterval);
                    ship.frameIndex = getFrameIndex(angle); // 🔥 Frame fixo para direções diagonais
                } else {
                    animateCardinalDirections(newDirection); // 🔥 Animação intercalada para direções cardeais
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




       