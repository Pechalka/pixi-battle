// game/entities/Tank.js
import * as PIXI from 'pixi.js';
import { CollisionSystem } from '../utils/CollisionSystem.js';

export class Tank {
    constructor(textures, x = 100, y = 100, isPlayer = true) {
        this.textures = textures; // Store all textures

        // Ensure we have the initial textures
        const initialTextures = this.textures.playerTankUp || [PIXI.Texture.EMPTY];
        this.sprite = new PIXI.AnimatedSprite(initialTextures);

        this.sprite.animationSpeed = 0.1;
        this.sprite.x = x;
        this.sprite.y = y;
        this.sprite.anchor.set(0.5); // Center sprite
        this.sprite.scale.set(2);

        this.sprite.width = 32;  // 2 cells * 16px * scale? or just 32px
        this.sprite.height = 32;

        // Hitbox
        this.hitbox = {
            x: this.sprite.x - this.sprite.width * this.sprite.anchor.x,
            y: this.sprite.y - this.sprite.height * this.sprite.anchor.y,
            width: this.sprite.width,
            height: this.sprite.height
        };

        this.isPlayer = isPlayer;
        this.speed = 0.5; // Increased speed slightly for better feel, was 0.7 which is very slow
        this.direction = 'up';
        this.bullets = [];
        this.canShoot = true;
        this.shootCooldown = 500;

        this.health = isPlayer ? 3 : 1;
        this.isDestroyed = false;

        // Timers
        this.shootTimer = null;
        this.blinkTimer = null;
        this.destroyTimer = null;

        this.isMoving = false;
    }

    // Update hitbox
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
        // Handle direction change alignment
        if (direction === 'up' || direction === 'down') {
            this.sprite.x = Math.round(this.sprite.x / 16) * 16;
        } else {
            this.sprite.y = Math.round(this.sprite.y / 16) * 16;
        }
        this.direction = direction;
        
        this.updateSpriteByDirection(); // Update animation textures IMMEDIATELY on turn

        this.startAnimation(); // Ensure animation is playing when moving

        // Move
        switch (direction) {
            case 'up':
                this.sprite.y -= this.speed;
                break;
            case 'down':
                this.sprite.y += this.speed;
                break;
            case 'left':
                this.sprite.x -= this.speed;
                break;
            case 'right':
                this.sprite.x += this.speed;
                break;
        }

        // Remove rotation if it was set anywhere (we use sprite swapping now)
        this.sprite.rotation = 0;

        this.updateHitbox();

        // Collision check
        let collision = false;
        for (const obstacle of obstacles) {
            let obstacleBounds = this.getObstacleBounds(obstacle);
            if (CollisionSystem.checkRectCollision(this.hitbox, obstacleBounds)) {
                collision = true;
                break;
            }
        }

        if (collision) {
            this.sprite.x = prevX;
            this.sprite.y = prevY;
            this.updateHitbox();
            // We can keep animating if pushing against wall, or stop. User preference usually. 
            // Classic tanks keep tracks moving but position is stuck.
            return false;
        }

