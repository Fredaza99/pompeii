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








function animateCardinalDirections(ship, direction) {
    if (!ship) return;
    if (animationInterval) clearInterval(animationInterval);

    let frames = [];
    if (direction === "N") frames = [1, 2];
    else if (direction === "S") frames = [3, 0];
    else if (direction === "L") frames = [3, 1];
    else if (direction === "O") frames = [2, 0];
    else if (direction === "NE") frames = [1];
    else if (direction === "SE") frames = [3];
    else if (direction === "NO") frames = [2];
    else if (direction === "SO") frames = [0];

    let currentFrame = 0;
    animationInterval = setInterval(() => {
        ship.frameIndex = frames[currentFrame]; // 🔥 Agora `ship` é atualizado corretamente!
        currentFrame = (currentFrame + 1) % frames.length;
    }, 180);
}






function updateShipAnimation(ship) {
    if (!ship) return;

    let dx = ship.targetX - ship.x;
    let dy = ship.targetY - ship.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 1) { // 🔥 Se o barco está se movendo
        let newDirection = getDirectionByShipPosition(ship.x, ship.y, ship.targetX, ship.targetY);

        if (newDirection !== lastStableDirection) {
            lastStableDirection = newDirection;

            if (!["N", "S", "L", "O"].includes(newDirection)) {
                clearInterval(animationInterval);
                ship.frameIndex = getFrameIndex(Math.atan2(dy, dx)); // 🔥 Define frame fixo para diagonais
            } else {
                animateCardinalDirections(newDirection); // 🔥 Animação intercalada para direções cardeais
            }
        }
    } else {
        clearInterval(animationInterval); // 🔥 Para a animação quando o barco parar
    }
}






       