import * as PIXI from 'pixi.js';

export class Obstacle {
    constructor(texture, explosionTexture, x, y, type = 'brick', tileSize = 16) {
        this.type = type;
        this.health = type === 'brick' ? 1 : 999;
        this.isDestroyed = false;
        this.canDriveThrough = false;
        this.canShootThrough = false;
        
        // Спрайт
        this.sprite = new PIXI.Sprite(texture);
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
        
        // Хитбокс
        this.hitbox = {
            x: this.sprite.x - this.sprite.width * this.sprite.anchor.x,
            y: this.sprite.y - this.sprite.height * this.sprite.anchor.y,
            width: this.sprite.width,
            height: this.sprite.height
        };
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
    
    takeDamage(damage) {
        if (this.type === 'steel') {
            // Сталь не разрушается
            // Можно добавить эффект искр при попадании
            this.createSparkEffect();
            return false;
        }
        
        this.health -= damage;
        
        if (this.health <= 0) {
            // Создаём взрыв перед уничтожением
            this.createExplosion();
            this.destroy();
            return true;
        }
        
        // Визуальный эффект повреждения для кирпича
        if (this.type === 'brick') {
            this.sprite.alpha = 0.7;
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
        
        // Ждём немного перед удалением спрайта (чтобы взрыв успел отобразиться)
        setTimeout(() => {
            if (this.sprite && this.sprite.parent) {
                this.sprite.parent.removeChild(this.sprite);
                this.sprite.destroy();
            }
        }, 300);
    }
}