const express = require('express');
const app = express();
const { Server } = require('socket.io');

const http = require('http');

const createServer = (httpServer) => {
	// const io = new Server(server);
	return new Server(httpServer, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
		},
	});
}


const server = http.createServer(app);
const io = createServer(server);


const { newGame, GAME_CONFIG, calculateState } = require('./Game');



const games = {};

const shootCooldown = 0.5 * 1000;

const playerShoot = (gameId, playerId) =>{
    if (!games[gameId]) return;
    
    const player = games[gameId]['player' + playerId];

    if (!player || player.isDestroyed ) return null;
    
    const now = Date.now();
    if (now - player.lastShot < shootCooldown) return null;
    
    player.lastShot = now;
    
    // Создаем пулю
    const bullet = {
        id: Date.now() + Math.random(),
        playerId: playerId,
        x: player.x,
        y: player.y,
        direction: player.direction,
        speed: 5,
        //this.bulletSpeed,
        isDestroyed: false
    };
    
    // Корректируем позицию пули в зависимости от направления
    switch(player.direction) {
        case 'up':
            bullet.y -= 20;
            break;
        case 'down':
            bullet.y += 20;
            break;
        case 'left':
            bullet.x -= 20;
            break;
        case 'right':
            bullet.x += 20;
            break;
    }
    
    games[gameId].bullets.push(bullet);
    return bullet;
}


  

io.on("connection", async (socket) => {
    const { gameId, player } = socket.handshake.query;

    socket.join(gameId);

    socket.on('start', (data) => {
        socket.emit('game-init', games[gameId]);
    })


    socket.on('tank-update1', (data) => {
        if (!games[gameId]) return;

        games[gameId].player1.y = data.y;
        games[gameId].player1.x = data.x;
        games[gameId].player1.direction = data.direction;
        io.to(gameId).emit('tank-update1', data);
    })

    socket.on('tank-update2', (data) => {
        if (!games[gameId]) return;

        games[gameId].player2.y = data.y;
        games[gameId].player2.x = data.x;
        games[gameId].player2.direction = data.direction;
        io.to(gameId).emit('tank-update2', data);
    })

    socket.on('bricks-update', (data) => {
        games[gameId].bricks = data;
    })

    socket.on('playerShoot', (data) => {
        playerShoot(gameId, player)
    })

    socket.on('game-over', () => {
        if (timers[gameId]) {
            clearInterval(timers[gameId]);
            delete games[gameId];
            delete timers[gameId];
        }
    })
    
    if (!games[gameId]) return;
    if (timers[gameId]) return;

    timers[gameId] = setInterval(() => {
        
        if (!games[gameId]) return;

        games[gameId] = calculateState(games[gameId], io, gameId);

       io.to(gameId).emit('game-state', games[gameId]);
    }, 1000 / 60);
})


app.get('/api/games', (req, res) => {
    const gamesData = Object.keys(games); 
    res.json(gamesData);
})

const timers = {};


app.post('/api/games', (req, res) => {
    const gameId = new Date().getTime();
    games[gameId] = newGame();

    res.json({ gameId });
});


const PORT = 9000;

server.listen(PORT, () => {

})