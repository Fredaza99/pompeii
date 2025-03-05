let projectileLoopRunning = false;
let glowParticles = [];
let projectiles = []; // ✅ Garante que o array existe antes de ser usado




function fireProjectile(startX, startY, targetX, targetY) {
    console.log("🔥 Disparando único projétil luminoso!");

    let mainColor = "rgb(3, 205, 255)"; // Cor brilhante do projétil

    let newProjectile = {
        x: startX,
        y: startY,
        targetX,
        targetY,
        velocityX: (targetX - startX) * 0.05, // Ajustando velocidade para um impacto mais rápido
        velocityY: (targetY - startY) * 0.05,
        size: 24, // Tamanho do projétil
        color: mainColor,
    };

    createGlowParticles(startX, startY);

    projectiles = [newProjectile]; // 🔥 Substitui a lista por um único projétil
}


function createGlowParticles(x, y) {
    let color = "rgba(160, 50, 255, 1)"; // 🟣 Roxo mágico (cor fixa)

    glowParticles.push({
        x,
        y,
        size: Math.random() * 3 + 2,
        opacity: 1,
        velocityX: (Math.random() - 0.5) * 2,
        velocityY: (Math.random() - 0.5) * 2,
        color: color // 🔥 Agora todas as faíscas têm cor!
    });
}















function drawProjectiles() {
    frameCount++;

    projectiles.forEach((p) => {
        drawGlowingProjectile(ctx, p.x, p.y, p.color); // 🔥 Desenha o projétil
        createSparkEffect(p.x, p.y); // 🔥 Adiciona faíscas
    });

    drawSparks(); // 🔥 Renderiza as faíscas na tela
}







        
        
        
        
        
        


function createTrailEffect(x, y, velocityX, velocityY) {
    for (let i = 0; i < 5; i++) { // 🔥 Gera mais partículas para um rastro denso
        glowParticles.push({
            x: x - velocityX * i * 2, // 🔥 Distribui as partículas ao longo da trajetória
            y: y - velocityY * i * 2,
            size: Math.random() * 6 + 3, // 🔥 Partículas maiores para dar volume (3 a 9 px)
            opacity: 1,
            velocityX: (Math.random() - 0.5) * 0.3, // 🔹 Movimento levemente aleatório
            velocityY: (Math.random() - 0.5) * 0.3,
            decay: Math.random() * 0.02 + 0.01 // 🔹 Define a velocidade de desaparecimento
        });
    }
}






function createSparkEffect(x, y) {
    let color = "rgba(160, 50, 255, 1)"; // 🟣 Roxo mágico (cor fixa)

    for (let i = 0; i < 3; i++) { // número de faíscas
        glowParticles.push({
            x,
            y,
            size: 12, // 🔥 Todas as partículas terão 8px de tamanho
            opacity: 1,
            velocityX: (Math.random() - 0.5) * 4, // 🔥 Movimento menor para menos espalhamento
            velocityY: (Math.random() - 0.5) * 4,
            decay: Math.random() * 0.08 + 0.05,
            color: color
        });
    }
}


function drawSparks() {
    
    for (let i = glowParticles.length - 1; i >= 0; i--) {
        let p = glowParticles[i];

        ctx.fillStyle = Math.random() < 0.5
            ? `rgba(120, 255, 214, ${p.opacity})` // 💀 Azul-esverdeado espectral
            : `rgba(80, 200, 255, ${p.opacity})`; // 🔥 Ciano fantasmagórico

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.opacity -= 0.03; // 🔥 Desaparece mais devagar (antes 0.1)
        p.size = Math.max(p.size - 0.1, 0.5); // 🔥 Garante que nunca seja menor que 0.5


        if (p.opacity <= 0) {
            glowParticles.splice(i, 1);
        }
    }
}




function drawFlare(ctx, x, y) {
    drawMetallicProjectile(ctx, x, y); // 🔥 Agora cria um efeito de rastro suave
}



function drawGlowParticles() {
    for (let i = glowParticles.length - 1; i >= 0; i--) {
        let p = glowParticles[i];

        if (!p.color) {
            console.warn("⚠️ Faísca sem cor detectada! Aplicando cor fixa.");
            p.color = "rgba(160, 50, 255, 1)"; // 🟣 Garante que sempre será roxo
        }

        ctx.fillStyle = p.color; // 🔥 Usa a cor armazenada corretamente
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.opacity -= p.decay;
        p.size *= 0.95;

        if (p.opacity <= 0.1) {
            glowParticles.splice(i, 1);
        }
    }
    ctx.globalAlpha = 1;
}



function drawGlowingProjectile(ctx, x, y, color) {
    let size = 24; // 🔹 Tamanho do projétil maior

    let gradient = ctx.createRadialGradient(x, y, 4, x, y, 16); // 🔥 Glow maior
    gradient.addColorStop(0, "rgba(120, 255, 214, 1)");  // 💀 Verde azulado forte no centro
    gradient.addColorStop(0.5, "rgba(90, 200, 255, 0.8)"); // 🔹 Azul etéreo brilhante
    gradient.addColorStop(1, "rgba(0, 100, 150, 0)"); // 🔥 Dissolve num azul escuro espectral

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2); // 🔹 Projétil maior (raio 8)
    ctx.fill();

    // 🔹 Gera faíscas com controle reduzido
    if (Math.random() < 1) { // 🔥 50% de chance de soltar faísca, reduzindo a quantidade
        createSparkEffect(x, y);
    }
}



let frameCount = 0;






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


        let t = 0.1; // Suaviza o movimento
        let newX = lerp(p.x, p.x + p.velocityX, t);
        let newY = lerp(p.y, p.y + p.velocityY, t);

        if (isNaN(newX) || isNaN(newY)) {
            console.error(`🚨 ERRO: Movimento inválido para projétil ${i}. Removendo.`);
            projectiles.splice(i, 1);
            continue;
        }

        p.x = newX;
        p.y = newY;

        if (isNaN(p.rotation)) {
            console.warn(`⚠️ Corrigindo rotação inválida para projétil ${i}`);
            p.rotation = 0;
        }


        let dx = p.targetX - p.x;
        let dy = p.targetY - p.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
            createImpactEffect(p.targetX, p.targetY);
            projectiles.splice(i, 1);
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


