        return true;
    }

    startAnimation() {
        if (!this.isMoving || !this.sprite.playing) {
            this.isMoving = true;
            this.sprite.play();
        }
    }

    stopAnimation() {
        if (this.isMoving || this.sprite.playing) {
            this.isMoving = false;
            this.sprite.stop();
        }
    }

    getObstacleBounds(obstacle) {
        if (obstacle.hitbox) return obstacle.hitbox;
        if (obstacle.getBounds) return obstacle.getBounds();
        if (obstacle.sprite) return obstacle.sprite.getBounds();
        return obstacle;
    }

    checkTankCollision(otherTank) {
        if (this.isDestroyed || otherTank.isDestroyed) return false;
        return CollisionSystem.checkRectCollision(this.hitbox, otherTank.hitbox);
    }

    takeDamage(damage = 1) {
        this.health -= damage;

        if (this.health <= 0) {
            this.destroyTank();
            return true;
        }

        this.sprite.alpha = 0.5;

        if (this.blinkTimer) {
            clearTimeout(this.blinkTimer);
        }

        this.blinkTimer = setTimeout(() => {
            if (this.sprite) this.sprite.alpha = 1;
            this.blinkTimer = null;
        }, 200);

        return false;
    }

    update() {
        // AI logic or other updates
    }

    shoot(bulletTexture) {        
        if (!this.canShoot) return null;

        const bullet = {
            sprite: new PIXI.Sprite(bulletTexture),
            direction: this.direction,
            speed: 4,
            isDestroyed: false,
            isPlayer: this.isPlayer,

            getBounds() {
                return this.sprite.getBounds();
            }
        };

        // Bullet spawn offset
        const offset = 10;
        switch (this.direction) {
            case 'up':
                bullet.sprite.x = this.sprite.x;
                bullet.sprite.y = this.sprite.y - this.sprite.height / 2 + offset;
                break;
            case 'down':
                bullet.sprite.x = this.sprite.x;
                bullet.sprite.y = this.sprite.y + this.sprite.height / 2 - offset;
                break;
            case 'left':
                bullet.sprite.x = this.sprite.x - this.sprite.width / 2 + offset;
                bullet.sprite.y = this.sprite.y;
                break;
            case 'right':
                bullet.sprite.x = this.sprite.x + this.sprite.width / 2 - offset;
                bullet.sprite.y = this.sprite.y;
                break;
        }

        bullet.sprite.anchor.set(0.5);
        bullet.sprite.scale.set(1.5);

        this.canShoot = false;

        if (this.shootTimer) {
            clearTimeout(this.shootTimer);
        }

        this.shootTimer = setTimeout(() => {
            this.canShoot = true;
            this.shootTimer = null;
        }, this.shootCooldown);

        return bullet;
    }

    destroyTank() {
        if (this.isDestroyed) return;

        this.isDestroyed = true;
        this.sprite.visible = false;

        this.clearTimers();

        if (this.destroyTimer) {
            clearTimeout(this.destroyTimer);
        }

        this.destroyTimer = setTimeout(() => {
            if (this.sprite && this.sprite.parent) {
                this.sprite.parent.removeChild(this.sprite);
            }
            this.destroy();
        }, 1000);
    }

    destroy() {
        if (!this.isDestroyed) {
            this.destroyTank();
            return;
        }

        this.clearTimers();

        if (this.sprite) {
            if (this.sprite.parent) {
                this.sprite.parent.removeChild(this.sprite);
            }
            this.sprite.destroy({
                children: true,
                texture: false,
                baseTexture: false
            });
            this.sprite = null;
        }

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

        this.hitbox = null;
    }

    updateSpriteByDirection() {
        if (!this.textures) return;     

        // Assuming keys like 'playerTankUp', 'playerTankLeft' etc.
        const textureKey = `playerTank${this.capitalizeFirst(this.direction)}`;

        if (this.textures[textureKey]) {
            // Check if it's an array (AnimatedSprite needs array) or single texture
            const newTextures = Array.isArray(this.textures[textureKey])
                ? this.textures[textureKey]
                : [this.textures[textureKey]];

            this.sprite.textures = newTextures;
            this.sprite.play(); // Restart animation with new textures
        }
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    clearTimers() {
        if (this.shootTimer) clearTimeout(this.shootTimer);
        if (this.blinkTimer) clearTimeout(this.blinkTimer);
        if (this.destroyTimer) clearTimeout(this.destroyTimer);
    }

    quickDestroy() {
        this.isDestroyed = true;
        this.clearTimers();

        if (this.sprite && this.sprite.parent) {
            this.sprite.parent.removeChild(this.sprite);
            this.sprite.destroy();
            this.sprite = null;
        }

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