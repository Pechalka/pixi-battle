import { useRef, useEffect, useState } from "react";

import { Game } from "../Game.js";
import { Routes, Route, HashRouter, Outlet, NavLink, useNavigate, useParams } from "react-router-dom";
import { io } from 'socket.io-client';

const GameCanvas = () => {
    const canvasRef = useRef(null);
    const gameRef = useRef(null);
    const [status, setStatus] = useState('Загрузка...');
    const [score, setScore] = useState(0);

    const { gameId, p } = useParams();

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
                const socket = io('/', {
                    transports: ['websocket'],
                    query: {
                                gameId,
                                player: p
                            },
                });
                gameRef.current = new Game(canvasRef.current, p, socket);
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
            }
        };
        
    }, []);

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


export default GameCanvas;