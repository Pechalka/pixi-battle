import * as PIXI from 'pixi.js';

export class Obstacle {
    constructor(texture, explosionTexture, x, y, type = 'brick', tileSize = 16) {
        this.type = type;
        this.health = type !== 'steel' ? 2 : 999;
        this.isDestroyed = false;
        this.canDriveThrough = false;
        this.canShootThrough = false;
        this.textures = texture;
        
        // Спрайт
        this.sprite = new PIXI.Sprite(this.textures.brick);
        // this.sprite.anchor.set(0.5);
        this.sprite.anchor.set(0, 0); 
        this.sprite.x = x;
        this.sprite.y = y;
        this.sprite.width = tileSize;
        this.sprite.height = tileSize;
        
        // Текстура взрыва
        this.explosionTexture = explosionTexture;
        this.explosionSprite = null;
        
        // Для стальных стен
        if (type === 'steel') {
            this.sprite.tint = 0x888888;
        }

        this.tileSize = tileSize;
        // console.log("this.health", this.health);
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
                break;
            case 'down':
                this.sprite.texture = this.textures.brickHalfDown;
                break;                
            case 'left':
                this.sprite.texture = this.textures.brickHalfLeft;
                break;
            case 'right':
                this.sprite.texture = this.textures.brickHalfRight;
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
    
    // Создание анимации взрыва для препятствия
    createExplosion() {
        if (!this.explosionTexture || !this.sprite.parent) return;
        
        this.explosionSprite = new PIXI.Sprite(this.explosionTexture);
        this.explosionSprite.anchor.set(0.5);
        this.explosionSprite.x = this.sprite.x;
        this.explosionSprite.y = this.sprite.y;
        this.explosionSprite.scale.set(1.5); // Взрыв поменьше чем у танка
        
        // Добавляем в ту же позицию
        this.sprite.parent.addChild(this.explosionSprite);
        
        // Анимация взрыва
        this.explosionSprite.alpha = 1;
        this.explosionSprite.scale.set(0.5);
        
        // Взрыв увеличивается и исчезает
        const animateExplosion = () => {
            if (this.explosionSprite) {
                this.explosionSprite.scale.x += 0.15;
                this.explosionSprite.scale.y += 0.15;
                this.explosionSprite.alpha -= 0.08;
                
                if (this.explosionSprite.alpha > 0) {
                    requestAnimationFrame(animateExplosion);
                } else {
                    // Удаляем спрайт взрыва
                    if (this.explosionSprite.parent) {
                        this.explosionSprite.parent.removeChild(this.explosionSprite);
                    }
                    this.explosionSprite.destroy();
                    this.explosionSprite = null;
                }
            }
        };
        
        requestAnimationFrame(animateExplosion);
    }
    
    takeDamage(damage, direction) {
        if (this.type === 'steel') {
            this.createSparkEffect();
            return false;
        }
        
        this.health -= damage;
        
        
        if (this.health <= 0) {
            console.log("Блок уничтожен!");
            this.createExplosion();
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