import * as PIXI from 'pixi.js';

export class AssetLoader {
    static async loadAssets() {
        const spritesheet = await PIXI.Assets.load('/sprites.png');
        
        const textures = {
            // ТАНКИ (16x16 пикселей)
            playerTank: this.extractTexture(spritesheet, 0, 0, 16, 16),           // Желтый танк игрока 1
            playerTank2: this.extractTexture(spritesheet, 16, 0, 16, 16),         // Зеленый танк игрока 2
            enemyTankBasic: this.extractTexture(spritesheet, 16*8, 0, 16, 16),    // Серый базовый враг (строка 1)
            enemyTankFast: this.extractTexture(spritesheet, 16*8, 16, 16, 16),    // Серый быстрый враг (строка 2)
            enemyTankPower: this.extractTexture(spritesheet, 16*8, 16*2, 16, 16), // Серый сильный враг (строка 3)
            enemyTankArmor: this.extractTexture(spritesheet, 16*8, 16*3, 16, 16), // Серый бронированный враг (строка 4)
            
            // ПРЕПЯТСТВИЯ (16x16 пикселей)
            brick: this.extractTexture(spritesheet, 16*16, 0, 16, 16),            // Кирпичная стена
            steel: this.extractTexture(spritesheet, 16*17 + 8, 16, 8, 8),           // Стальная стена
            water: this.extractTexture(spritesheet, 16*22, 0, 16, 16),            // Вода (анимированная)
            water2: this.extractTexture(spritesheet, 16*22, 16, 16, 16),          // Вода 2-й кадр
            forest: this.extractTexture(spritesheet, 16*24, 0, 16, 16),           // Лес
            ice: this.extractTexture(spritesheet, 16*24, 16, 16, 16),             // Лёд
            
            // СНАРЯДЫ (8x8 пикселей)
            bullet: this.extractTexture(spritesheet, 16*20 + 1, 16*6 + 4, 8, 8),           // Снаряд
            bulletBig: this.extractTexture(spritesheet, 16*6+8, 16*7, 8, 8),      // Улучшенный снаряд
            
            // АНИМАЦИИ И ЭФФЕКТЫ
            explosionSmall: this.extractTexture(spritesheet, 16*4, 16*7, 16, 16), // Маленький взрыв
            explosionBig: this.extractTexture(spritesheet, 16*5, 16*7, 32, 32),   // Большой взрыв
            
            // БОНУСЫ (16x16 пикселей)
            bonusStar: this.extractTexture(spritesheet, 16*14, 16*4, 16, 16),     // Звезда (ускорение выстрела)
            bonusGrenade: this.extractTexture(spritesheet, 16*14, 16*5, 16, 16),  // Граната (уничтожить всех)
            bonusHelmet: this.extractTexture(spritesheet, 16*14, 16*6, 16, 16),   // Шлем (временная защита)
            bonusShovel: this.extractTexture(spritesheet, 16*15, 16*4, 16, 16),   // Лопата (укрепить базу)
            bonusTank: this.extractTexture(spritesheet, 16*15, 16*5, 16, 16),     // Танк (дополнительная жизнь)
            bonusClock: this.extractTexture(spritesheet, 16*15, 16*6, 16, 16),    // Часы (заморозить врагов)
            
            // БАЗА И ОРУЖИЕ
            base: this.extractTexture(spritesheet, 16*19, 16*2, 16, 16),          // База (орёл)
            baseDestroyed: this.extractTexture(spritesheet, 16*18, 16*7, 32, 32), // Уничтоженная база
            
            // UI ЭЛЕМЕНТЫ (цифры, буквы, символы)
            numbers: this.extractTexture(spritesheet, 16*10, 16*4, 80, 16),       // Цифры 0-9
            playerIcon: this.extractTexture(spritesheet, 16*13, 16*4, 8, 8),      // Иконка игрока
            enemyIcon: this.extractTexture(spritesheet, 16*13+8, 16*4, 8, 8),     // Иконка врага
        };
        
        return textures;
    }
    
    static extractTexture(baseTexture, x, y, width, height) {
        return new PIXI.Texture({
            source: baseTexture,
            frame: new PIXI.Rectangle(x, y, width, height)
        });
    }
}