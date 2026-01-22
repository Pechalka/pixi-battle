import * as PIXI from 'pixi.js';
import { CollisionSystem } from '../utils/CollisionSystem.js';

export class Base {
    constructor(eagleTexture, wallTexture, x, y, tileSize = 32, player) {
        this.container = new PIXI.Container();
        this.container.x = x;
        this.container.y = y;

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
    
    takeDamage(damage) {
        this.health -= damage;
        
        if (this.health <= 0) {
            this.destroy();
            return true;
        }
        
        return false;
    }
    
    // Проверка попадания в кирпичи стены
    checkBrickHit(bullet) {
        for (let i = 0; i < this.bricks.length; i++) {
            const brick = this.bricks[i];
            
            if (brick.isDestroyed) continue;
            
            // Получаем глобальные границы кирпича
            const brickBounds = this.container.toGlobal(new PIXI.Point(brick.x, brick.y));
            const globalBrickBounds = {
                x: brickBounds.x,
                y: brickBounds.y,
                width: brick.width,
                height: brick.height
            };
            
            // Проверяем коллизию пули с кирпичом
            if (CollisionSystem.checkRectCollision(
                { x: bullet.sprite.x - 2, y: bullet.sprite.y - 2, width: 4, height: 4 },
                globalBrickBounds
            )) {
                // Уничтожаем кирпич
                this.destroyBrick(i);
                return true;
            }
        }
        
        return false;
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
        
        // Удаляем контейнер со сцены
        if (this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
    }
    
};
