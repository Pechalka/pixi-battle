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
        
        // Создаём стену из кирпичей вокруг орла
        this.createBrickWall(wallTexture, tileSize);
        
        this.health = 3;
        this.isDestroyed = false;
        
        // Создаём хитбокс для базы
        this.updateHitbox();

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
        this.container.addChild(brick);
    }
    
    updateHitbox() {
        // Хитбокс для всей базы (включая стены)
        const bounds = this.container.getBounds();
        this.hitbox = {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height
        };
    }
    
    getBounds() {
        return this.hitbox;
    }
    
    takeDamage(damage) {
        this.health -= damage;
        
        if (this.health <= 0) {
            this.destroy();
            return true;
        }
        
        return false;
    }
    
    destroy() {
        this.isDestroyed = true;
        
        // Удаляем контейнер со сцены
        if (this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
    }
    
};
