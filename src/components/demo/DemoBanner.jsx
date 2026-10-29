import React from 'react';
import { useDemo } from './DemoContext';

export default function DemoBanner() {
    const { launchInstantFarmerDemo } = useDemo();

    return (
        <div className="w-full max-w-md mt-6 p-4 rounded-2xl bg-emerald-50 dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-800 text-gray-900 dark:text-white space-y-2.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                        Try Demo Farm Account
                    </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Preloaded Demo Data
                </span>
            </div>

            <p className="text-[11px] text-gray-600 dark:text-slate-300 leading-relaxed">
                Want to test the app without typing credentials? Log in with 1 click to a demonstration farm with pre-configured crops, workers, and finances:
            </p>

            <button
                type="button"
                onClick={launchInstantFarmerDemo}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
                <span>🌾</span> Launch Demo Farm (1-Click)
            </button>
        </div>
    );
}
