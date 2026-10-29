import React from 'react';
import { useDemo } from './DemoContext';

export default function DemoHeaderButton() {
    const { currentPageGuide, openGuideModal } = useDemo();

    return (
        <button
            type="button"
            onClick={openGuideModal}
            className="flex items-center gap-2 py-1.5 px-3.5 rounded-full font-bold text-xs bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 transition-all shadow-xs transform active:scale-95"
            title={`Click to see how to use ${currentPageGuide?.name || 'this page'}`}
        >
            <span className="text-sm">💡</span>
            <span className="font-bold">How This Page Works</span>
            <span className="hidden xl:inline text-[10px] opacity-75 font-normal">
                ({currentPageGuide?.name || 'Guide'})
            </span>
        </button>
    );
}
