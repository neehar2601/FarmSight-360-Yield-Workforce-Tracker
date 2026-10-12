import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {}, setTheme: () => {} });

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        try { return localStorage.getItem('farm360_theme') || 'light'; } catch { return 'light'; }
    });

    // Initialize immediately to prevent flash
    useEffect(() => {
        try { localStorage.setItem('farm360_theme', theme); } catch {}
        // Apply class and attribute to root for Tailwind darkMode: 'class' and global CSS
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.style.colorScheme = theme;
    }, [theme]);

    const setTheme = (t) => setThemeState(t);
    const toggleTheme = () => setThemeState(t => t === 'dark' ? 'light' : 'dark');

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
