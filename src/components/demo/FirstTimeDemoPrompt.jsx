import React, { useState, useEffect } from 'react';
import { useDemo } from './DemoContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function FirstTimeDemoPrompt() {
    const { currentPageGuide, shouldShowFirstTimePrompt, markPageSeen, startTour, openGuideModal } = useDemo();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!currentPageGuide) return;

        const timer = setTimeout(() => {
            if (shouldShowFirstTimePrompt(currentPageGuide.id)) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [currentPageGuide, shouldShowFirstTimePrompt]);

    if (!isVisible || !currentPageGuide) return null;

    const handleDismiss = () => {
        setIsVisible(false);
        markPageSeen(currentPageGuide.id);
    };

    const handleOpenGuide = () => {
        setIsVisible(false);
        markPageSeen(currentPageGuide.id);
        openGuideModal();
    };

    const handleStartTour = () => {
        setIsVisible(false);
        markPageSeen(currentPageGuide.id);
        startTour();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
            <div
                className={`p-5 rounded-3xl shadow-2xl border transition-all ${
                    isDark
                        ? 'bg-slate-900/95 border-emerald-500/40 text-white shadow-emerald-950/60'
                        : 'bg-white/95 border-emerald-200 text-gray-900 shadow-emerald-900/20'
                } backdrop-blur-xl relative overflow-hidden`}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl flex-shrink-0 shadow-md shadow-emerald-600/30">
                            {currentPageGuide.icon || '💡'}
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 block">
                                Quick Guide
                            </span>
                            <h4 className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">
                                First time on {currentPageGuide.name}?
                            </h4>
                        </div>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg text-lg font-bold leading-none"
                        title="Dismiss"
                    >
                        &times;
                    </button>
                </div>

                <p className="text-xs text-gray-600 dark:text-slate-300 mt-2.5 leading-relaxed">
                    Learn what this page does, how to navigate, and how to make entries.
                </p>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
                    <button
                        onClick={handleOpenGuide}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
                    >
                        <span>📖</span> Page Guide
                    </button>
                    {currentPageGuide.tourSteps && currentPageGuide.tourSteps.length > 0 && (
                        <button
                            onClick={handleStartTour}
                            className="py-2 px-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors flex items-center gap-1"
                        >
                            <span>▶</span> Tour
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
