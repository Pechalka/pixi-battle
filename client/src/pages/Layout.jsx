import { useRef, useEffect, useState, StrictMode } from "react";
import {  Outlet, NavLink } from "react-router-dom";

const Layout = () => {

    return (
        <div>
            <nav style={{ 
                backgroundColor: '#333', 
                padding: '10px', 
                textAlign: 'center' 
            }}>
                <NavLink 
                    to='/' style={({isActive }) =>({
                        margin: '0 10px',
                        padding: '10px 20px',
                        backgroundColor: isActive ? '#0F0' : '#666',
                        color: isActive ? '#000' : '#fff',
                        border: 'none',
                        cursor: 'pointer'
                    })}
                >
                    Все игры
                </NavLink>
                <NavLink to='/editor' style={({isActive }) =>({
                        margin: '0 10px',
                        padding: '10px 20px',
                        backgroundColor: isActive ? '#0F0' : '#666',
                        color: isActive ? '#000' : '#fff',
                        border: 'none',
                        cursor: 'pointer'
                    })}>Создать карту</NavLink>
            </nav>
            
            <Outlet />
        </div>
    )
}

export default Layout;