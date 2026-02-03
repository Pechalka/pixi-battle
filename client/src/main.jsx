import { useRef, useEffect, useState, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as PIXI from 'pixi.js';

import { Game } from "./Game.js";
import { AssetLoader } from "./utils/AssetLoader.js";
import { Routes, Route, HashRouter, Outlet, NavLink, useNavigate, useParams } from "react-router-dom";
import Axios from 'axios';
import { io } from 'socket.io-client';

import GameList from "./pages/GameList";
import Layout from './pages/Layout';
import MapEditor from './pages/MapEditor';
import GameCanvas from './pages/GameCanvas';



const App = () => {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<GameList />} />
                <Route path='/:gameId/:p' element={<GameCanvas />} />
                <Route path='/editor' element={<MapEditor />} />            
            </Route>
        </Routes>
    )
}


// Временное отключение StrictMode для теста
createRoot(document.getElementById("root")).render(<HashRouter><App /></HashRouter>  );