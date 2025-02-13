const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🔥 Permitir CORS para evitar bloqueios
app.use(cors());

const io = socketIo(server, {
    cors: {
        origin: "*",  // Permitir qualquer origem
        methods: ["GET", "POST"]
    }
});

// 🔥 Servir arquivos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// 🔥 Armazena jogadores conectados
let players = {};

io.on('connection', (socket) => {
    console.log(`Novo jogador conectado: ${socket.id}`);

    // Adiciona o jogador à lista
    players[socket.id] = {
        x: Math.random() * 800,
        y: Math.random() * 600,
        id: socket.id
    };

    // Envia a lista de jogadores ao novo jogador
    socket.emit('currentPlayers', players);

    // Informa os outros jogadores sobre o novo jogador
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Atualiza posição do jogador
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            io.emit('playerMoved', { id: socket.id, x: data.x, y: data.y });
        }
    });

    // Remove jogador ao desconectar
    socket.on('disconnect', () => {
        console.log(`Jogador desconectado: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// 🔥 Definir a porta do Railway
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
