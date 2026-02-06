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
        
        this.health = 1; // Орёл уничтожается с одного попадания
        this.isDestroyed = false;
        this.canDriveThrough = false; // Нельзя проезжать через базу
        
        // Создаём хитбокс для орла (отдельно от стен)
        this.eagleBounds = this.spriteEagle.getBounds();
        this.eagleHitbox = {
            x: this.eagleBounds.x,
            y: this.eagleBounds.y,
            width: this.eagleBounds.width,
            height: this.eagleBounds.height
        };

    }
    
    getEagleBounds() {
        return this.eagleHitbox;
    }

    getBounds() {
        return this.getEagleBounds();
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
