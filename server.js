const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');


const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 🔥 Servir arquivos da pasta "public" (onde estará o index.html)
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());


// 🔥 Rota principal para carregar o jogo
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔥 Armazena os jogadores conectados
let players = {};

io.on('connection', (socket) => {
    console.log(`Novo jogador conectado: ${socket.id}`);

    // Adiciona o jogador à lista com uma posição aleatória
    players[socket.id] = {
        x: Math.random() * 800,
        y: Math.random() * 600,
        id: socket.id
    };

    // Envia a lista de jogadores para o novo jogador
    socket.emit('currentPlayers', players);

    // Informa os outros jogadores sobre o novo jogador
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Atualiza a posição do jogador quando ele se move
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            io.emit('playerMoved', { id: socket.id, x: data.x, y: data.y });
        }
    });

    // Remove o jogador ao desconectar
    socket.on('disconnect', () => {
        console.log(`Jogador desconectado: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// 🔥 Rodar o servidor na porta 3000
server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
