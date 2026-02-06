const GAME_CONFIG = {
    gameBounds: {
        width: 416,
        height: 416,
    },
    tileSize: 16, // Удвоенный размер тайла
    mapWidth: 26, // Ширина в тайлах (416px)
    mapHeight: 26,
};

const newGame = () => {
    const config = {
        bricks: [
            [2, 2],
            [2, 3],
            [2, 4],
            [2, 5],
            [2, 6],
            [2, 7],
            [2, 8],
            [2, 9],
            [3, 2],
            [3, 3],
            [3, 4],
            [3, 5],
            [3, 6],
            [3, 7],
            [3, 8],
            [3, 9],

            [6, 2],
            [6, 3],
            [6, 4],
            [6, 5],
            [6, 6],
            [6, 7],
            [6, 8],
            [6, 9],
            [7, 2],
            [7, 3],
            [7, 4],
            [7, 5],
            [7, 6],
            [7, 7],
            [7, 8],
            [7, 9],

            [10, 2],
            [10, 3],
            [10, 4],
            [10, 5],
            [10, 6],
            [10, 7],
            [10, 8],
            [11, 2],
            [11, 3],
            [11, 4],
            [11, 5],
            [11, 6],
            [11, 7],
            [11, 8],

            [14, 2],
            [14, 3],
            [14, 4],
            [14, 5],
            [14, 6],
            [14, 7],
            [14, 8],
            [15, 2],
            [15, 3],
            [15, 4],
            [15, 5],
            [15, 6],
            [15, 7],
            [15, 8],

            [18, 2],
            [18, 3],
            [18, 4],
            [18, 5],
            [18, 6],
            [18, 7],
            [18, 8],
            [18, 9],
            [19, 2],
            [19, 3],
            [19, 4],
            [19, 5],
            [19, 6],
            [19, 7],
            [19, 8],
            [19, 9],

            [22, 2],
            [22, 3],
            [22, 4],
            [22, 5],
            [22, 6],
            [22, 7],
            [22, 8],
            [22, 9],
            [23, 2],
            [23, 3],
            [23, 4],
            [23, 5],
            [23, 6],
            [23, 7],
            [23, 8],
            [23, 9],

            // нижние колоны

            [2, 16],
            [2, 17],
            [2, 18],
            [2, 19],
            [2, 20],
            [2, 21],
            [2, 22],
            [2, 23],
            [3, 16],
            [3, 17],
            [3, 18],
            [3, 19],
            [3, 20],
            [3, 21],
            [3, 22],
            [3, 23],

            [6, 16],
            [6, 17],
            [6, 18],
            [6, 19],
            [6, 20],
            [6, 21],
            [6, 22],
            [6, 23],
            [7, 16],
            [7, 17],
            [7, 18],
            [7, 19],
            [7, 20],
            [7, 21],
            [7, 22],
            [7, 23],

            [10, 14],
            [10, 15],
            [10, 16],
            [10, 17],
            [10, 18],
            [10, 19],
            [10, 20],
            [11, 14],
            [11, 15],
            [11, 16],
            [11, 17],
            [11, 18],
            [11, 19],
            [11, 20],

            [14, 14],
            [14, 15],
            [14, 16],
            [14, 17],
            [14, 18],
            [14, 19],
            [14, 20],
            [15, 14],
            [15, 15],
            [15, 16],
            [15, 17],
            [15, 18],
            [15, 19],
            [15, 20],

            [18, 16],
            [18, 17],
            [18, 18],
            [18, 19],
            [18, 20],
            [18, 21],
            [18, 22],
            [18, 23],
            [19, 16],
            [19, 17],
            [19, 18],
            [19, 19],
            [19, 20],
            [19, 21],
            [19, 22],
            [19, 23],

            [22, 16],
            [22, 17],
            [22, 18],
            [22, 19],
            [22, 20],
            [22, 21],
            [22, 22],
            [22, 23],
            [23, 16],
            [23, 17],
            [23, 18],
            [23, 19],
            [23, 20],
            [23, 21],
            [23, 22],
            [23, 23],

            [11, 25],
            [11, 24],
            [11, 23],
            [12, 23],
            [13, 23],
            [14, 23],
            [14, 24],
            [14, 25],
        ],

        steels: [
            [12, 5],
            [13, 5],
            [12, 6],
            [13, 6],
        ],
    };

    const now = Date.now();

    return createMapGrid(config, {
        player1: { x: 144, y: 400, direction: 'up', lastShot: now },
        player2: { x: 272, y: 400, direction: 'up', lastShot: now },
        lastUpdate: Date.now(),
        bullets: [],
        base: {
            x: 13 * 16, // 13-я клетка по X
            y: 25 * 16, // 25-я клетка по Y
            width: 32,   // 2 клетки по ширине
            height: 32,  // 2 клетки по высоте
            isDestroyed: false,
            health: 1    // Орел уничтожается с одного попадания
        },
    });
};

const createMapGrid = (config, state) => {
    state.mapGrid = Array(GAME_CONFIG.mapHeight)
        .fill()
        .map(() => Array(GAME_CONFIG.mapWidth).fill(null));

    config.bricks.forEach(([gridX, gridY]) => {
        state.mapGrid[gridY][gridX] = {
            type: 'brick',
            health: 2,
            isDestroyed: false,
        };
    });

    config.steels.forEach(([gridX, gridY]) => {
        state.mapGrid[gridY][gridX] = {
            type: 'steel',
            health: 9999,
            isDestroyed: false,
        };
    });

    return state;
};


