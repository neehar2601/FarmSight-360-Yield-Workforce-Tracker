import React, { useState } from 'react';
import { useDemo } from './DemoContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PAGE_GUIDES } from './demoConfig';

export default function FeatureDemoModal() {
    const {
        isGuideModalOpen,
        closeGuideModal,
        currentPageGuide,
        startTour,
        startTourAt,
    } = useDemo();

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Allow user to view another page guide from the dropdown if they want
    const [selectedGuideKey, setSelectedGuideKey] = useState(null);

    if (!isGuideModalOpen) return null;

    const guide = selectedGuideKey ? PAGE_GUIDES[selectedGuideKey] : currentPageGuide;
    if (!guide) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
                onClick={closeGuideModal}
            />

            {/* Modal Dialog */}
            <div
                className={`relative z-10 w-full max-w-3xl rounded-3xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden transition-all animate-in zoom-in-95 duration-200 ${
                    isDark
                        ? 'bg-slate-900 border-slate-700 text-white shadow-slate-950/90'
                        : 'bg-white border-gray-200 text-gray-900 shadow-2xl'
                }`}
            >
                {/* ── TOP HEADER ────────────────────────────────────────── */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-emerald-600/10 via-emerald-500/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-600/30 flex-shrink-0">
                            {guide.icon}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
                                    How to Use: <span className="text-emerald-600 dark:text-emerald-400">{guide.name}</span>
                                </h2>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                    Page Guide
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                Everything you need to navigate, make entries, and use this page.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {guide.tourSteps && guide.tourSteps.length > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    closeGuideModal();
                                    startTour();
                                }}
                                className="hidden sm:flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                            >
                                <span>▶</span> Start Step-by-Step Tour
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={closeGuideModal}
                            className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-2 rounded-xl text-xl font-bold leading-none hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            title="Close"
                        >
                            &times;
                        </button>
                    </div>
                </div>

                {/* ── CONTENT BODY ──────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">

                    {/* 1. What This Page Does */}
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                            <span>📌</span> 1. What This Page Does
                        </div>
                        <p className="text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed font-medium">
                            {guide.whatItDoes}
                        </p>
                    </div>

                    {/* 2. How to Navigate Through This Page */}
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-2">
                            <span>🧭</span> 2. How to Navigate Through This Page
                        </h4>
                        <div className="space-y-2">
                            {guide.howToNavigate.map((item, i) => {
                                const text = typeof item === 'string' ? item : item.text;
                                const stepIdx = typeof item === 'object' ? item.tourStepIndex : undefined;
                                return (
                                    <div key={i} className="flex items-start justify-between gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 text-xs">
                                        <div className="flex items-start gap-2">
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">•</span>
                                            <span className="text-gray-700 dark:text-slate-200 leading-relaxed">{text}</span>
                                        </div>
                                        {stepIdx !== undefined && (
                                            <button
                                                type="button"
                                                onClick={() => startTourAt(stepIdx)}
                                                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline shrink-0 flex items-center gap-1"
                                            >
                                                <span>▶ Demo</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. How to Make Entries */}
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-2">
                            <span>✍️</span> 3. How to Make Entries (Step-by-Step)
                        </h4>
                        <div className="space-y-2">
                            {guide.howToMakeEntries.map((item, i) => {
                                const text = typeof item === 'string' ? item : item.text;
                                const stepIdx = typeof item === 'object' ? item.tourStepIndex : undefined;
                                return (
                                    <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-emerald-200/80 dark:border-emerald-900/60 text-xs shadow-xs">
                                        <div className="flex items-start gap-3">
                                            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-extrabold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5">
                                                {i + 1}
                                            </span>
                                            <span className="text-gray-800 dark:text-slate-200 leading-relaxed font-medium">
                                                {text}
                                            </span>
                                        </div>
                                        {stepIdx !== undefined && (
                                            <button
                                                type="button"
                                                onClick={() => startTourAt(stepIdx)}
                                                className="py-1 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-800 font-bold text-[11px] shrink-0 transition-colors flex items-center gap-1"
                                            >
                                                <span>▶ Demo step</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 4. How to Use That Page's Components */}
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-2">
                            <span>🧩</span> 4. Components on This Page &amp; What They Do
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {guide.componentsGuide.map((comp, i) => (
                                <div key={i} className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 space-y-1 flex flex-col justify-between">
                                    <div>
                                        <h5 className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                                            <span className="text-emerald-500">▶</span> {comp.name}
                                        </h5>
                                        <p className="text-[11px] text-gray-600 dark:text-slate-400 leading-relaxed mt-1">
                                            {comp.desc}
                                        </p>
                                    </div>
                                    {comp.tourStepIndex !== undefined && (
                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={() => startTourAt(comp.tourStepIndex)}
                                                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline flex items-center gap-1"
                                            >
                                                <span>🔍 Spotlight on page &rarr;</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── FOOTER ─────────────────────────────────────────────── */}
                <div className="px-6 py-3.5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-4 flex-shrink-0 text-xs">
                    {/* Page Guide Switcher */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 hidden sm:inline">Guide for:</span>
                        <select
                            value={selectedGuideKey || currentPageGuide?.id || 'dashboard'}
                            onChange={(e) => setSelectedGuideKey(e.target.value)}
                            className="py-1 px-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 font-semibold text-xs focus:outline-none"
                        >
                            {Object.values(PAGE_GUIDES).map(g => (
                                <option key={g.id} value={g.id}>
                                    {g.icon} {g.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        {guide.tourSteps && guide.tourSteps.length > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    closeGuideModal();
                                    startTour();
                                }}
                                className="sm:hidden py-1.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                            >
                                ▶ Start Tour
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={closeGuideModal}
                            className="py-1.5 px-4 rounded-xl border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Got It, Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
