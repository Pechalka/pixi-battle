import { useRef, useEffect, useState, StrictMode } from "react";
import * as PIXI from 'pixi.js';

import { AssetLoader } from "../utils/AssetLoader.js";

const MapEditor = () => {
    const canvasRef = useRef(null);
    const editorRef = useRef(null);
    const [selectedTool, setSelectedTool] = useState('brick');
    const [mapConfig, setMapConfig] = useState({
        tileSize: 16,
        mapWidth: 26,
        mapHeight: 26,
        bricks: [],
        steels: [],
        basePosition: [13, 25],
        playerStart: [8, 25]
    });

    useEffect(() => {
        if (!canvasRef.current) return;

        const initEditor = async () => {
            try {
                const textures = await AssetLoader.loadAssets();
                editorRef.current = new PIXI.Application();
                await editorRef.current.init({
                    canvas: canvasRef.current,
                    width: 416,
                    height: 416,
                    backgroundColor: 0x000000,
                    resolution: 1,
                });

                editorRef.current.textures = textures;

                // Создаем сетку
                createGrid();
                
                // Обработчики мыши
                setupMouseHandlers();
                
            } catch (error) {
                console.error('Ошибка инициализации редактора:', error);
            }
        };

        initEditor();

        return () => {
            if (editorRef.current) {
                editorRef.current.destroy(true);
            }
        };
    }, []);

    const createGrid = () => {
        const grid = new PIXI.Graphics();
        const tileSize = 16;
        
        grid.setStrokeStyle({
            width: 2,
            color: "red",
            alpha: 0.3
        });
        
        for (let x = 0; x <= 416; x += tileSize) {
            grid.moveTo(x, 0);
            grid.lineTo(x, 416);
        }
        
        for (let y = 0; y <= 416; y += tileSize) {
            grid.moveTo(0, y);
            grid.lineTo(416, y);
        }
        
        grid.stroke();
        editorRef.current.stage.addChild(grid);
    };

    const setupMouseHandlers = () => {
        let isDrawing = false;
        
        const handleMouseDown = (e) => {
            isDrawing = true;
            handleTileClick(e);
        };
        
        const handleMouseMove = (e) => {
            if (!isDrawing) return;
            handleTileClick(e);
        };
        
        const handleMouseUp = () => {
            isDrawing = false;
        };

        const handleTileClick = (e) => {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const gridX = Math.floor(x / 16);
            const gridY = Math.floor(y / 16);
            
            placeTile(gridX, gridY);
        };

        canvasRef.current.addEventListener('mousedown', handleMouseDown);
        canvasRef.current.addEventListener('mousemove', handleMouseMove);
        canvasRef.current.addEventListener('mouseup', handleMouseUp);
        canvasRef.current.addEventListener('mouseleave', handleMouseUp);
    };

    const placeTile = (gridX, gridY) => {
        if (gridX < 0 || gridX >= 26 || gridY < 0 || gridY >= 26) return;
        
        const tileSize = 16;
        const x = gridX * tileSize;
        const y = gridY * tileSize;

        // Удаляем существующий тайл в этой позиции
        removeTileAt(gridX, gridY);

        if (selectedTool === 'eraser') return;

        // Создаем новый тайл
        const sprite = new PIXI.Sprite();
        sprite.x = x;
        sprite.y = y;
        sprite.width = tileSize;
        sprite.height = tileSize;

        switch (selectedTool) {
            case 'brick':
                sprite.texture = editorRef.current.textures.brick;
                updateMapConfig('bricks', [gridX, gridY]);
                break;
            case 'steel':
                sprite.texture = editorRef.current.textures.steel;
                updateMapConfig('steels', [gridX, gridY]);
                break;
            case 'grass':
                if (editorRef.current.textures.grass) {
                    sprite.texture = editorRef.current.textures.grass;
                } else {
                    // Создаем зеленый квадрат для травы
                    sprite.texture = PIXI.Texture.WHITE;
                    sprite.tint = 0x228B22;
                }
                break;
            case 'base':
                sprite.texture = editorRef.current.textures.base;
                setMapConfig(prev => ({ ...prev, basePosition: [gridX, gridY] }));
                break;
        }

        if (sprite.texture) {
            sprite.gridPosition = { gridX, gridY, type: selectedTool };
            editorRef.current.stage.addChild(sprite);
        }
    };

    const removeTileAt = (gridX, gridY) => {
        const children = [...editorRef.current.stage.children];
        children.forEach(child => {
            if (child.gridPosition && 
                child.gridPosition.gridX === gridX && 
                child.gridPosition.gridY === gridY) {
                editorRef.current.stage.removeChild(child);
                
                // Удаляем из конфигурации
                if (child.gridPosition.type === 'brick') {
                    setMapConfig(prev => ({
                        ...prev,
                        bricks: prev.bricks.filter(pos => pos[0] !== gridX || pos[1] !== gridY)
                    }));
                } else if (child.gridPosition.type === 'steel') {
                    setMapConfig(prev => ({
                        ...prev,
                        steels: prev.steels.filter(pos => pos[0] !== gridX || pos[1] !== gridY)
                    }));
                }
            }
        });
    };

    const updateMapConfig = (type, position) => {
        setMapConfig(prev => ({
            ...prev,
            [type]: [...prev[type], position]
        }));
    };

    const clearMap = () => {
        const children = [...editorRef.current.stage.children];
        children.forEach(child => {
            if (child.gridPosition) {
                editorRef.current.stage.removeChild(child);
            }
        });
        
        setMapConfig(prev => ({
            ...prev,
            bricks: [],
            steels: []
        }));
    };

    const exportMap = () => {
        const config = { ...mapConfig };
        console.log('MAP_CONFIG =', JSON.stringify(config, null, 4));
        alert('Карта экспортирована в консоль!');
    };

    const tools = [
        { id: 'brick', label: 'Кирпич', color: '#8B4513' },
        { id: 'steel', label: 'Сталь', color: '#708090' },
        { id: 'grass', label: 'Трава', color: '#228B22' },
        { id: 'base', label: 'База', color: '#FFD700' },
        { id: 'eraser', label: 'Ластик', color: '#FF6347' }
    ];

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', textAlign: 'center' }}>
            <h1>Редактор карт</h1>
            
            <div style={{ marginBottom: '20px' }}>
                <canvas 
                    ref={canvasRef} 
                    style={{ 
                        border: '2px solid #0F0',
                        display: 'block',
                        margin: '0 auto',
                        backgroundColor: '#000',
                        cursor: 'crosshair'
                    }}
                />
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3>Инструменты:</h3>
                {tools.map(tool => (
                    <button
                        key={tool.id}
                        onClick={() => setSelectedTool(tool.id)}
                        style={{
                            margin: '5px',
                            padding: '10px',
                            backgroundColor: selectedTool === tool.id ? tool.color : '#f0f0f0',
                            border: selectedTool === tool.id ? `2px solid ${tool.color}` : '1px solid #ccc',
                            cursor: 'pointer'
                        }}
                    >
                        {tool.label}
                    </button>
                ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button onClick={clearMap} style={{ margin: '5px', padding: '10px' }}>
                    Очистить карту
                </button>
                <button onClick={exportMap} style={{ margin: '5px', padding: '10px' }}>
                    Экспортировать
                </button>
            </div>

            <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
                <h3>Текущая конфигурация:</h3>
                <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
                    {JSON.stringify(mapConfig, null, 2)}
                </pre>
            </div>
        </div>
    );
};

export default MapEditor;