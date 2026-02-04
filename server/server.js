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

const createBrick = (x, y) => {
    return {
        x: x,
        y: y,
        health: 2, // 2 попадания для уничтожения
        type: 'brick'
    };
};

const newGame = () => {
    const gameState = {
        player1: { x: 144, y: 400, direction: 'up' },
        player2: { x: 272, y: 400, direction: 'up' },
        bricks: [
            [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9],
            [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9],

            [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8], [6, 9],
            [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [7, 8], [7, 9],

            [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [10, 8],
            [11, 2], [11, 3], [11, 4], [11, 5], [11, 6], [11, 7], [11, 8],

            [14, 2], [14, 3], [14, 4], [14, 5], [14, 6], [14, 7], [14, 8],
            [15, 2], [15, 3], [15, 4], [15, 5], [15, 6], [15, 7], [15, 8],

            [18, 2], [18, 3], [18, 4], [18, 5], [18, 6], [18, 7], [18, 8], [18, 9],
            [19, 2], [19, 3], [19, 4], [19, 5], [19, 6], [19, 7], [19, 8], [19, 9],

            [22, 2], [22, 3], [22, 4], [22, 5], [22, 6], [22, 7], [22, 8], [22, 9],
            [23, 2], [23, 3], [23, 4], [23, 5], [23, 6], [23, 7], [23, 8], [23, 9],

            // нижние колоны
            [2, 16], [2, 17], [2, 18], [2, 19], [2, 20], [2, 21], [2, 22], [2, 23],
            [3, 16], [3, 17], [3, 18], [3, 19], [3, 20], [3, 21], [3, 22], [3, 23],

            [6, 16], [6, 17], [6, 18], [6, 19], [6, 20], [6, 21], [6, 22], [6, 23],
            [7, 16], [7, 17], [7, 18], [7, 19], [7, 20], [7, 21], [7, 22], [7, 23],

            [10, 14], [10, 15], [10, 16], [10, 17], [10, 18], [10, 19], [10, 20],
            [11, 14], [11, 15], [11, 16], [11, 17], [11, 18], [11, 19], [11, 20], 

            [14, 14], [14, 15], [14, 16], [14, 17], [14, 18], [14, 19], [14, 20],
            [15, 14], [15, 15], [15, 16], [15, 17], [15, 18], [15, 19], [15, 20],

            [18, 16], [18, 17], [18, 18], [18, 19], [18, 20], [18, 21], [18, 22], [18, 23],
            [19, 16], [19, 17], [19, 18], [19, 19], [19, 20], [19, 21], [19, 22], [19, 23],

            [22, 16], [22, 17], [22, 18], [22, 19], [22, 20], [22, 21], [22, 22], [22, 23],
            [23, 16], [23, 17], [23, 18], [23, 19], [23, 20], [23, 21], [23, 22], [23, 23],

            // вокруг базы
            [11, 25], [11, 24], [11, 23], [12, 23], [13, 23], [14, 23], [14, 24], [14, 25]
        ],
        bullets: [],
        lastUpdate: Date.now()
    };
    
    return gameState;
}

const TILE_SIZE = 16;
const MAP_WIDTH = 26;
const MAP_HEIGHT = 26;
const BULLET_SPEED = 8;

const createBullet = (player, direction) => {
    const bullet = {
        id: Math.random().toString(36).substr(2, 9),
        player: player,
        x: player.x,
        y: player.y,
        direction: direction,
        speed: BULLET_SPEED,
        createdAt: Date.now()
    };
    
    switch(direction) {
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
    
    return bullet;
}

const updateBullets = (gameState) => {
    const bullets = gameState.bullets;
    const bricks = gameState.bricks;
    
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Движение пули
        switch(bullet.direction) {
            case 'up':
                bullet.y -= bullet.speed;
                break;
            case 'down':
                bullet.y += bullet.speed;
                break;
            case 'left':
                bullet.x -= bullet.speed;
                break;
            case 'right':
                bullet.x += bullet.speed;
                break;
        }
        
        // Проверка выхода за границы
        if (bullet.x < 0 || bullet.x >= MAP_WIDTH * TILE_SIZE || 
            bullet.y < 0 || bullet.y >= MAP_HEIGHT * TILE_SIZE) {
            bullets.splice(i, 1);
            continue;
        }
        
        // Проверка попадания в кирпичи
        const gridX = Math.floor(bullet.x / TILE_SIZE);
        const gridY = Math.floor(bullet.y / TILE_SIZE);
        
        const hitResult = checkBrickHit(gridX, gridY, bullet.direction, bricks);
        if (hitResult) {
            // Обрабатываем попадание
            processBrickHit(gameState, hitResult, bullet);
            
            // Удаляем пулю
            bullets.splice(i, 1);
            continue;
        }
    }
}

const checkBrickHit = (gridX, gridY, direction, bricks) => {
    const cellsToCheck = [];
    
    // Определяем какие клетки проверять в зависимости от направления
    switch(direction) {
        case 'up':
        case 'down':
            cellsToCheck.push([gridX, gridY], [gridX + 1, gridY]);
            break;
        case 'left':
        case 'right':
            cellsToCheck.push([gridX, gridY], [gridX, gridY + 1]);
            break;
    }
    
    // Проверяем все клетки
    for (const [x, y] of cellsToCheck) {
        const brickIndex = bricks.findIndex(brick => brick.x === x && brick.y === y);
        if (brickIndex !== -1) {
            return {
                x: x,
                y: y,
                brickIndex: brickIndex,
                brick: bricks[brickIndex]
            };
        }
    }
    
    return null;
}

const processBrickHit = (gameState, hitResult, bullet) => {
    const brick = hitResult.brick;
    
    // Уменьшаем здоровье кирпича
    brick.health -= 1;
    
    if (brick.health <= 0) {
        // Кирпич полностью уничтожен
        gameState.bricks.splice(hitResult.brickIndex, 1);
        
        // Отправляем событие уничтожения
        io.to(gameState.id).emit('brick-destroyed', {
            gridX: brick.x,
            gridY: brick.y
        });
    } else {
        // Кирпич поврежден, но ещё жив
        io.to(gameState.id).emit('brick-damaged', {
            gridX: brick.x,
            gridY: brick.y,
            health: brick.health,
            direction: bullet.direction
        });
    }
}


const games = {};
const gameLoops = {};

io.on("connection", async (socket) => {
    const { gameId, playerColor, uid } = socket.handshake.query;

    socket.join(gameId);

    socket.on('start', (data) => {
        console.log('gameId ', gameId);
        socket.emit('game-init', games[gameId]);
    })

    socket.on('tank-update1', (data) => {
        if (games[gameId]) {
            games[gameId].player1 = data;
            socket.to(gameId).emit('tank-update1', data);
        }
    })

    socket.on('tank-update2', (data) => {
        if (games[gameId]) {
            games[gameId].player2 = data;
            socket.to(gameId).emit('tank-update2', data);
        }
    })

    socket.on('player-shoot', (data) => {
        if (!games[gameId]) return;
        
        const gameState = games[gameId];
        const player = data.player === '1' ? gameState.player1 : gameState.player2;
        
        // Создаем пулю
        const bullet = {
            id: Date.now() + Math.random(),
            playerId: data.player,
            x: data.x,
            y: data.y,
            direction: data.direction,
            speed: BULLET_SPEED,
            createdAt: Date.now()
        };
        
        gameState.bullets.push(bullet);
        
        // Отправляем другим игрокам
        socket.to(gameId).emit('bullet-created', {
            id: bullet.id,
            x: data.x,
            y: data.y,
            direction: data.direction,
            isPlayer: data.player !== this.playerId // Определяем чья пуля
        });
    });

    socket.on('brick-destroyed', (data) => {
        if (!games[gameId]) return;
        
        const gameState = games[gameId];
        
        // Находим и удаляем кирпич
        const brickIndex = gameState.bricks.findIndex(
            brick => brick.x === data.gridX && brick.y === data.gridY
        );
        
        if (brickIndex !== -1) {
            gameState.bricks.splice(brickIndex, 1);
        }
        
        // Транслируем остальным игрокам
        socket.to(gameId).emit('brick-destroyed', data);
    });

    socket.on('brick-damaged', (data) => {
        if (!games[gameId]) return;
        
        // Транслируем повреждение кирпича
        socket.to(gameId).emit('brick-damaged', data);
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', gameId);
    });
})

app.get('/api/games', (req, res) => {
    const gamesData = Object.keys(games); 
    res.json(gamesData);
})

app.post('/api/games', (req, res) => {
    const gameId = new Date().getTime();
    games[gameId] = newGame();
    
    // Запускаем игровой цикл для новой игры
    startGameLoop(gameId);
    
    const gamesData = Object.keys(games); 
    res.json({ gameId });
});

const startGameLoop = (gameId) => {
    if (gameLoops[gameId]) {
        clearInterval(gameLoops[gameId]);
    }
    
    gameLoops[gameId] = setInterval(() => {
        const gameState = games[gameId];
        if (!gameState) {
            clearInterval(gameLoops[gameId]);
            return;
        }
        
        updateBullets(gameState);
        gameState.lastUpdate = Date.now();
        
        // Отправляем обновление пуль всем игрокам
        io.to(gameId).emit('bullets-update', {
            bullets: gameState.bullets,
            damagedBricks: gameState.damagedBricks
        });

        // Отправляем события поврежденных кирпичей
        if (gameState.brickDamagedEvents && gameState.brickDamagedEvents.length > 0) {
            io.to(gameId).emit('brick-damaged-events', gameState.brickDamagedEvents);
            gameState.brickDamagedEvents = [];
        }

        // Отправляем события уничтоженных кирпичей
        if (gameState.destroyedBricks && gameState.destroyedBricks.length > 0) {
            gameState.destroyedBricks.forEach(brick => {
                io.to(gameId).emit('brick-destroyed', { gridX: brick.x, gridY: brick.y });
            });
            gameState.destroyedBricks = [];
        }
    }, 1000 / 60); // 60 FPS
};


const PORT = 9000;

server.listen(PORT, () => {

})