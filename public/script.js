document.addEventListener("DOMContentLoaded", () => {
    let loadingScreen = document.getElementById("loadingScreen");
    let progressBar = document.querySelector(".loading-progress");

    let assetsToLoad = 1; // 🔥 Ajuste este número conforme necessário
    let assetsLoaded = 0;

    function updateProgress() {
        assetsLoaded++;
        let progress = (assetsLoaded / assetsToLoad) * 100;
        progressBar.style.width = progress + "%";

        if (assetsLoaded >= assetsToLoad) {
            setTimeout(() => {
                loadingScreen.style.display = "none"; // 🔥 Esconde a tela de loading
            }, 500);
        }
    }

    // Simulação de carregamento de assets (ajuste conforme necessário)
    function loadGameAssets() {
        setTimeout(updateProgress, 500); // Simula carregamento de som
        setTimeout(updateProgress, 1000); // Simula carregamento de imagens
        setTimeout(updateProgress, 1500); // Simula carregamento de sprites
        setTimeout(updateProgress, 2000); // Simula carregamento do mapa
        setTimeout(updateProgress, 3000); // Simula carregamento final
        setTimeout(updateProgress, 3500); // Simula carregamento final
    }

    loadGameAssets(); // 🔥 Inicia o carregamento
});

function hideLoadingScreen() {
    let loadingScreen = document.getElementById("loadingScreen");
    if (loadingScreen) {
        loadingScreen.style.opacity = "0"; // 🔥 Faz desaparecer suavemente
        setTimeout(() => {
            loadingScreen.style.display = "none"; // 🔥 Remove da tela após a transição
        }, 500);
    }
}



window.onload = () => {
    let fpsElement = document.getElementById("fpsCounter");
    let pingElement = document.getElementById("pingCounter");

    if (!fpsElement || !pingElement) {
        console.error("⚠️ Elementos FPS ou Ping não encontrados no DOM!");
        return;
    }

    let lastFrameTime = performance.now();
    let frameCount = 0;
    let fps = 0;
    let ping = 0;
    let lastPingTime = performance.now();

    const socket = io(); // 🔥 Certifique-se de que está conectando ao servidor corretamente

    function updateFPS() {
        let now = performance.now();
        frameCount++;

        if (now - lastFrameTime >= 1000) { // Atualiza a cada segundo
            fps = frameCount;
            frameCount = 0;
            lastFrameTime = now;
            fpsElement.innerText = `FPS: ${fps}`;
        }

        requestAnimationFrame(updateFPS);
    }

    function updatePing() {
        lastPingTime = performance.now();
        socket.emit("pingCheck"); // 🔥 Envia um ping para o servidor
    }

    // 🔥 Responde quando o servidor retorna o ping
    socket.on("pingResponse", () => {
        ping = Math.round(performance.now() - lastPingTime); // 🔥 Calcula tempo de ida e volta
        pingElement.innerText = `Ping: ${ping} ms`;
    });

    // 🔥 Atualiza Ping a cada 2 segundos
    setInterval(updatePing, 2000);

    // 🔥 Inicia o cálculo de FPS ao carregar o jogo
    updateFPS();
};


