import React, { useState } from 'react';
import { useSPAuth } from '../../contexts/SPAuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import SPDashboard from './SPDashboard';
import SPProfilePage from './SPProfilePage';

const SPApp = () => {
    const { currentSP, logout } = useSPAuth();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    // Internal view navigation: 'dashboard' | 'profile'
    const [view, setView] = useState(() => {
        return window.location.pathname.includes('/profile') ? 'profile' : 'dashboard';
    });

    const handleNavigate = (newView) => {
        setView(newView);
        const path = newView === 'profile' ? '/sp/profile' : '/sp/dashboard';
        window.history.pushState({}, '', path);
    };

    const handleLogout = async () => {
        await logout();
        window.location.href = '/';
    };

    return (
        <div className={`min-h-screen flex flex-col font-sans ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            {/* Top Navigation Bar */}
            <header className="border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-500/20">
                            ⚙️
                        </div>
                        <div>
                            <span className="text-base font-extrabold text-gray-900 dark:text-white leading-tight block">
                                Farm360 SP Portal
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                {currentSP?.type === 'firm' ? 'Workforce Firm' : 'Specialist'}
                            </span>
                        </div>
                    </div>

                    <nav className="hidden sm:flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => handleNavigate('dashboard')}
                            className={`px-3.5 py-1.5 rounded-xl transition-all ${
                                view === 'dashboard'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            📊 Dashboard &amp; Jobs
                        </button>
                        <button
                            type="button"
                            onClick={() => handleNavigate('profile')}
                            className={`px-3.5 py-1.5 rounded-xl transition-all ${
                                view === 'profile'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            🛠️ Services &amp; Profile
                        </button>
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {isDark ? '☀️' : '🌙'}
                    </button>

                    <div className="hidden sm:block text-right">
                        <span className="block text-xs font-bold text-gray-900 dark:text-white truncate max-w-48">
                            {currentSP?.name}
                        </span>
                        <span className="block text-[11px] text-gray-400 truncate max-w-48">
                            {currentSP?.email}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Mobile Nav */}
            <div className="sm:hidden px-4 py-2 border-b border-gray-100 dark:border-slate-800 flex gap-2 text-xs font-semibold bg-white dark:bg-slate-900">
                <button
                    type="button"
                    onClick={() => handleNavigate('dashboard')}
                    className={`flex-1 py-1.5 rounded-xl text-center ${
                        view === 'dashboard'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300'
                    }`}
                >
                    Dashboard
                </button>
                <button
                    type="button"
                    onClick={() => handleNavigate('profile')}
                    className={`flex-1 py-1.5 rounded-xl text-center ${
                        view === 'profile'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300'
                    }`}
                >
                    Services &amp; Profile
                </button>
            </div>

            {/* Main Page Area */}
            <main className="flex-1 p-4 sm:p-8">
                {view === 'profile' ? (
                    <SPProfilePage onBackToDashboard={() => handleNavigate('dashboard')} />
                ) : (
                    <SPDashboard onNavigateToProfile={() => handleNavigate('profile')} />
                )}
            </main>
        </div>
    );
};

export default SPApp;
