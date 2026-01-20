import { useRef, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { Game } from "./Game.js";


export const GameCanvas = () => {
    const canvasRef = useRef(null);
    const gameRef = useRef(null);
    const [status, setStatus] = useState('Загрузка...');
    const [score, setScore] = useState(0);

    useEffect(() => {
        console.log('GameCanvas: монтирование');
        
        if (!canvasRef.current) {
            console.log('Нет canvas элемента');
            return;
        }
        
        let isMounted = true;
        
        const initGame = async () => {
            try {
                setStatus('Инициализация игры...');
                gameRef.current = new Game(canvasRef.current);
                setStatus('Игра запущена!');
                
            } catch (error) {
                console.error('Ошибка загрузки игры:', error);
                setStatus(`Ошибка: ${error.message}`);
            }
        };
        
        initGame();
        
        return () => {
            console.log('GameCanvas: размонтирование');
            isMounted = false;
            
            if (gameRef.current) {
                gameRef.current.destroy();
                gameRef.current = null;
            }
        };
        
    }, [gameRef]);

    return (
        <div style={{ position: 'relative' }}>
            {/* Canvas для игры */}
            <canvas 
                ref={canvasRef} 
                style={{ 
                    border: '2px solid #0F0',
                    display: 'block',
                    margin: '0 auto',
                    backgroundColor: '#000'
                }}
            />
            
            {/* Статус игры */}
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                color: '#0F0',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '10px',
                borderRadius: '5px',
                fontFamily: 'monospace'
            }}>
                <div>Статус: {status}</div>
                <div>Счёт: {score}</div>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                    Управление: WASD + ПРОБЕЛ
                </div>
            </div>
        </div>
    );
};

const App = () => {
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', textAlign: 'center' }}>
            <h1>Battle Citi Pixi</h1>
            <GameCanvas />
        </div>
    );
};

// Временное отключение StrictMode для теста
createRoot(document.getElementById("root")).render(<App />);