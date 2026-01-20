// game/entities/Tank.js
import * as PIXI from 'pixi.js';
import { CollisionSystem } from '../utils/CollisionSystem.js';

export class Tank {
    constructor(texture, x = 100, y = 100, isPlayer = true) {
        this.sprite = new PIXI.Sprite(texture);
        this.sprite.x = x;
        this.sprite.y = y;
        this.sprite.anchor.set(0.5); // Центрируем спрайт
        this.sprite.scale.set(2); // Увеличиваем в 2 раза для видимости
        
        this.sprite.width = 32;  // 2 клетки × 32px
        this.sprite.height = 32; // 2 клетки × 32px

        // Добавляем хитбокс (может отличаться от визуального спрайта)
        this.hitbox = {
            x: this.sprite.x - this.sprite.width * this.sprite.anchor.x,
            y: this.sprite.y - this.sprite.height * this.sprite.anchor.y,
            width: this.sprite.width,
            height: this.sprite.height
        };

        this.isPlayer = isPlayer;
        this.speed = 1.5;
        this.direction = 'up';
        this.bullets = [];
        this.canShoot = true;
        this.shootCooldown = 500; // 0.5 секунды между выстрелами

        this.health = isPlayer ? 3 : 1; // У игрока 3 жизни, у врага 1
        this.isDestroyed = false;
        
        // Таймеры
        this.shootTimer = null;
        this.blinkTimer = null;
        this.destroyTimer = null;
    }

    // Обновляем хитбокс при движении
    updateHitbox() {
        const bounds = this.sprite.getBounds();
        this.hitbox = {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height
        };
    }
    
    move(direction, obstacles = []) {
        const prevX = this.sprite.x;
        const prevY = this.sprite.y;

        this.direction = direction;
        
        switch(direction) {
            case 'up':
                this.sprite.y -= this.speed;
                this.sprite.rotation = 0;
                break;
            case 'down':
                this.sprite.y += this.speed;
                this.sprite.rotation = Math.PI;
                break;
            case 'left':
                this.sprite.x -= this.speed;
                this.sprite.rotation = -Math.PI / 2;
                break;
            case 'right':
                this.sprite.x += this.speed;
                this.sprite.rotation = Math.PI / 2;
                break;
        }

        // Обновляем хитбокс
        this.updateHitbox();
        
        // Проверяем столкновения с препятствиями
        let collision = false;
        
        for (const obstacle of obstacles) {
            // Проверяем, есть ли у препятствия хитбокс
            let obstacleBounds;
            
            if (obstacle.hitbox) {
                // Если у препятствия есть свойство hitbox
                obstacleBounds = obstacle.hitbox;
            } else if (obstacle.getBounds && typeof obstacle.getBounds === 'function') {
                // Если у препятствия есть метод getBounds()
                obstacleBounds = obstacle.getBounds();
            } else if (obstacle.sprite) {
                // Если это спрайт Pixi (используем getBounds())
                obstacleBounds = obstacle.sprite.getBounds();
            } else {
                // Если это простой объект с координатами
                obstacleBounds = obstacle;
            }
            
            if (CollisionSystem.checkRectCollision(this.hitbox, obstacleBounds)) {
                collision = true;
                break;
            }
        }
        
        // Если есть столкновение - возвращаем на предыдущую позицию
        if (collision) {
            this.sprite.x = prevX;
            this.sprite.y = prevY;
            this.updateHitbox();
            return false; // Движение не удалось
        }
        
        return true; // Движение успешно
    }
    
    // Проверка столкновения с другим танком
    checkTankCollision(otherTank) {
        if (this.isDestroyed || otherTank.isDestroyed) return false;
        return CollisionSystem.checkRectCollision(this.hitbox, otherTank.hitbox);
    }

    // Получение урона
    takeDamage(damage = 1) {
        this.health -= damage;
        
        if (this.health <= 0) {
            this.destroyTank();
            return true; // Танк уничтожен
        }
        
        // Мигание при получении урона
        this.sprite.alpha = 0.5;
        
        // Очищаем предыдущий таймер
        if (this.blinkTimer) {
            clearTimeout(this.blinkTimer);
        }
        
        this.blinkTimer = setTimeout(() => {
            if (this.sprite) this.sprite.alpha = 1;
            this.blinkTimer = null;
        }, 200);
        
        return false; // Танк ещё жив
    }

