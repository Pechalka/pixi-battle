import { useEffect, useState } from "react";

import { NavLink, useNavigate } from "react-router-dom";
import Axios from 'axios';

const GameList = () => {
    const navigate = useNavigate();
    const [gameIds, setGameIds] = useState([]);

    const newGame = () => {
        Axios.post('/api/games').then(r => r.data).then(({ gameId }) => {
            navigate('/' + gameId + '/1');
        })
    }

    useEffect(() => {
        Axios.get('/api/games').then(r => r.data).then(setGameIds);
    }, [])

    return (
        <div>
            <button onClick={newGame}>Новая игра</button>
            {gameIds.map(gameId => (
                <div>
                    <NavLink to={`/${gameId}/1`}>{gameId}</NavLink>
                </div>
            ))}
        </div>
    )
}

export default GameList;