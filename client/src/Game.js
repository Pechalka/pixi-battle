

// game/Game.js
import * as PIXI from 'pixi.js';
import { AssetLoader } from './utils/AssetLoader.js';
import { CollisionSystem } from './utils/CollisionSystem.js';
import { Tank } from './entities/Tank.js';
import { Base } from './entities/Base.js';
import { Obstacle } from './entities/Obstacle.js';
import { io } from 'socket.io-client';



const MAP_CONFIG = {
    tileSize: 16,       // Удвоенный размер тайла
    mapWidth: 26,       // Ширина в тайлах (416px)
    mapHeight: 26,
    
    // Координаты кирпичей [gridX, gridY] (в клетках, не пикселях!)
    bricks: [
        // [1, 25], [2, 25], [3, 25], [4, 25], [5, 25], [6, 25], [7, 25], [8, 25], [9, 25],
        // верхние колоны
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
    
    // Координаты стальных стен
    steels: [
        [ 12, 5], [ 13, 5],
        [ 12, 6], [ 13, 6],

        // Стальной блок
        // [18, 5], [19, 5], [18, 6], [19, 6],
        // // Стальная стена
        // [22, 8], [22, 9], [22, 10]
    ],

    basePosition: [13, 25],  // Позиция базы [gridX, gridY]
    
    // Позиция игрока [gridX, gridY] (левая верхняя клетка танка 2×2)
    playerStart: [9, 25],

    enemyPositions: [
        [1, 1], [13, 1], [25, 1] 
    ]
};

export class Game {
    constructor(canvasElement, player, socket) {
        this.player = player;
        this.canvas = canvasElement;
        this.app = null;
        this.playerTank = null;
        this.playerTank2 = null;
        this.bullets = [];
        this.obstacles = []; // Массив препятствий
        this.mapGrid = null; // Сетка карты для быстрого доступа
        this.enemies = [];

        this.keysPressed = {};
        this.textures = {};
        this.base = {};
        this.socket = socket;

        this.mapConfig = MAP_CONFIG;

        this.gameBounds = { 
            x: 0, y: 0, 
            width: this.mapConfig.mapWidth * this.mapConfig.tileSize,
            height: this.mapConfig.mapHeight * this.mapConfig.tileSize
        };
        this.score = 0;

// console.log('Game constructor');
        this.init();
        this.setupSocketListeners();

    }

    setupSocketListeners() {
        this.socket.on('tank-update2', (data) => {
            if (this.player === '1' && this.playerTank2) {
                // Плавная интерполяция позиции
                this.interpolateTankPosition(this.playerTank2, data);
            }
        });
        
        // Получаем обновления позиции танка 1 от сервера
        this.socket.on('tank-update1', (data) => {
            if (this.player === '2' && this.playerTank) {
                this.interpolateTankPosition(this.playerTank, data);
            }
        });
    }

    interpolateTankPosition(tank, data) {
        // const targetX = data.x;
        // const targetY = data.y;
        // const targetDirection = data.direction;
        
        // // Обновляем направление
        // if (tank.direction !== targetDirection) {
        //     tank.direction = targetDirection;
        //     tank.updateSpriteByDirection();
        // }
        
        // // Плавное движение к цели
        // tank.sprite.x = targetX;
        // tank.sprite.y = targetY;
        // tank.updateHitbox();
        tank.remoteUpdate(data);
    }
    
    async init() {
        console.log('Инициализация игры...');
        
        try {
            // 1. Создаём приложение PixiJS
            this.app = new PIXI.Application();
            
            await this.app.init({
                canvas: this.canvas,
                width: this.gameBounds.width,
                height: this.gameBounds.height,
                backgroundColor: 0x000000,
                resolution: 1,
            });
            
            console.log('PixiJS инициализирован');
            
            // 2. Загружаем ресурсы
            this.textures = await AssetLoader.loadAssets();
            
            // 3. Инициализируем сетку карты 
            this.initMapGrid();
            
            this.socket.emit('start');

            this.socket.on('game-init', state => {
                this.createGame(state);
                this.startGameLoop();
            })


            
            this.setupControls();
            

        } catch (error) {
            console.error('Ошибка инициализации игры:', error);
        }
    }
    
    // Инициализация сетки карты
    initMapGrid() {
        const { mapWidth, mapHeight } = this.mapConfig;
        this.mapGrid = Array(mapHeight).fill().map(
            () => Array(mapWidth).fill(null)
        );
    }
    
    createGame(state) {
        // Создаём карту
        this.createObstacles(state);

        // Создаём танк игрока
        this.createPlayer(state);

        // Создаём базу
        this.createBase();
    }
    

    createDebugGrid() {    
        const grid = new PIXI.Graphics();
        
        // 1. Тестовый квадрат
        grid.rect(0, 0, this.gameBounds.width, this.gameBounds.height);
        grid.fill(0x00FF00);
        
        // 2. Красная рамка
        grid.rect(0, 0, this.gameBounds.width, this.gameBounds.height);
        grid.stroke({
            width: 2,
            color: 0xFF0000,
            alpha: 1
        });
        
        // 3. Сетка - используем setStrokeStyle перед рисованием
        const { tileSize } = this.mapConfig;
        
        // Устанавливаем стиль для сетки
        grid.setStrokeStyle({
            width: 1,
            color: 0x333333,
            alpha: 0.3
        });
        
        // Рисуем вертикальные линии
        for (let x = 0; x <= this.gameBounds.width; x += tileSize) {
            grid.moveTo(x, 0);
            grid.lineTo(x, this.gameBounds.height);
        }
        
        // Рисуем горизонтальные линии
        for (let y = 0; y <= this.gameBounds.height; y += tileSize) {
            grid.moveTo(0, y);
            grid.lineTo(this.gameBounds.width, y);
        }
        
        // Завершаем stroke
        grid.stroke();
        
        this.app.stage.addChild(grid);
    }


    createObstacles() {
        const { tileSize, bricks, steels } = this.mapConfig;
        
        // Создаём кирпичные стены из конфигурации
        bricks.forEach(([gridX, gridY]) => {
            this.addObstacle('brick', gridX * tileSize, gridY * tileSize);
        });
        
        // Создаём стальные стены из конфигурации
        steels.forEach(([gridX, gridY]) => {
            this.addObstacle('steel', gridX * tileSize, gridY * tileSize);
        });
    }

 
    addObstacle(type, x, y) {
        const { tileSize, mapWidth, mapHeight } = this.mapConfig;
        
        // Проверяем, что координаты в пределах карты
        const gridX = Math.floor(x / tileSize);
        const gridY = Math.floor(y / tileSize);
        
        if (gridX < 0 || gridX >= mapWidth || gridY < 0 || gridY >= mapHeight) {
            console.warn(`Недопустимые координаты препятствия: ${x}, ${y}`);
            return null;
        }
        
        // Проверяем, не занята ли уже эта ячейка
        if (this.mapGrid[gridY][gridX]) {
            console.warn(`Ячейка ${gridX}, ${gridY} уже занята`);
            return null;
        }
        
        let obstacle;
        switch(type) {
            case 'brick':
                obstacle = new Obstacle(this.textures, x, y, 'brick', tileSize);
                obstacle.health = 2; // Кирпич разрушается с одного попадания
                break;
            case 'steel':
                obstacle = new Obstacle(this.textures, x, y, 'steel', tileSize);
                obstacle.health = 999; // Сталь практически неуничтожима
                break;
            case 'spark':
                obstacle = new Obstacle(this.textures, x, y, 'spark', tileSize);
                obstacle.health = 2; // Сталь практически неуничтожима
                break;
            default:
                return null;
        }
        
        // Записываем в сетку карты
        this.mapGrid[gridY][gridX] = {
            obstacle: obstacle,
            type: type
        };
        
        this.obstacles.push(obstacle);
        this.app.stage.addChild(obstacle.sprite);
        
        return obstacle;
    }

    // Удаление препятствия из сетки
    removeObstacleFromGrid(x, y) {
        const { tileSize } = this.mapConfig;
        const gridX = Math.floor(x / tileSize);
        const gridY = Math.floor(y / tileSize);
        
        if (gridX >= 0 && gridX < this.mapGrid[0].length && 
            gridY >= 0 && gridY < this.mapGrid.length) {
            this.mapGrid[gridY][gridX] = null;
            return true;
        }
        return false;
    }

    // Получение препятствия по координатам
    getObstacleAt(x, y) {
        const { tileSize } = this.mapConfig;
        const gridX = Math.floor(x / tileSize);
        const gridY = Math.floor(y / tileSize);
        
        if (gridX >= 0 && gridX < this.mapGrid[0].length && 
            gridY >= 0 && gridY < this.mapGrid.length) {
            const cell = this.mapGrid[gridY][gridX];
            return cell ? cell.obstacle : null;
        }
        return null;
    }

    createEnemies() {
        const { tileSize, enemyPositions } = this.mapConfig;
        
        enemyPositions.forEach(([x, y]) => {
            const enemy = new Tank(this.textures.playerTankUp1, x * tileSize, y * tileSize, false);
            enemy.textures = this.textures;

            this.enemies.push(enemy);
            this.app.stage.addChild(enemy.sprite);
        });
    }

    createPlayer(state) {
        const { player1, player2 } = state;

        // const { tileSize, playerStart } = this.mapConfig;

        // const [x, y] = playerStart;

        // Ставим игрока в безопасное место (рядом с низом)
        this.playerTank = new Tank(this.textures.playerTankUp1, 
                                //   x * tileSize, 
                                //   y * tileSize,
                                player1.x,
                                player1.y, 
                                  true);

        // Устанавливаем текстуры для анимации
        this.playerTank.setTextures(this.textures);
        
        this.playerTank.direction = player1.direction;


        this.app.stage.addChild(this.playerTank.sprite);

        this.playerTank.updateSpriteByDirection();


        // const x = 17;
        // const y = 25;

        // console.log(x * tileSize, y * tileSize)

        this.playerTank2 = new Tank(this.textures.playerTankUp1, 
                                  player2.x, 
                                  player2.y,
                                // player1.x,
                                // player1.y, 
                                  true, 'playerTank2');
        this.playerTank2.direction = player2.direction;

        this.playerTank2.setTextures(this.textures);
        this.app.stage.addChild(this.playerTank2.sprite);
        this.playerTank2.updateSpriteByDirection();

    }

    createBase() {
        const { tileSize, basePosition } = this.mapConfig;
        const [x, y] = basePosition;

        this.base = new Base(this.textures.base, this.textures.brick, x * tileSize, y * tileSize, tileSize);
                this.base.setDestroyedTexture(this.textures.baseDestroyed);        
                this.app.stage.addChild(this.base.container);
    }
    
    setupControls() {
        const keydownHandler = (e) => {
            this.keysPressed[e.key.toLowerCase()] = true;
            
            if (e.key === ' ') {
                this.playerShoot();
            }
        };
        
        const keyupHandler = (e) => {
            this.keysPressed[e.key.toLowerCase()] = false;
        };
        
        window.addEventListener('keydown', keydownHandler);
        window.addEventListener('keyup', keyupHandler);
        
        // Сохраняем ссылки для удаления
        this.keydownHandler = keydownHandler;
        this.keyupHandler = keyupHandler;
    }
    
    playerShoot() {
        if (this.player == '1') {
            if (!this.playerTank || this.playerTank.isDestroyed) return;
            
            const bullet = this.playerTank.shoot(this.textures.bullet);
            if (bullet) {
                this.app.stage.addChild(bullet.sprite);
                this.bullets.push(bullet);
            }
        }

        if (this.player == '2') {
            if (!this.playerTank2 || this.playerTank2.isDestroyed) return;
            
            const bullet = this.playerTank2.shoot(this.textures.bullet);
            if (bullet) {
                this.app.stage.addChild(bullet.sprite);
                this.bullets.push(bullet);
            }
        }
    }
    
    startGameLoop() {
        this.app.ticker.add(() => {
            this.update();
        });
    }
    
    update() {
        if (!this.playerTank || this.playerTank.isDestroyed) {
            this.gameOver();
            return;
        }
        
        // Обновляем игрока
        this.updatePlayer();

        this.updateEnemies()
        
        // Обновляем снаряды
        this.updateBullets();
    }

updateEnemies() {
    // Простая ИИ для врагов
    this.enemies.forEach((enemy, index) => {
        if (enemy.isDestroyed) return;
        
        // Создаём массив всех объектов для коллизий
        const allObstacles = [...this.obstacles.filter(o => !o.canDriveThrough)];
        if (this.base && !this.base.isDestroyed) {
            allObstacles.push(this.base);
        }
        
        // Добавляем игрока как препятствие
        const allCollisionObjects = [...allObstacles];
        if (this.playerTank && !this.playerTank.isDestroyed) {
            allCollisionObjects.push(this.playerTank);
        }
        
        // Добавляем других врагов как препятствия
        const otherEnemies = this.enemies.filter((e, i) => 
            i !== index && !e.isDestroyed
        );
        
        const allObstaclesForEnemy = [...allCollisionObjects, ...otherEnemies];
        
        // Движение в случайном направлении
        if (Math.random() < 0.02) { // 2% шанс сменить направление
            const directions = ['up', 'down', 'left', 'right'];
            enemy.direction = directions[Math.floor(Math.random() * directions.length)];
        }
        
        // Двигаем врага с проверкой коллизий
        enemy.move(enemy.direction, allObstaclesForEnemy);
        
        // Проверяем границы для врага
        const boundsCheck = CollisionSystem.checkBoundaryCollision(
            enemy.sprite, 
            this.gameBounds
        );
        
        if (boundsCheck.left || boundsCheck.right || boundsCheck.top || boundsCheck.bottom) {
            enemy.direction = this.getOppositeDirection(enemy.direction);
        }
        
        // Случайный выстрел
        if (Math.random() < 0.01 && enemy.canShoot) { // 1% шанс выстрелить
            const bullet = enemy.shoot(this.textures.bullet);
            if (bullet) {
                this.app.stage.addChild(bullet.sprite);
                this.bullets.push(bullet);
            }
        }
    });
}
    
    getOppositeDirection(dir) {
        switch(dir) {
            case 'up': return 'down';
            case 'down': return 'up';
            case 'left': return 'right';
            case 'right': return 'left';
        }
        return dir;
    }
    
    updatePlayer() {
        let moved = false;
        
        const aliveEnemies = this.enemies.filter(enemy => !enemy.isDestroyed);

// Создаём массив препятствий включая базу
        const allObstacles = [...this.obstacles.filter(o => !o.canDriveThrough), ...aliveEnemies];
        if (this.base && !this.base.isDestroyed) {
            allObstacles.push(this.base);
        }
        
        if (this.player == '1') {
            if (this.keysPressed['w'] || this.keysPressed['arrowup']) {
                moved = this.playerTank.move('up', allObstacles);
            }
            if (this.keysPressed['s'] || this.keysPressed['arrowdown']) {
                moved = this.playerTank.move('down', allObstacles);
            }
            if (this.keysPressed['a'] || this.keysPressed['arrowleft']) {
                moved = this.playerTank.move('left', allObstacles);
            }
            if (this.keysPressed['d'] || this.keysPressed['arrowright']) {
                moved = this.playerTank.move('right', allObstacles);
            }

                        // Проверяем границы экрана
            const boundsCheck = CollisionSystem.checkBoundaryCollision(
                this.playerTank.sprite, 
                this.gameBounds
            );
            
            if (boundsCheck.left || boundsCheck.right || boundsCheck.top || boundsCheck.bottom) {
                // Отталкиваем от границы
                if (boundsCheck.left) this.playerTank.sprite.x = this.gameBounds.x + this.playerTank.sprite.width * this.playerTank.sprite.anchor.x;
                if (boundsCheck.right) this.playerTank.sprite.x = this.gameBounds.width - this.playerTank.sprite.width * (1 - this.playerTank.sprite.anchor.x);
                if (boundsCheck.top) this.playerTank.sprite.y = this.gameBounds.y + this.playerTank.sprite.height * this.playerTank.sprite.anchor.y;
                if (boundsCheck.bottom) this.playerTank.sprite.y = this.gameBounds.height - this.playerTank.sprite.height * (1 - this.playerTank.sprite.anchor.y);
                
                this.playerTank.updateHitbox();
            }

            if (moved) {
                const { direction, sprite } = this.playerTank;

                this.socket.emit('tank-update1', { direction, x: sprite.x, y: sprite.y })
                // console.log(this.playerTank)
            }
            
            // Если танк не двигался в этом кадре, останавливаем анимацию
            if (!moved && this.playerTank.isMoving) {
                this.playerTank.stopAnimation();
            }

            if (this.playerTank2.lastPos && this.playerTank2.lastPos.y == this.playerTank2.sprite.y && this.playerTank2.lastPos.x == this.playerTank2.sprite.x) {
                this.playerTank2.stopAnimation();
            }
        }

        if (this.player == '2') {
            if (this.keysPressed['w'] || this.keysPressed['arrowup']) {
                moved = this.playerTank2.move('up', allObstacles);
            }
            if (this.keysPressed['s'] || this.keysPressed['arrowdown']) {
                moved = this.playerTank2.move('down', allObstacles);
            }
            if (this.keysPressed['a'] || this.keysPressed['arrowleft']) {
                moved = this.playerTank2.move('left', allObstacles);
            }
            if (this.keysPressed['d'] || this.keysPressed['arrowright']) {
                moved = this.playerTank2.move('right', allObstacles);
            }

                        // Проверяем границы экрана
            const boundsCheck = CollisionSystem.checkBoundaryCollision(
                this.playerTank2.sprite, 
                this.gameBounds
            );
            
            if (boundsCheck.left || boundsCheck.right || boundsCheck.top || boundsCheck.bottom) {
                // Отталкиваем от границы
                if (boundsCheck.left) this.playerTank2.sprite.x = this.gameBounds.x + this.playerTank2.sprite.width * this.playerTank2.sprite.anchor.x;
                if (boundsCheck.right) this.playerTank2.sprite.x = this.gameBounds.width - this.playerTank2.sprite.width * (1 - this.playerTank2.sprite.anchor.x);
                if (boundsCheck.top) this.playerTank2.sprite.y = this.gameBounds.y + this.playerTank2.sprite.height * this.playerTank2.sprite.anchor.y;
                if (boundsCheck.bottom) this.playerTank2.sprite.y = this.gameBounds.height - this.playerTank2.sprite.height * (1 - this.playerTank2.sprite.anchor.y);
                
                this.playerTank2.updateHitbox();
            }

            if (moved) {
                const { direction, sprite } = this.playerTank2;

                this.socket.emit('tank-update2', { direction, x: sprite.x, y: sprite.y })
                // console.log(this.playerTank)
            }
            
            // Если танк не двигался в этом кадре, останавливаем анимацию
            if (!moved && this.playerTank2.isMoving) {
                this.playerTank2.stopAnimation();
            }

            if (this.playerTank.lastPos && this.playerTank.lastPos.y == this.playerTank.sprite.y && this.playerTank.lastPos.x == this.playerTank.sprite.x) {
                this.playerTank.stopAnimation();
            }

        }
        

    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // КРИТИЧНО: проверяем существует ли пуля и её спрайт
            if (!bullet || !bullet.sprite || bullet.isDestroyed) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Проверяем что спрайт ещё прикреплён к сцене
            if (!bullet.sprite.parent) {
                this.bullets.splice(i, 1);
                continue;
            }

            // Двигаем снаряд
            switch(bullet.direction) {
                case 'up': bullet.sprite.y -= bullet.speed; break;
                case 'down': bullet.sprite.y += bullet.speed; break;
                case 'left': bullet.sprite.x -= bullet.speed; break;
                case 'right': bullet.sprite.x += bullet.speed; break;
            }
            
            // ВАЖНО: Проверяем коллизии ДО проверки границ!
            // Если пуля попала во что-то, она удаляется в checkBulletObstacleCollision
            const hitSomething = this.checkBulletObstacleCollision(bullet, i);
            
            // Если пуля ещё существует (не попала в препятствие), проверяем границы

            if (!hitSomething && i < this.bullets.length && this.bullets[i] === bullet) {
                this.checkBulletBoundaries(bullet, i);
            }

            // TODO
            // if (hitSomething) {
            //     this.mapGrid[y][x]
            // }

            if (bullet.isPlayer) {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    
                    if (!enemy || enemy.isDestroyed || !enemy.sprite) {
                        continue;
                    }
                    
                    if (CollisionSystem.checkBulletCollision(bullet, enemy.sprite)) {
                        console.log('Пуля попала во врага');
                        const destroyed = enemy.takeDamage(1);
                        
                        this.app.stage.removeChild(bullet.sprite);
                        this.bullets.splice(i, 1);

                        if (destroyed) {
                            this.enemies.splice(j, 1);
                            this.score += 100;
                            if (this.onScoreUpdate) {
                                this.onScoreUpdate(this.score);
                            }
                        }
                        break;
                    }
                }
            } else {
                if (CollisionSystem.checkBulletCollision(bullet, this.playerTank.sprite)) {
                    const destroyed = this.playerTank.takeDamage(1);
                    
                    this.app.stage.removeChild(bullet.sprite);
                    this.bullets.splice(i, 1);
                    
                    if (destroyed) {
                        this.gameOver();
                    }
                }
            }
        }

        
    }

