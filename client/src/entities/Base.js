import * as PIXI from 'pixi.js';
import { CollisionSystem } from '../utils/CollisionSystem.js';

export class Base {
    constructor(eagleTexture, wallTexture, x, y, tileSize = 32, player) {
        this.container = new PIXI.Container();
        this.container.x = x;
        this.container.y = y;

        this.eagleTexture = eagleTexture;
        this.wallTexture = wallTexture;

        this.spriteEagle = new PIXI.Sprite(eagleTexture);
        this.spriteEagle.anchor.set(0.5);
        this.spriteEagle.position.set(0, 0);
        this.spriteEagle.width = 32;
        this.spriteEagle.height = 32;
        this.container.addChild(this.spriteEagle);
        
        // Массив для хранения кирпичей стены
        this.bricks = [];
        
        // Создаём стену из кирпичей вокруг орла
        this.createBrickWall(wallTexture, tileSize);
        
        this.health = 1; // Орёл уничтожается с одного попадания
        this.isDestroyed = false;
        this.canDriveThrough = false; // Нельзя проезжать через базу
        
        // Создаём хитбокс для орла (отдельно от стен)
        this.updateEagleHitbox();

    }
    
    createBrickWall(wallTexture, tileSize) {
        // Размер орла 32x32, создаём стену вокруг него
        // Стена будет на расстоянии 16 пикселей от орла
        const eagleSize = 32;
        const wallDistance = 16;
        const brickSize = 16;
        
        // Вычисляем границы стены
        const wallLeft = -(eagleSize / 2) - wallDistance;
        const wallRight = (eagleSize / 2) + wallDistance;
        const wallTop = -(eagleSize / 2) - wallDistance;
        const eagleBottom = (eagleSize / 2);
        
        // Создаём кирпичные блоки по периметру
        // Верхняя стена
        for (let x = wallLeft; x < wallRight; x += brickSize) {
            this.createBrick(wallTexture, x, wallTop, brickSize);
        }
        
        // Левая стена (заканчивается на уровне низа орла)
        for (let y = wallTop; y < eagleBottom; y += brickSize) {
            this.createBrick(wallTexture, wallLeft, y, brickSize);
        }
        
        // Правая стена (заканчивается на уровне низа орла)
        for (let y = wallTop; y < eagleBottom; y += brickSize) {
            this.createBrick(wallTexture, wallRight - brickSize, y, brickSize);
        }
    }
    
    createBrick(wallTexture, x, y, size) {
        const brick = new PIXI.Sprite(wallTexture);
        brick.x = x;
        brick.y = y;
        brick.width = size;
        brick.height = size;
        brick.isDestroyed = false;
        
        // Добавляем хитбокс для кирпича
        brick.hitbox = {
            x: brick.x,
            y: brick.y,
            width: brick.width,
            height: brick.height
        };
        
        this.container.addChild(brick);
        this.bricks.push(brick);
    }
    
    updateEagleHitbox() {
        // Хитбокс только для орла
        const eagleBounds = this.spriteEagle.getBounds();
        this.eagleHitbox = {
            x: eagleBounds.x,
            y: eagleBounds.y,
            width: eagleBounds.width,
            height: eagleBounds.height
        };
    }
    
    getEagleBounds() {
        return this.eagleHitbox;
    }
    
    getBricks() {
        return this.bricks.filter(brick => !brick.isDestroyed);
    }
    
