// 🎮 Configuração do Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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
let targetLoopRunning = false; // 🔥 Controle do loop de seleção






function drawShips() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    ctx.clearRect(0, 0, canvas.width, canvas.height); // 🔥 Limpa a tela antes de desenhar

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





