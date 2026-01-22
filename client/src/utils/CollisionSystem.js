export class CollisionSystem {
    // Проверка столкновения двух прямоугольников (AABB)
    static checkRectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // Проверка столкновения спрайта с границами
    static checkBoundaryCollision(sprite, bounds) {
        const spriteBounds = sprite.getBounds();
        return {
            left: spriteBounds.x < bounds.x,
            right: spriteBounds.x + spriteBounds.width > bounds.x + bounds.width,
            top: spriteBounds.y < bounds.y,
            bottom: spriteBounds.y + spriteBounds.height > bounds.y + bounds.height
        };
    }
    
// Проверка столкновения снаряда с объектом
    static checkBulletCollision(bullet, target) {
        const bulletBounds = bullet.sprite.getBounds();
        
        let targetBounds;
        if (target.getBounds) {
            targetBounds = target.getBounds();
        } else {
            // Если это спрайт, получаем его границы напрямую
            targetBounds = target.getBounds();
        }
        
        // Для снаряда можно использовать меньший допуск
        return this.checkRectCollision(
            { x: bulletBounds.x + 2, y: bulletBounds.y + 2, width: bulletBounds.width - 4, height: bulletBounds.height - 4 },
            targetBounds
        );
    }
    
    // Получение нормализованного вектора от центра одного объекта к другому
    static getDirectionVector(from, to) {
        const fromCenter = {
            x: from.x + from.width / 2,
            y: from.y + from.height / 2
        };
        const toCenter = {
            x: to.x + to.width / 2,
            y: to.y + to.height / 2
        };
        
        const dx = toCenter.x - fromCenter.x;
        const dy = toCenter.y - fromCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return {
            x: dx / distance,
            y: dy / distance,
            distance: distance
        };
    }

    // // Замените метод checkBulletObstacleCollision:
    // checkBulletObstacleCollision(bullet, bulletIndex) {
    //     const bulletX = bullet.sprite.x;
    //     const bulletY = bullet.sprite.y;
    //     const { tileSize } = this.mapConfig;
        
    //     // 1. Определяем центральную клетку попадания
    //     const centerGridX = Math.floor(bulletX / tileSize);
    //     const centerGridY = Math.floor(bulletY / tileSize);
        
    //     // 2. Определяем смещение внутри клетки
    //     const offsetX = (bulletX % tileSize) / tileSize; // 0.0 - 1.0
    //     const offsetY = (bulletY % tileSize) / tileSize; // 0.0 - 1.0
        
    //     // 3. Какие клетки разрушать в зависимости от направления
    //     const cellsToDestroy = this.getDestroyedCellsByDirection(
    //         centerGridX, centerGridY, offsetX, offsetY, bullet.direction
    //     );
        
    //     let hitSomething = false;
        
    //     // 4. Разрушаем кирпичи в этих клетках
    //     for (const {x, y} of cellsToDestroy) {
    //         const obstacle = this.getObstacleFromGrid(x, y);
            
    //         if (!obstacle || obstacle.isDestroyed) continue;
            
    //         if (obstacle.type === 'steel') {
    //             this.removeBullet(bullet, bulletIndex);
    //             return true;
    //         }
            
    //         const destroyed = obstacle.takeDamage(1);
            
    //         if (destroyed) {
    //             this.mapGrid[y][x] = null;
    //             const index = this.obstacles.indexOf(obstacle);
    //             if (index !== -1) this.obstacles.splice(index, 1);
    //             hitSomething = true;
    //         }
    //     }
        
    //     if (hitSomething) {
    //         this.removeBullet(bullet, bulletIndex);
    //         return true;
    //     }
        
    //     return false;
    // }

checkBulletObstacleCollision(bullet, bulletIndex) {
    const bulletX = bullet.sprite.x;
    const bulletY = bullet.sprite.y;
    const { tileSize } = this.mapConfig;
    
    // Всегда проверяем 2 клетки вперед по направлению пули
    const cellsToCheck = [];
    
    // Определяем клетку, в которой находится центр пули
    const centerGridX = Math.floor(bulletX / tileSize);
    const centerGridY = Math.floor(bulletY / tileSize);
    
    // В зависимости от направления, проверяем клетки перед пулей
    switch(bullet.direction) {
        case 'up':
            // Клетки прямо над пулей (горизонтальная линия из 2 клеток)
            cellsToCheck.push({x: centerGridX, y: centerGridY - 1});
            cellsToCheck.push({x: centerGridX + 1, y: centerGridY - 1});
            break;
            
        case 'down':
            // Клетки прямо под пулей
            cellsToCheck.push({x: centerGridX, y: centerGridY + 1});
            cellsToCheck.push({x: centerGridX + 1, y: centerGridY + 1});
            break;
            
        case 'left':
            // Клетки слева от пули (вертикальная линия из 2 клеток)
            cellsToCheck.push({x: centerGridX - 1, y: centerGridY});
            cellsToCheck.push({x: centerGridX - 1, y: centerGridY + 1});
            break;
            
        case 'right':
            // Клетки справа от пули
            cellsToCheck.push({x: centerGridX + 1, y: centerGridY});
            cellsToCheck.push({x: centerGridX + 1, y: centerGridY + 1});
            break;
    }
    
    let hitSomething = false;
    
    for (const {x, y} of cellsToCheck) {
        // Проверяем границы
        if (y < 0 || y >= this.mapGrid.length || x < 0 || x >= this.mapGrid[0].length) {
            continue;
        }
        
        const cell = this.mapGrid[y][x];
        if (!cell || !cell.obstacle || cell.obstacle.isDestroyed) {
            continue;
        }
        
        const obstacle = cell.obstacle;
        
        // Сталь останавливает пулю
        if (obstacle.type === 'steel') {
            this.removeBullet(bullet, bulletIndex);
            return true;
        }
        
        // Кирпич разрушается
        const destroyed = obstacle.takeDamage(1);
        
        if (destroyed) {
            this.mapGrid[y][x] = null;
            const index = this.obstacles.indexOf(obstacle);
            if (index !== -1) this.obstacles.splice(index, 1);
            hitSomething = true;
        }
    }
    
    if (hitSomething) {
        this.removeBullet(bullet, bulletIndex);
        return true;
    }
    
    return false;
}
    // Новый метод: определяет какие клетки разрушать
    getDestroyedCellsByDirection(centerX, centerY, offsetX, offsetY, direction) {
        const cells = [];
        const threshold = 0.3; // 30% от размера клетки
        
        switch(direction) {
            case 'up':
            case 'down':
                // Вертикальный выстрел - разрушает горизонтальную линию
                if (offsetX < 0.5 - threshold) {
                    // Левая часть клетки
                    cells.push({x: centerX, y: centerY});
                    cells.push({x: centerX, y: centerY + (direction === 'up' ? -1 : 1)});
                } else if (offsetX > 0.5 + threshold) {
                    // Правая часть клетки
                    cells.push({x: centerX + 1, y: centerY});
                    cells.push({x: centerX + 1, y: centerY + (direction === 'up' ? -1 : 1)});
                } else {
                    // Центр клетки - разрушает две клетки по горизонтали
                    cells.push({x: centerX, y: centerY});
                    cells.push({x: centerX + 1, y: centerY});
                }
                break;
                
            case 'left':
            case 'right':
                // Горизонтальный выстрел - разрушает вертикальную линию
                if (offsetY < 0.5 - threshold) {
                    // Верхняя часть клетки
                    cells.push({x: centerX, y: centerY});
                    cells.push({x: centerX + (direction === 'left' ? -1 : 1), y: centerY});
                } else if (offsetY > 0.5 + threshold) {
                    // Нижняя часть клетки
                    cells.push({x: centerX, y: centerY + 1});
                    cells.push({x: centerX + (direction === 'left' ? -1 : 1), y: centerY + 1});
                } else {
                    // Центр клетки - разрушает две клетки по вертикали
                    cells.push({x: centerX, y: centerY});
                    cells.push({x: centerX, y: centerY + 1});
                }
                break;
        }
        
        // Фильтруем клетки вне карты
        return cells.filter(({x, y}) => 
            x >= 0 && x < this.mapGrid[0].length && 
            y >= 0 && y < this.mapGrid.length
        );
    }
}