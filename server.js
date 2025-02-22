const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Rota padrão para carregar o jogo
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

let players = {};
let projectiles = [];

io.on("connection", (socket) => {
    console.log(`Novo jogador conectado: ${socket.id}`);

    players[socket.id] = {
        x: Math.random() * 800,
        y: Math.random() * 600,
        angle: 0,
    };

    socket.emit("currentPlayers", players);
    socket.emit("setInitialPosition", players[socket.id]); // 🔥 Envia spawn correto

    socket.broadcast.emit("newPlayer", { id: socket.id, ...players[socket.id] });

    socket.on("updatePlayerFrame", (data) => {
        if (players[data.id]) {
            players[data.id].frameIndex = data.frameIndex;
            io.emit("updatePlayer", players[data.id]); // Envia a atualização para todos
        }
    });

    socket.on("move", (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].angle = data.angle;
            players[socket.id].frameIndex = data.frameIndex; // 🔥 Salvar frameIndex no servidor
            io.emit("updatePlayer", { id: socket.id, ...players[socket.id] });
        }
    });




    socket.on("shoot", (data) => {
        if (players[socket.id]) {
            let projectile = {
                id: socket.id,
                x: players[socket.id].x,
                y: players[socket.id].y,
                angle: data.angle,
                speed: 5,
            };
            projectiles.push(projectile);
            io.emit("newProjectile", projectile);
        }
    });

    socket.on("disconnect", () => {
        console.log(`Jogador desconectado: ${socket.id}`);
        delete players[socket.id];
        io.emit("removePlayer", socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);

});
