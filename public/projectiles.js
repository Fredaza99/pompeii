let projectileLoopRunning = false;
let projectileImage = new Image();
projectileImage.src = "/images/glowtest.png"; // Substitua pelo caminho correto


function drawLuminousBall(ctx, x, y) {
    if (!isFinite(x) || !isFinite(y)) {
        console.warn("⚠️ Projétil com posição inválida detectado:", x, y);
        return; // 🔥 Evita desenhar projéteis inválidos
    }

    // 🔥 Desenha o PNG do projétil no lugar do gradiente
    let size = 40; // Tamanho do projétil
    ctx.drawImage(projectileImage, x - size / 2, y - size / 2, size, size);
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

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];

        p.x += p.velocityX;
        p.y += p.velocityY;

        let dx = p.targetX - p.x;
        let dy = p.targetY - p.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
            createImpactEffect(p.targetX, p.targetY);
            projectiles.splice(i, 1);
        }
    }

    requestAnimationFrame(updateProjectiles);
}


// 🔥 Inicia `updateProjectiles()` automaticamente ao adicionar um novo projétil
function startProjectileLoop() {
    if (!projectileLoopRunning) {
        projectileLoopRunning = true;
        updateProjectiles();
    }
}






// 🔥 Agora `updateProjectiles()` roda no gameLoop corretamente


// Renderiza os projéteis
function drawProjectiles() {
    projectiles.forEach((p) => drawLuminousBall(ctx, p.x, p.y));
}