checkBulletObstacleCollision(bullet, bulletIndex) {
        const bulletX = bullet.sprite.x;
        const bulletY = bullet.sprite.y + (bullet.sprite.height / 2);
        const { tileSize } = this.mapConfig;

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
            x >= 0 && x <= this.mapGrid[0].length &&
            y >= 0 && y <= this.mapGrid.length
        );

        let hitSomething = false;
        
        // 5. Разрушаем кирпичи в этих клетках
        for (const { x, y } of validCells) {
            // Получаем препятствие из сетки            
            let obstacle = null;
            if (y >= 0 && y < this.mapGrid.length + 1 &&
                x >= 0 && x < this.mapGrid[0].length + 1) {
                let cell = null;
                if (this.mapGrid[y - 1]) {
                    cell = this.mapGrid[y - 1][x - 1];
                }
                obstacle = cell ? cell.obstacle : null;
            }
            if (!obstacle || obstacle.isDestroyed) continue;
            
            if (obstacle.type === 'steel') {
                // Пуля уничтожается о сталь
                this.removeBullet(bullet, bulletIndex);
                return true;
            }
            // Для кирпича - разрушаем
            const destroyed = obstacle.takeDamage(1, bullet.direction);
            this.removeBullet(bullet, bulletIndex);

            if (destroyed) {
                // Удаляем из сетки карты
                this.mapGrid[y - 1][x - 1] = null;

                // Удаляем из массива препятствий
                const obstacleIndex = this.obstacles.indexOf(obstacle);
                if (obstacleIndex !== -1) {
                    this.obstacles.splice(obstacleIndex, 1);
                }
            }
            hitSomething = true;
        }

        if (hitSomething) {
            return true;
        }
        // Проверяем коллизию с базой
        if (this.base && !this.base.isDestroyed) {

            // Затем проверяем попадание в орла
            if (CollisionSystem.checkBulletCollision(bullet, this.base.spriteEagle)) {
                const destroyed = this.base.takeDamage(1);
                this.removeBullet(bullet, bulletIndex);

                if (destroyed) {
                    // Заменяем орла на уничтоженную базу
                    this.base.replaceWithDestroyed();
                    this.gameOver();
                }
                return true;
            }
        }
        return false;
    }

    checkBulletBoundaries(bullet, bulletIndex) {
        // Удаляем снаряд за границами
        if (bullet.sprite.x < -50 || bullet.sprite.x > this.gameBounds.width + 50 || 
            bullet.sprite.y < -50 || bullet.sprite.y > this.gameBounds.height + 50) {
            this.removeBullet(bullet, bulletIndex);
        }
    }

    removeBullet(bullet, index) {
        
        this.createExplosion(bullet);

        if (bullet.sprite && bullet.sprite.parent) {
            this.app.stage.removeChild(bullet.sprite);
        }
        
        if (index < this.bullets.length && this.bullets[index] === bullet) {
            this.bullets.splice(index, 1);
        }
    }

    createExplosion(bullet) {
        const explosionTextures = [
            this.textures.explosionSmall,
            this.textures.explosionMiddle,
            this.textures.explosionBig
        ];

        const explosion = new PIXI.AnimatedSprite(explosionTextures);

        explosion.anchor.set(0.5);
        explosion.x = bullet.sprite.x;
        explosion.y = bullet.sprite.y;
        explosion.scale.set(1.5);

        explosion.loop = false;
        explosion.animationSpeed = 0.5;

        explosion.onComplete = () => {
            explosion.destroy();
        }

        this.app.stage.addChild(explosion);
        explosion.play();
    }

    gameOver() {
        console.log('Игра окончена! Счёт:', this.score);
        
        // Экран Game Over
        const gameOverText = new PIXI.Text({
            text: `GAME OVER\nScore: ${this.score}`,
            style: {
                fill: 0xFF0000,
                fontSize: 48,
                align: 'center'
            }
        });
        
        gameOverText.anchor.set(0.5);
        gameOverText.x = this.gameBounds.width / 2;
        gameOverText.y = this.gameBounds.height / 2;
        
        
        this.app.stage.addChild(gameOverText);

        
        // Останавливаем игру
        this.app.ticker.stop();
    }
    
    destroy() {
        // console.log('destroy Game');
        // if (this.app) {
        //     this.app.destroy(true, {
        //         children: true,
        //         texture: true,
        //         baseTexture: true,
        //     });
        // }
        if (this.keydownHandler) {
            window.removeEventListener('keydown', this.keydownHandler);
        }
        
        if (this.keyupHandler) {
            window.removeEventListener('keyup', this.keyupHandler);
        }
    }
}