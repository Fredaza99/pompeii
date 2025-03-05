const GAME_WIDTH = 1920;
const GAME_HEIGHT = 1080;


const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true }); // 🔥 Otimiza leituras do canvas



const phaserConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth, // 🔥 Ajusta para o tamanho da tela
    height: window.innerHeight,
    parent: "game-container", // 🔥 Garante que Phaser fique dentro do elemento correto
    transparent: false, // (ou true se quiser ver o fundo do body)
    scene: {
        create: createPhaserScene
    }
};

// Inicializa o Phaser APENAS para gerenciar a câmera
const phaserGame = new Phaser.Game(phaserConfig);

let phaserScene;

function createPhaserScene() {
    phaserScene = this;
    this.cameras.main.setBounds(0, 0, 1920, 1080);
    resizeCamera(); // Ajusta o zoom inicial
}



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
const impacts = [];
let isDragging = false;
let lastPointerX, lastPointerY;
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
const targetFPS = 60;
let resizeTimer;
let drawCount = 0;
const BALL_SPACING = 100; // 🔥 Intervalo entre cada bola no efeito cascata
const TOTAL_BALLS = 8;
let resizeCount = 0;
let drawShipsCount = 0;
let lastDrawTime = 0; // 🔥 Guarda o último tempo que `drawShips()` foi chamado
const drawInterval = 16;
let gameRunning = false;
let shouldRedraw = false; // 🔥 Flag para controlar a necessidade de redesenho


let lastPositions = {}; // 🔥 Guarda a última posição conhecida dos navios


function resizeCamera() {
    resizeCount++;
    console.log(`🔥 resizeCamera chamado ${resizeCount} vezes`);

    const baseWidth = 1920;
    const baseHeight = 1080;

    const scaleX = window.innerWidth / baseWidth;
    const scaleY = window.innerHeight / baseHeight;
    const scale = Math.min(scaleX, scaleY); // Mantém a proporção correta

    if (phaserScene) {
        phaserScene.cameras.main.setZoom(scale);
        phaserScene.cameras.main.centerOn(960, 540); // 🔥 Centraliza no meio da tela
    }

    // 🔥 Ajusta o canvas para manter o tamanho correto
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    canvas.style.width = `${baseWidth * scale}px`;
    canvas.style.height = `${baseHeight * scale}px`;

    shouldRedraw = true; // 🔥 Marca que o redesenho é necessário, mas não chama imediatamente!
}



// 🔥 Ajusta o zoom e redesenha quando a tela muda
window.addEventListener("resize", resizeCamera);

function createPhaserScene() {
    phaserScene = this;
    this.cameras.main.setBounds(0, 0, 1920, 1080);
    resizeCamera(); // Ajusta o zoom inicial

}






function drawShips() {
    drawShipsCount++; // 🔥 Incrementa contador
    console.log(`🚢 drawShips foi chamada ${drawShipsCount} vezes`);
    


    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (let id in ships) {
        let player = ships[id];
        if (!player) continue;

        ctx.save();
        ctx.translate(player.x, player.y);

        let spriteX = (player.frameIndex || 0) * SPRITE_WIDTH;

        ctx.drawImage(
            shipImage,
            spriteX, 0, SPRITE_WIDTH, SPRITE_HEIGHT,
            -SPRITE_WIDTH / 2, -SPRITE_HEIGHT / 2, SPRITE_WIDTH, SPRITE_HEIGHT
        );

        ctx.restore();

        let healthPercentage = player.health / 100;
        let barWidth = 100;
        let barHeight = 3;
        let barY = player.y + 60;

        let iconSize = 22;
        let iconX = player.x - (barWidth / 2) - iconSize - 5;
        let iconY = barY - (iconSize / 4);

        ctx.drawImage(healthIcon, iconX, iconY, iconSize, iconSize);

        ctx.fillStyle = "red";
        ctx.fillRect(player.x - barWidth / 2, player.y + 67, barWidth, barHeight);

        ctx.fillStyle = "green";
        ctx.fillRect(player.x - barWidth / 2, player.y + 67, barWidth * healthPercentage, barHeight);

        if (player.name) {
            ctx.fillStyle = "white";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillText(player.name, player.x, barY - -2);
        }
    }
    

    drawProjectiles();
    drawImpacts();

    requestAnimationFrame(drawShips); // 🔥 Garante que continue rodando sem sobrecarga
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


window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        resizeCamera();
    }, 200); // 🔥 Só chama depois de 200ms sem redimensionamento
});


function gameLoop() {
    let startTime = performance.now(); // ⏳ Medir tempo do frame
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)"; // 🔥 Fundo semi-transparente para evitar flickering
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    

    if (shouldRedraw) {
        drawShips();  // 🔥 Só redesenha se for necessário
        shouldRedraw = false;
    }

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





