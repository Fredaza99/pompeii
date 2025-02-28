let projectileLoopRunning = false;
let glowParticles = [];


const projectileColors = [
    "rgb(227, 13, 13)",   // Vermelho
    "rgb(246, 161, 5)", // Laranja
    "rgb(255, 255, 20)", // Amarelo
    "rgb(36, 255, 36)",   // Verde
    "rgb(62, 255, 255)", // Ciano
    "rgb(47, 47, 255)",   // Azul
    "rgb(255, 25, 255)", // Roxo
    "rgb(255, 55, 162)" // Rosa
];

function fireProjectile(startX, startY, targetX, targetY) {
    console.log("🔥 Disparando projétil com efeito especial!");

    let mainColor = "rgb(3, 205, 255)"; // 🔥 Projétil principal é branco

    let newProjectile = {
        x: startX,
        y: startY,
        targetX,
        targetY,
        velocityX: (targetX - startX) * 0.02,
        velocityY: (targetY - startY) * 0.02,
        rotation: 0,
        color: mainColor, // 🔥 Cor do projétil principal
        orbitBalls: []
    };

    // 🔥 Criamos 8 bolas coloridas ao redor do projétil principal
    for (let i = 0; i < 8; i++) {
        let angle = (i / 8) * (Math.PI * 2);
        let ballColor = projectileColors[i % projectileColors.length];

        if (!ballColor || typeof ballColor !== "string") {
            console.warn(`⚠️ A cor da bola ${i} está indefinida!`);
            ballColor = "rgba(255, 0, 0, 1)"; // 🔥 Vermelho para teste
        }

        newProjectile.orbitBalls.push({
            angleOffset: angle, // Ângulo inicial da bola ao redor do projétil
            color: ballColor
        });

        console.log(`🌈 Criada bola ${i} com cor:`, ballColor);
    }

    projectiles.push(newProjectile);
    console.log("✅ Projétil criado com bolas giratórias:", newProjectile);
}















function drawProjectiles() {
    frameCount++;

    projectiles.forEach((p, index) => {
        console.log(`🌀 Renderizando projétil ${index + 1} na posição (${p.x}, ${p.y})`);

        // 🔥 Desenha o projétil principal
        drawGlowingProjectile(ctx, p.x, p.y, p.color);

        // 🌀 Atualiza a rotação das bolas orbitantes
        p.rotation += 0.1; // 🔥 Aumenta a rotação suavemente

        // 🔥 Desenha as 8 bolas girando ao redor do projétil
        p.orbitBalls.forEach((ball, ballIndex) => {
            let angle = p.rotation + ball.angleOffset;
            let orbitX = p.x + Math.cos(angle) * 15;
            let orbitY = p.y + Math.sin(angle) * 15;

            console.log(`🌈 Bola ${ballIndex + 1} na posição (${orbitX}, ${orbitY}) com cor ${ball.color}`);
            drawGlowingProjectile(ctx, orbitX, orbitY, ball.color);
        });

        drawFlare(ctx, p.x, p.y, frameCount);
    });
}


function drawGlowingProjectile(ctx, x, y, color) {
    if (!color || typeof color !== "string") {
        console.warn("⚠️ Cor do projétil inválida! Usando fallback.");
        color = "rgba(255, 255, 255, 1)";
    }

    console.log(`🎨 Desenhando projétil com cor: ${color}`);

    let rgbaBase = color.substring(0, color.lastIndexOf(",") + 1); // 🔥 Pega apenas "rgba(r, g, b,"

    let gradient = ctx.createRadialGradient(x, y, 5, x, y, 20);
    gradient.addColorStop(0, `${rgbaBase} 1)`);
    gradient.addColorStop(0.4, `${rgbaBase} 0.6)`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
}




function drawFlare(ctx, x, y, frameCount) {
    let intensity = Math.sin(frameCount * 0.1) * 0.5 + 0.5; // Efeito de pulso

    ctx.globalAlpha = intensity;
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1; // Reseta a transparência
}

function createGlowParticles(x, y) {
    glowParticles.push({
        x,
        y,
        size: Math.random() * 3 + 2,
        opacity: 1,
        velocityX: (Math.random() - 0.5) * 2,
        velocityY: (Math.random() - 0.5) * 2
    });
}

function drawGlowParticles() {
    for (let i = glowParticles.length - 1; i >= 0; i--) {
        let p = glowParticles[i];

        ctx.fillStyle = `rgba(255, 200, 100, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.velocityX;
        p.y += p.velocityY;
        p.size -= 0.05;
        p.opacity -= 0.05;

        if (p.opacity <= 0) {
            glowParticles.splice(i, 1);
        }
    }
}

let frameCount = 0;


function drawProjectiles() {
    frameCount++;
    projectiles.forEach((p) => {
        drawGlowingProjectile(ctx, p.x, p.y, p.color); // 🔥 Agora a cor será usada corretamente!
        drawFlare(ctx, p.x, p.y, frameCount);
    });
}





// Cria um efeito de impacto ao atingir o alvo
function createImpactEffect(x, y) {
    impacts.push({ x, y, size: 15, opacity: 1 });
}

// Atualiza e desenha os impactos
function drawImpacts() {
    impacts.forEach((impact, index) => {
        ctx.fillStyle = `rgba(255, 140, 0, ${impact.opacity})`;
        ctx.beginPath();
        ctx.arc(impact.x, impact.y, impact.size, 0, Math.PI * 2);
        ctx.fill();

        impact.size += 2;
        impact.opacity -= 0.05;

        if (impact.opacity <= 0) {
            impacts.splice(index, 1);
        }
    });

    requestAnimationFrame(drawImpacts);
}

function lerp(start, end, t) {
    return start + (end - start) * t;
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];

        let t = 0.1; // 🔥 Suaviza o movimento
        p.x = lerp(p.x, p.x + p.velocityX, t);
        p.y = lerp(p.y, p.y + p.velocityY, t);

        let dx = p.targetX - p.x;
        let dy = p.targetY - p.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
            createImpactEffect(p.targetX, p.targetY);
            projectiles.splice(i, 1); // Remove o projétil ao atingir o alvo
            console.log("💥 Projétil atingiu o alvo e foi removido!");
        }
    }

    requestAnimationFrame(updateProjectiles);
}




function startProjectileLoop() {
    if (!projectileLoopRunning) {
        console.log("🎯 Iniciando loop de atualização dos projéteis...");
        projectileLoopRunning = true;
        updateProjectiles();
    } else {
        console.log("🔄 Loop de projéteis já está rodando!");
    }
}



















