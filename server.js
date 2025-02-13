const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 🔥 Servir arquivos da pasta "public" (onde estará o index.html)
app.use(express.static(path.join(__dirname, 'public')));

// 🔥 Rota principal para carregar o jogo
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔥 WebSocket: Gerenciar conexões de jogadores
io.on('connection', (socket) => {
    console.log(`Novo jogador conectado: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`Jogador desconectado: ${socket.id}`);
    });
});

// 🔥 Rodar o servidor na porta 3000
server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
