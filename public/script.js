function typePlaceholder(text, speed) {
    let input = document.getElementById("playerNameInput");
    let i = 0;
    function typing() {
        if (i < text.length) {
            input.placeholder += text.charAt(i);
            i++;
            setTimeout(typing, speed);
        }
    }
    setTimeout(typing, 400);
}

typePlaceholder("Enter your pirate name...", 100);

let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

function updateFPS() {
    let now = performance.now();
    frameCount++;

    if (now - lastFrameTime >= 1000) { // Atualiza a cada segundo
        fps = frameCount;
        frameCount = 0;
        lastFrameTime = now;
        document.getElementById("fpsCounter").innerText = `FPS: ${fps}`;
    }

    requestAnimationFrame(updateFPS);
}

// 🔥 Inicia o cálculo de FPS ao carregar o jogo
updateFPS();