    getBounds() {
        // Возвращаем объединённые границы всех кирпичей и орла
        if (this.isDestroyed) return null;
        
        const activeBricks = this.getBricks();
        if (activeBricks.length === 0) {
            // Если кирпичей нет, возвращаем границы орла
            return this.getEagleBounds();
        }
        
        // Вычисляем общие границы всех кирпичей
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        // Добавляем границы орла
        const eagleBounds = this.getEagleBounds();
        minX = Math.min(minX, eagleBounds.x);
        minY = Math.min(minY, eagleBounds.y);
        maxX = Math.max(maxX, eagleBounds.x + eagleBounds.width);
        maxY = Math.max(maxY, eagleBounds.y + eagleBounds.height);
        
        // Добавляем границы каждого кирпича
        for (const brick of activeBricks) {
            const brickGlobalBounds = this.container.toGlobal(new PIXI.Point(brick.x, brick.y));
            minX = Math.min(minX, brickGlobalBounds.x);
            minY = Math.min(minY, brickGlobalBounds.y);
            maxX = Math.max(maxX, brickGlobalBounds.x + brick.width);
            maxY = Math.max(maxY, brickGlobalBounds.y + brick.height);
        }
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    takeDamage(damage) {
        this.health -= damage;
        
        if (this.health <= 0) {
            this.destroy();
            return true;
        }
        
        return false;
    }
    
    // Проверка попадания в кирпичи стены (унифицированная с Game.js)
    checkBrickHit(bullet) {
        const bulletX = bullet.sprite.x;
        const bulletY = bullet.sprite.y;
        const tileSize = 16; // Размер кирпича
        
        // Определяем клетки для проверки как в Game.js
        const cellsToCheck = [];
        
        // Определяем клетку, в которой находится центр пули
        const centerGridX = Math.floor(bulletX / tileSize);
        const centerGridY = Math.floor(bulletY / tileSize);
        // В зависимости от направления, проверяем клетки перед пулей
        switch(bullet.direction) {
            case 'up':
                console.log("up");
                cellsToCheck.push({x: centerGridX, y: centerGridY - 1});
                cellsToCheck.push({x: centerGridX + 1, y: centerGridY - 1});
                break;
                
            case 'down':
                console.log("down");
                cellsToCheck.push({x: centerGridX, y: centerGridY + 1});
                cellsToCheck.push({x: centerGridX + 1, y: centerGridY + 1});
                break;
                
            case 'left':
                console.log("left");
                cellsToCheck.push({x: centerGridX - 1, y: centerGridY});
                cellsToCheck.push({x: centerGridX - 1, y: centerGridY + 1});
                break;
                
            case 'right':
                
                cellsToCheck.push({x: centerGridX + 1, y: centerGridY});
                cellsToCheck.push({x: centerGridX + 1, y: centerGridY + 1});
                console.log("cellsToCheck", cellsToCheck);
                break;
        }
        
        let hitSomething = false;
        
        for (const {x, y} of cellsToCheck) {
            // Проверяем попадание в кирпичи
            for (let i = 0; i < this.bricks.length; i++) {
                const brick = this.bricks[i];
                
                if (brick.isDestroyed) continue;
                
                // Получаем позицию кирпича в глобальных координатах
                const brickGlobalX = this.container.x + brick.x;
                const brickGlobalY = this.container.y + brick.y;
                
                // Определяем клетку кирпича
                const brickGridX = Math.floor(brickGlobalX / tileSize);
                const brickGridY = Math.floor(brickGlobalY / tileSize);
                
                // console.log("brickGridX", brickGridX, "gridX", x);
                // Проверяем совпадение клеток
                if (brickGridX === x && brickGridY === y) {
                    
                    this.destroyBrick(i);
                    hitSomething = true;
                    break;
                }
            }
        }
        
        return hitSomething;
    }
    
    // Уничтожение кирпича
    destroyBrick(index) {
        
        
        const brick = this.bricks[index];
        if (!brick || brick.isDestroyed) return;
        
        brick.isDestroyed = true;
        
        // Удаляем спрайт кирпича
        if (brick.parent) {
            brick.parent.removeChild(brick);
        }
        
        // Обновляем хитбокс орла (если нужно)
        this.updateEagleHitbox();
    }
    
    destroy() {
        this.isDestroyed = true;
        this.canDriveThrough = true; // Теперь можно проезжать через уничтоженную базу
        
        // Заменяем орла на уничтоженную базу
        this.spriteEagle.texture = this.eagleTexture;
        // Находим текстуру уничтоженной базы из AssetLoader
        // Это будет установлено извне через метод setDestroyedTexture
    }
    
    setDestroyedTexture(destroyedTexture) {
        this.destroyedTexture = destroyedTexture;
    }
    
    replaceWithDestroyed() {
        if (this.destroyedTexture) {
            this.spriteEagle.texture = this.destroyedTexture;
        }
    }
    
};
