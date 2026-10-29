import React from 'react';
import { useDemo } from './DemoContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function DemoFloatingButton() {
    const { currentPageGuide, openGuideModal, isTourActive } = useDemo();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Hide during active spotlight tour
    if (isTourActive) return null;

    return (
        <div className="fixed bottom-5 right-5 z-40 group">
            <button
                type="button"
                onClick={openGuideModal}
                className={`flex items-center gap-2 py-2.5 px-4 rounded-full font-extrabold text-xs shadow-xl transition-all duration-300 transform group-hover:scale-105 active:scale-95 border ${
                    isDark
                        ? 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-emerald-500/40 shadow-slate-950/80'
                        : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-900/15'
                }`}
                title={`How to use ${currentPageGuide?.name || 'this page'}`}
            >
                <span className="text-base">💡</span>
                <span>How This Page Works</span>
            </button>
        </div>
    );
}
