import React, { useState, useEffect, useRef } from 'react';
import { useDemo } from './DemoContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function DemoTourOverlay() {
    const { isTourActive, currentTourStep, currentPageGuide, stopTour, nextTourStep, prevTourStep, openGuideModal } = useDemo();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [targetRect, setTargetRect] = useState(null);
    const cardRef = useRef(null);

    const steps = currentPageGuide?.tourSteps || [];
    const currentStep = steps[currentTourStep];

    // Listen for Escape and Arrow keys
    useEffect(() => {
        if (!isTourActive) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                stopTour();
            } else if (e.key === 'ArrowRight') {
                nextTourStep();
            } else if (e.key === 'ArrowLeft') {
                prevTourStep();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTourActive, nextTourStep, prevTourStep, stopTour]);

    // Locate and highlight the target element
    useEffect(() => {
        if (!isTourActive || !currentStep) {
            setTargetRect(null);
            return;
        }

        const updateRect = () => {
            if (!currentStep.target) {
                setTargetRect(null);
                return;
            }

            const el = document.querySelector(currentStep.target);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                const rect = el.getBoundingClientRect();
                setTargetRect({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    bottom: rect.bottom,
                    right: rect.right
                });
            } else {
                setTargetRect(null);
            }
        };

        updateRect();
        const timeout = setTimeout(updateRect, 300);

        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [isTourActive, currentStep, currentTourStep]);

    if (!isTourActive || !currentStep) return null;

    // Calculate position for the tooltip card
    let cardStyle = {};
    if (targetRect) {
        const spaceBelow = window.innerHeight - targetRect.bottom;
        const spaceAbove = targetRect.top;

        if (spaceBelow > 300) {
            cardStyle = {
                top: Math.min(window.innerHeight - 340, targetRect.bottom + 16),
                left: Math.max(16, Math.min(window.innerWidth - 420, targetRect.left))
            };
        } else if (spaceAbove > 300) {
            cardStyle = {
                bottom: Math.min(window.innerHeight - 16, window.innerHeight - targetRect.top + 16),
                left: Math.max(16, Math.min(window.innerWidth - 420, targetRect.left))
            };
        } else {
            cardStyle = {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            };
        }
    } else {
        cardStyle = {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
        };
    }

    return (
        <div className="fixed inset-0 z-50 pointer-events-none">
            {/* Darkened backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/60 transition-opacity duration-300 pointer-events-auto"
                onClick={stopTour}
            />

            {/* Glowing spotlight ring around the targeted element if found */}
            {targetRect && (
                <div
                    className="absolute rounded-2xl pointer-events-none transition-all duration-300"
                    style={{
                        top: targetRect.top - 8,
                        left: targetRect.left - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                        boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75), 0 0 20px 4px rgba(16, 185, 129, 0.7)',
                        border: '2px solid #10b981',
                        zIndex: 51
                    }}
                />
            )}

            {/* Interactive Tour Card */}
            <div
                ref={cardRef}
                style={cardStyle}
                className={`fixed z-52 max-w-sm w-full p-5 rounded-3xl shadow-2xl border pointer-events-auto transition-all animate-in zoom-in-95 duration-200 ${
                    isDark
                        ? 'bg-slate-900 border-emerald-500/50 text-white shadow-emerald-950/80'
                        : 'bg-white border-emerald-200 text-gray-900 shadow-emerald-900/30'
                }`}
            >
                {/* Header: Badge & Step Indicator */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            {currentPageGuide?.name || 'Page Guide'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            {currentTourStep + 1} / {steps.length}
                        </span>
                        <button
                            onClick={stopTour}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg font-bold leading-none p-1 rounded"
                            title="End Tour (Esc)"
                        >
                            &times;
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full mb-3 overflow-hidden">
                    <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${((currentTourStep + 1) / steps.length) * 100}%` }}
                    />
                </div>

                {/* Category Tag */}
                {currentStep.category && (
                    <div className="mb-2">
                        <span className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {currentStep.category}
                        </span>
                    </div>
                )}

                {/* Step Title */}
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight mb-2">
                    {currentStep.title}
                </h3>

                {/* Step Content */}
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed mb-3">
                    {currentStep.content}
                </p>

                {/* Pro Tip */}
                {currentStep.tip && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2 mb-4">
                        <span className="text-sm">💡</span>
                        <div className="leading-tight">
                            <strong className="font-bold">Tip:</strong> {currentStep.tip}
                        </div>
                    </div>
                )}

                {/* Navigation Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800 gap-2">
                    <button
                        onClick={prevTourStep}
                        disabled={currentTourStep === 0}
                        className="py-2 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                        &larr; Back
                    </button>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => {
                                stopTour();
                                openGuideModal();
                            }}
                            className="py-2 px-3 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                        >
                            📖 Read Guide
                        </button>

                        <button
                            onClick={nextTourStep}
                            className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1"
                        >
                            <span>{currentTourStep === steps.length - 1 ? 'Finish' : 'Next'}</span>
                            <span>&rarr;</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
