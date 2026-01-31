import * as PIXI from 'pixi.js';

export class Obstacle {
    constructor(texture, x, y, type = 'brick', tileSize = 16) {
        this.type = type;
        this.health = type !== 'steel' ? 2 : 999;
        this.isDestroyed = false;
        this.canDriveThrough = false;
        this.canShootThrough = false;
        this.textures = texture;
        
        // Спрайт
        switch(type) {
            case 'brick':
                this.sprite = new PIXI.Sprite(this.textures.brick);
                break;
            case 'steel':
                this.sprite = new PIXI.Sprite(this.textures.steel);
                break;
            case 'spark':
                this.sprite = new PIXI.Sprite(this.textures.spark);
                break;
            default:
                return null;
        }

        this.sprite.anchor.set(0, 0); 
        this.sprite.x = x;
        this.sprite.y = y;
        this.sprite.width = tileSize;
        this.sprite.height = tileSize;
        
        // Для стальных стен
        if (type === 'steel') {
            this.sprite.tint = 0x888888;
        }

        this.tileSize = tileSize;

        // Хитбокс
        this.hitbox = {
            x: this.sprite.x - this.sprite.width * this.sprite.anchor.x,
            y: this.sprite.y - this.sprite.height * this.sprite.anchor.y,
            width: this.sprite.width,
            height: this.sprite.height
        }; 
        
    }

    updateWallDamageTexture(direction) {
        
        switch(direction) {
            case 'up':
                this.sprite.texture = this.textures.brickHalfUp;
                this.sprite.width = 16;
                this.sprite.height = 8;
                break;
            case 'down':
                this.sprite.texture = this.textures.brickHalfDown;
                this.sprite.y = this.sprite.y + 8;
                this.sprite.width = 16;
                this.sprite.height = 8;
                break;                
            case 'left':
                this.sprite.texture = this.textures.brickHalfLeft;
                this.sprite.width = 8;
                this.sprite.height = 16;
                break;
            case 'right':
                this.sprite.texture = this.textures.brickHalfRight;
                this.sprite.x = this.sprite.x + 8;
                this.sprite.width = 8;
                this.sprite.height = 16;
                break;
        }
    }
    
    updateHitbox() {
        this.hitbox = {
            x: this.sprite.x - this.sprite.width * this.sprite.anchor.x,
            y: this.sprite.y - this.sprite.height * this.sprite.anchor.y,
            width: this.sprite.width,
            height: this.sprite.height
        };
    }
    
    getBounds() {
        return {
            x: this.sprite.x - this.sprite.width * this.sprite.anchor.x,
            y: this.sprite.y - this.sprite.height * this.sprite.anchor.y,
            width: this.sprite.width,
            height: this.sprite.height
        };
    }

    takeDamage(damage, direction) {
        if (this.type === 'steel') {
            this.createSparkEffect();
            return false;
        }
        
        this.health -= damage;
        
        if (this.health <= 0) {
            console.log("Блок уничтожен!");
            // this.createExplosion();
            this.destroy();
            return true;
        }
        // Визуальный эффект повреждения
        if (this.type === 'brick') {
            this.updateWallDamageTexture(direction);
        }
        
        return false;
    }
    
    // Эффект искр для стали (при попадании пули)
    createSparkEffect() {
        if (!this.sprite.parent) return;
        
        const spark = new PIXI.Graphics();
        spark.circle(0, 0, 3);
        spark.fill({ color: 0xFFFF00, alpha: 0.9 });
        spark.x = this.sprite.x;
        spark.y = this.sprite.y;
        this.sprite.parent.addChild(spark);
        
        // Анимация искры
        let alpha = 0.9;
        const sparkAnimation = () => {
            alpha -= 0.1;
            spark.alpha = alpha;
            spark.scale.x += 0.05;
            spark.scale.y += 0.05;
            
            if (alpha > 0) {
                requestAnimationFrame(sparkAnimation);
            } else {
                if (spark.parent) {
                    spark.parent.removeChild(spark);
                }
                spark.destroy();
            }
        };
        
        requestAnimationFrame(sparkAnimation);
    }
    
    destroy() {
        this.isDestroyed = true;
        
        // Удаляем индикатор HP
        if (this.hpContainer && this.sprite) {
            this.sprite.removeChild(this.hpContainer);
        }
        
        setTimeout(() => {
            if (this.sprite && this.sprite.parent) {
                this.sprite.parent.removeChild(this.sprite);
                this.sprite.destroy();
            }
        }, 100);
    }
}