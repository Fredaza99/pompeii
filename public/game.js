// 🎮 Configuração do Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GAME_WIDTH = 1920;
const GAME_HEIGHT = 1080;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

let lastScale = 1; // Armazena a escala anterior


// 🎮 Carrega imagens
let shipImage = new Image();
shipImage.src = "/images/navio_spritesheet.png";
let healthIcon = new Image();
healthIcon.src = "/images/rei.gif";



// 🎮 Definições do Sprite do navio
const SPRITE_WIDTH = 83;
const SPRITE_HEIGHT = 85;

// 🎮 Variáveis de jogo
let ships = {};
let projectiles = [];
const impacts = [];

let glowSize = 30;
let glowGrowing = true;
let animationInterval = null;
let lastDirection = null;
let ship = null;
let isMoving = false;
let lastEmitTime = 0;
let selectedTarget = null;
let selectedTargetId = null;
let canShoot = true;
let targetLoopRunning = false;
const targetFPS = 60; // 🔥 Define o FPS alvo



function resizeCanvas() {
    let scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);

    if (scale !== lastScale) { // 🔥 Apenas atualiza se necessário
        lastScale = scale;

        canvas.style.position = "absolute";
        canvas.style.top = "50%";
        canvas.style.left = "50%";
        canvas.style.width = `${GAME_WIDTH * scale}px`;
        canvas.style.height = `${GAME_HEIGHT * scale}px`;
        canvas.style.transform = "translate(-50%, -50%)";
    }
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas(); // 🔥 Chama a função ao iniciar


function fixCanvasSize() {
    const canvas = document.getElementById("gameCanvas");

    // 🔥 Verifica se a tela é menor que 1920x1080 e ajusta
    let width = window.innerWidth < 1920 ? window.innerWidth : 1920;
    let height = window.innerHeight < 1080 ? window.innerHeight : 1080;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    console.log(`Canvas ajustado: ${canvas.width} x ${canvas.height}`);
}

// 🔥 Chama a função no início e sempre que a tela for redimensionada
window.onload = fixCanvasSize;
window.addEventListener("resize", fixCanvasSize);




function drawShips() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (let id in ships) {
        let player = ships[id];
        if (!player) continue;

        ctx.save();
        ctx.translate(player.x, player.y);

        let spriteX = (player.frameIndex || 0) * SPRITE_WIDTH;

        // 🔥 Desenha o navio
        ctx.drawImage(
            shipImage,
            spriteX, 0, SPRITE_WIDTH, SPRITE_HEIGHT,
            -SPRITE_WIDTH / 2, -SPRITE_HEIGHT / 2, SPRITE_WIDTH, SPRITE_HEIGHT
        );

        ctx.restore();

        let healthPercentage = player.health / 100;
        let barWidth = 100;
        let barHeight = 3;
        let barY = player.y + 60; // Ajuste de posição vertical da barra

        let iconSize = 22; // Ajuste o tamanho conforme necessário
        let iconX = player.x - (barWidth / 2) - iconSize - 5; // Posiciona à esquerda da barra
        let iconY = barY - (iconSize / 4);

        ctx.drawImage(healthIcon, iconX, iconY, iconSize, iconSize); // Desenha o ícone

        ctx.fillStyle = "red";
        ctx.fillRect(player.x - barWidth / 2, player.y + 67, barWidth, barHeight); // Fundo da barra

        ctx.fillStyle = "green";
        ctx.fillRect(player.x - barWidth / 2, player.y + 67, barWidth * healthPercentage, barHeight); // Vida atual

        // 🔥 Exibir nome do jogador acima da barra de vida
        if (player.name) {
            ctx.fillStyle = "white";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillText(player.name, player.x, barY - -2); // Nome acima da barra de vida
        }
    }

    drawProjectiles();
    drawImpacts();


    requestAnimationFrame(drawShips);
}


function drawSelectedTarget() {
    if (!selectedTargetId || !ships[selectedTargetId]) {
        targetLoopRunning = false;
        return;
    }

    let target = ships[selectedTargetId];

    if (!target || !target.x || !target.y) {
        console.log(`⚠️ Coordenadas inválidas para ${selectedTargetId}: X=${target?.x}, Y=${target?.y}`);
        targetLoopRunning = false;
        return;
    }

    ctx.save();

    // 🔥 Gradiente radial para simular brilho
    let gradient = ctx.createRadialGradient(target.x, target.y, 5, target.x, target.y, glowSize);
    gradient.addColorStop(0, "rgba(255, 50, 50, 0.8)");
    gradient.addColorStop(1, "rgba(255, 50, 50, 0)");

    ctx.beginPath();
    ctx.arc(target.x, target.y, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();

    ctx.restore();

    // 🔥 Efeito de pulsação
    if (glowGrowing) {
        glowSize += 0.5;
        if (glowSize > 35) glowGrowing = false;
    } else {
        glowSize -= 0.5;
        if (glowSize < 30) glowGrowing = true;
    }

    requestAnimationFrame(drawSelectedTarget);
}


// 🔥 Função para iniciar o loop quando um novo alvo for selecionado
function startTargetLoop() {
    if (!targetLoopRunning) {
        targetLoopRunning = true;
        drawSelectedTarget();
    }
}


function projectileLoop() {
    if (projectiles.length > 0) {
        updateProjectiles();
        drawProjectiles();
        requestAnimationFrame(projectileLoop); // 🔥 Continua o loop enquanto houver projéteis
    }
}



function gameLoop() {
    let startTime = performance.now(); // ⏳ Medir tempo do frame

    ctx.fillStyle = "rgba(0, 0, 0, 0.05)"; // 🔥 Fundo semi-transparente para evitar flickering
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);


    drawShips();
    moveShip();
    drawProjectiles();
    drawImpacts();
    drawSelectedTarget();


    let endTime = performance.now(); // ⏳ Finaliza tempo do frame
    let frameTime = endTime - startTime;
    let fps = Math.round(1000 / frameTime);



    requestAnimationFrame(gameLoop); // 🔥 Continua o loop
}

// 🚀 Inicia o loop do jogo corretamente
shipImage.onload = () => {
    if (ship) {
        gameLoop(); // 🔥 Agora o jogo todo roda dentro desse loop
    }
};