    update() {
        // Обновляем состояние танка
        // (здесь можно добавить логику для ИИ врагов)
    }
    
    shoot(bulletTexture) {
        if (!this.canShoot) return null;
        
        const bullet = {
            sprite: new PIXI.Sprite(bulletTexture),
            direction: this.direction,
            speed: 8,
            isDestroyed: false
        };
        
        // Позиция снаряда в зависимости от направления
        switch(this.direction) {
            case 'up':
                bullet.sprite.x = this.sprite.x;
                bullet.sprite.y = this.sprite.y - this.sprite.height / 2 - 10;
                break;
            case 'down':
                bullet.sprite.x = this.sprite.x;
                bullet.sprite.y = this.sprite.y + this.sprite.height / 2 + 10;
                break;
            case 'left':
                bullet.sprite.x = this.sprite.x - this.sprite.width / 2 - 10;
                bullet.sprite.y = this.sprite.y;
                break;
            case 'right':
                bullet.sprite.x = this.sprite.x + this.sprite.width / 2 + 10;
                bullet.sprite.y = this.sprite.y;
                break;
        }
        
        bullet.sprite.anchor.set(0.5);
        bullet.sprite.scale.set(1.5);
        
        this.canShoot = false;
        
        // Перезарядка
        if (this.shootTimer) {
            clearTimeout(this.shootTimer);
        }
        
        this.shootTimer = setTimeout(() => {
            this.canShoot = true;
            this.shootTimer = null;
        }, this.shootCooldown);
        
        return bullet;
    }
    
    // Уничтожение танка (визуальное)
    destroyTank() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        this.sprite.visible = false;
        
        // Очищаем таймеры
        this.clearTimers();
        
        // В будущем можно добавить анимацию взрыва
        if (this.destroyTimer) {
            clearTimeout(this.destroyTimer);
        }
        
        this.destroyTimer = setTimeout(() => {
            if (this.sprite && this.sprite.parent) {
                this.sprite.parent.removeChild(this.sprite);
            }
            // Теперь можно безопасно вызвать полное уничтожение
            this.destroy();
        }, 1000);
    }
    
    // Полное уничтожение танка и очистка ресурсов
    destroy() {
        // Если танк ещё не помечен как уничтоженный
        if (!this.isDestroyed) {
            this.destroyTank();
            return;
        }
        
        // Очищаем все таймеры
        this.clearTimers();
        
        // Уничтожаем спрайт танка
        if (this.sprite) {
            if (this.sprite.parent) {
                this.sprite.parent.removeChild(this.sprite);
            }
            this.sprite.destroy({
                children: true,
                texture: false, // Не уничтожать текстуру, она может использоваться другими объектами
                baseTexture: false
            });
            this.sprite = null;
        }
        
        // Уничтожаем все пули танка
        if (this.bullets && this.bullets.length > 0) {
            this.bullets.forEach(bullet => {
                if (bullet && bullet.sprite) {
                    if (bullet.sprite.parent) {
                        bullet.sprite.parent.removeChild(bullet.sprite);
                    }
                    bullet.sprite.destroy();
                }
            });
            this.bullets = [];
        }
        
        // Очищаем ссылки
        this.hitbox = null;
    }
    
    // Очистка таймеров
    clearTimers() {
        if (this.shootTimer) {
            clearTimeout(this.shootTimer);
            this.shootTimer = null;
        }
        
        if (this.blinkTimer) {
            clearTimeout(this.blinkTimer);
            this.blinkTimer = null;
        }
        
        if (this.destroyTimer) {
            clearTimeout(this.destroyTimer);
            this.destroyTimer = null;
        }
    }
    
    // Альтернативный упрощенный метод destroy для быстрой очистки
    quickDestroy() {
        this.isDestroyed = true;
        this.clearTimers();
        
        // Быстро удаляем спрайт
        if (this.sprite && this.sprite.parent) {
            this.sprite.parent.removeChild(this.sprite);
            this.sprite.destroy();
            this.sprite = null;
        }
        
        // Быстро очищаем пули
        if (this.bullets) {
            this.bullets.forEach(bullet => {
                if (bullet && bullet.sprite && bullet.sprite.parent) {
                    bullet.sprite.parent.removeChild(bullet.sprite);
                    bullet.sprite.destroy();
                }
            });
            this.bullets = [];
        }
    }
}