const checkBoundaries = (bullet) => {
    return bullet.x < -50 ||
        bullet.x > GAME_CONFIG.gameBounds.width + 50 ||
        bullet.y < -50 ||
        bullet.y > GAME_CONFIG.gameBounds.height + 50;
}


// Упрощенная проверка коллизии с орлом
const checkBulletBaseCollisionSimple = (base, bullet) => {
    // Орёл занимает 2x2 клетки
    const baseLeft = base.x;
    const baseRight = base.x + base.width;
    const baseTop = base.y;
    const baseBottom = base.y + base.height;
    
    // Пуля имеет размер примерно 4x4 пикселя
    const bulletLeft = bullet.x - 2;
    const bulletRight = bullet.x + 2;
    const bulletTop = bullet.y - 2;
    const bulletBottom = bullet.y + 2;
    
    // AABB коллизия
    return bulletLeft < baseRight &&
           bulletRight > baseLeft &&
           bulletTop < baseBottom &&
           bulletBottom > baseTop;
};

const checkBulletCollisions = (state, bullet, i) => {
    const results = [];

    // 1. Проверяем попадание в орла
    if (!state.base.isDestroyed) {
        if (checkBulletBaseCollisionSimple(state.base, bullet)) {
            state.base.isDestroyed = true;
            state.bullets.splice(i, 1);
            results.push({
                type: 'base_destroyed',
                x: state.base.x,
                y: state.base.y
            });
            return results; // Пуля уничтожена, выходим
        }
    }

    const bulletX = bullet.x;
    const bulletY = bullet.y + 2
    // const { tileSize } = state.mapConfig;
    const tileSize = 16;

    // 1. Определяем центральную клетку попадания
    const centerGridX = Math.round(bulletX / tileSize);
    // console.log("centerGridX:", centerGridX);
    const centerGridY = Math.round(bulletY / tileSize);
    // console.log("centerGridY:", centerGridY);
    // 2. Определяем смещение внутри клетки (0-31)
    const offsetX = bulletX % tileSize;
    const offsetY = bulletY % tileSize;

    // 3. Какие клетки разрушать в зависимости от направления
    const cellsToDestroy = [];

    switch (bullet.direction) {
        case 'up':
        case 'down':
            // Вертикальный выстрел - разрушает 2 клетки по горизонтали
            cellsToDestroy.push({ x: centerGridX, y: centerGridY });
            cellsToDestroy.push({ x: centerGridX + 1, y: centerGridY });
            break;

        case 'left':
        case 'right':
            // Горизонтальный выстрел - разрушает 2 клетки по вертикали
            cellsToDestroy.push({ x: centerGridX, y: centerGridY });
            cellsToDestroy.push({ x: centerGridX, y: centerGridY + 1 });
            break;
    }

    // 4. Фильтруем клетки вне карты
    const validCells = cellsToDestroy.filter(({ x, y }) =>
        x >= 0 && x <= state.mapGrid[0].length &&
        y >= 0 && y <= state.mapGrid.length
    );


    for (const { x, y } of validCells) {
        // Получаем препятствие из сетки            
        let obstacle = null;
        if (y >= 0 && y < state.mapGrid.length + 1 &&
            x >= 0 && x < state.mapGrid[0].length + 1) {
            let cell = null;
            if (state.mapGrid[y - 1]) {
                cell = state.mapGrid[y - 1][x - 1];
            }
            obstacle = cell;
        }
        if (!obstacle || obstacle.isDestroyed) continue;

        state.bullets.splice(i, 1);

        if (state.mapGrid[y - 1][x - 1].type == 'brick') {
            if (obstacle.health == 1) {
                state.mapGrid[y - 1][x - 1] = null;
                results.push({
                    y: y - 1,
                    x: x - 1,
                    type: 'destroyed'
                })
            } else {
                state.mapGrid[y - 1][x - 1].health -= 1;
                state.mapGrid[y - 1][x - 1].direction = bullet.direction;
                results.push({
                    y: y - 1,
                    x: x - 1,
                    type: 'damaged',
                    direction: bullet.direction
                })
            }
        }
        if (state.mapGrid[y - 1][x - 1] && state.mapGrid[y - 1][x - 1].type === 'steel') {
            // Сталь не разрушается, но пуля уничтожается
            results.push({
                y: y - 1,
                x: x - 1,
                type: 'steel_hit'
            });
        }
    }

    return results;
}



const calculateState = (state, io, gameId) => {
    const now = Date.now();
    const dt = (now - state.lastUpdate) / 16; // нормализованное время

    if (!state.obstacles || state.obstacles.length > 0) {
        if (state.obstacles && state.obstacles.length > 0) {
            io.to(gameId).emit('obstacles-hit', state.obstacles);
        }

        state.obstacles = []; // Очищаем ТОЛЬКО в начале кадра
    }

    for (let i = state.bullets.length - 1; i >= 0; i--) {
        const bullet = state.bullets[i];

        if (bullet.isDestroyed) {
            state.bullets.splice(i, 1);
            continue;
        }

        // Двигаем пулю
        switch (bullet.direction) {
            case 'up':
                bullet.y -= bullet.speed * dt;
                break;
            case 'down':
                bullet.y += bullet.speed * dt;
                break;
            case 'left':
                bullet.x -= bullet.speed * dt;
                break;
            case 'right':
                bullet.x += bullet.speed * dt;
                break;
        }

        // Проверяем коллизии с картой
        state.obstacles = checkBulletCollisions(state, bullet, i);

        // // Проверяем границы
        if (checkBoundaries(bullet)) {
            state.bullets.splice(i, 1);
        }
    }

    state.lastUpdate = now;

    return state;
};



module.exports = { GAME_CONFIG, newGame, calculateState };
