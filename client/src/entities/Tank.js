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
        
        // Анимация
        this.animationFrame = 1;
        this.animationTimer = null;
        this.isMoving = false;
        this.textures = {}; // Будет заполнен извне
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
    const prevDirection = this.direction;

    if (prevDirection != direction) {
        if (direction === 'up' || direction === 'down') {
            // Ближайший центр пары клеток
            this.sprite.x = Math.round(this.sprite.x / 16) * 16;
        } 
        // Для горизонтального движения (влево/вправо) - центрируем по Y
        else {
            this.sprite.y = Math.round(this.sprite.y / 16) * 16;
        }
    }

    
    this.direction = direction;
    
    // Запускаем анимацию движения
    if (!this.isMoving) {
        this.startAnimation();
    }
    
    // Обновляем спрайт в зависимости от направления
    this.updateSpriteByDirection();
    
// Пробуем движение
    switch(direction) {
        case 'up':
            this.sprite.y -= this.speed;
            this.sprite.rotation = 0; // Убираем поворот для направления вверх
            break;
        case 'down':
            this.sprite.y += this.speed;
            this.sprite.rotation = 0; // Убираем поворот - текстура уже смотрит вниз
            break;
        case 'left':
            this.sprite.x -= this.speed;
            this.sprite.rotation = 0; // Убираем поворот - текстура уже смотрит влево
            break;
        case 'right':
            this.sprite.x += this.speed;
            this.sprite.rotation = 0; // Убираем поворот - текстура уже смотрит вправо
            break;
    }
    
    this.updateHitbox();
    
    // Проверяем коллизии
    let collision = false;
    for (const obstacle of obstacles) {
        let obstacleBounds = this.getObstacleBounds(obstacle);
        if (CollisionSystem.checkRectCollision(this.hitbox, obstacleBounds)) {
            collision = true;
            break;
        }
    }
    
    if (collision) {
        // Возвращаем на предыдущую позицию
        this.sprite.x = prevX;
        this.sprite.y = prevY;
        // this.direction = prevDirection;
        this.updateHitbox();
        return false;
    }
    
    return true;
}

getObstacleBounds(obstacle) {
    if (obstacle.hitbox) return obstacle.hitbox;
    if (obstacle.getBounds) return obstacle.getBounds();
    if (obstacle.sprite) return obstacle.sprite.getBounds();
    return obstacle;
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
            isDestroyed: false,
            isPlayer: this.isPlayer,
            
            getBounds() {
                return this.sprite.getBounds();
            }
        };
        

        // 10 отрицательный сдвиг что бы передний кирпич можно было разругать
        // Позиция снаряда в зависимости от направления
        switch(this.direction) {
            case 'up':
                bullet.sprite.x = this.sprite.x;
                bullet.sprite.y = this.sprite.y - this.sprite.height / 2 + 10;
                break;
            case 'down':
                bullet.sprite.x = this.sprite.x;
                bullet.sprite.y = this.sprite.y + this.sprite.height / 2 - 10;
                break;
            case 'left':
                bullet.sprite.x = this.sprite.x - this.sprite.width / 2 + 10;
                bullet.sprite.y = this.sprite.y;
                break;
            case 'right':
                bullet.sprite.x = this.sprite.x + this.sprite.width / 2 - 10;
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
    
// Установка текстур для анимации
    setTextures(textures) {
        this.textures = textures;
    }
    
    // Запуск анимации
    startAnimation() {
        this.isMoving = true;
        this.animate();
    }
    
    // Остановка анимации
    stopAnimation() {
        this.isMoving = false;
        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = null;
        }
    }
    
    // Анимация танка
    animate() {
        if (!this.isMoving || this.isDestroyed) return;
        
        // Переключаем кадр анимации
        this.animationFrame = this.animationFrame === 1 ? 2 : 1;
        
        // Обновляем спрайт в зависимости от направления
        this.updateSpriteByDirection();
        
        // Запускаем следующий кадр через 10 мс
        this.animationTimer = setTimeout(() => {
            this.animate();
        }, 150);
    }
    
// Обновление спрайта в зависимости от направления
    updateSpriteByDirection() {
        if (!this.textures || Object.keys(this.textures).length === 0) return;
        
        const textureKey = `playerTank${this.capitalizeFirst(this.direction)}${this.animationFrame}`;
        
        if (this.textures[textureKey]) {
            this.sprite.texture = this.textures[textureKey];
        } else {
            console.warn(`Texture not found: ${textureKey}`);
        }
    }
    
    
    // Вспомогательная функция для капитализации первой буквы
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
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
        
        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = null;
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