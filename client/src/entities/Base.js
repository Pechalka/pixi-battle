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
        
        // Создаем кирпичную стену толщиной 16 пикселей вокруг орла
        this.createBrickWalls(wallTexture);
        
        this.health = 3;
        this.isDestroyed = false;

        const bounds = this.container.getLocalBounds();
        this.container.width = bounds.width * 2;   // 64
        this.container.height = bounds.height;  

        // this.hitbox = {
        //     x: this.container.x - this.container.width * this.container.anchor.x,
        //     y: this.container.y - this.container.height * this.container.anchor.y,
        //     width: this.container.width,
        //     height: this.container.height
        // };

    }
    
    createBrickWalls(wallTexture) {
        const wallThickness = 16;
        const eagleSize = 32;
        
        // Верхняя стена
        const topWall = new PIXI.Sprite(wallTexture);
        topWall.width = eagleSize + 2 * wallThickness;
        topWall.height = wallThickness;
        topWall.position.set(-eagleSize/2 - wallThickness, -eagleSize/2 - wallThickness);
        this.container.addChild(topWall);
        
        // Нижняя стена
        // const bottomWall = new PIXI.Sprite(wallTexture);
        // bottomWall.width = eagleSize + 2 * wallThickness;
        // bottomWall.height = wallThickness;
        // bottomWall.position.set(-eagleSize/2 - wallThickness, eagleSize/2);
        // this.container.addChild(bottomWall);
        
        // Левая стена
        const leftWall = new PIXI.Sprite(wallTexture);
        leftWall.width = wallThickness;
        leftWall.height = eagleSize;
        leftWall.position.set(-eagleSize/2 - wallThickness, -eagleSize/2);
        this.container.addChild(leftWall);
        
        // Правая стена
        const rightWall = new PIXI.Sprite(wallTexture);
        rightWall.width = wallThickness;
        rightWall.height = eagleSize;
        rightWall.position.set(eagleSize/2, -eagleSize/2);
        this.container.addChild(rightWall);
    }
};
