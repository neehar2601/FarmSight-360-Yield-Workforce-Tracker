import React, { useState, useEffect, useRef } from 'react';
import { useDemo } from './DemoContext';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Generates an SVG path string for a rounded rectangle.
 * Used with fillRule="evenodd" to punch a transparent spotlight hole into the dark backdrop.
 */
function getRoundedRectSvgPath(x, y, w, h, r = 14) {
    const rx = Math.max(0, Math.min(r, w / 2, h / 2));
    return `M ${x + rx} ${y} ` +
           `h ${w - 2 * rx} ` +
           `a ${rx} ${rx} 0 0 1 ${rx} ${rx} ` +
           `v ${h - 2 * rx} ` +
           `a ${rx} ${rx} 0 0 1 -${rx} ${rx} ` +
           `h -${w - 2 * rx} ` +
           `a ${rx} ${rx} 0 0 1 -${rx} -${rx} ` +
           `v -${h - 2 * rx} ` +
           `a ${rx} ${rx} 0 0 1 ${rx} -${rx} Z`;
}

export default function DemoTourOverlay() {
    const {
        isTourActive,
        currentTourStep,
        currentPageGuide,
        stopTour,
        nextTourStep,
        prevTourStep,
        openGuideModal
    } = useDemo();

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [targetRect, setTargetRect] = useState(null);
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1280,
        height: typeof window !== 'undefined' ? window.innerHeight : 800
    });
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

    // Locate, elevate to foreground, and highlight the target element
    useEffect(() => {
        if (!isTourActive || !currentStep) {
            setTargetRect(null);
            return;
        }

        let activeEl = null;

        const findTargetElement = () => {
            if (!currentStep.target) return null;
            let el = document.querySelector(currentStep.target);
            if (!el && currentStep.fallbackTarget) {
                el = document.querySelector(currentStep.fallbackTarget);
            }
            if (!el) {
                // Intelligent fallback when items are empty (e.g. 0 crops or 0 workers)
                if (currentStep.target.includes('crop')) {
                    el = document.querySelector('#demo-add-crop-btn') ||
                         document.querySelector('#demo-crops-header') ||
                         document.querySelector('#demo-crop-tabs');
                } else if (
                    currentStep.target.includes('worker') ||
                    currentStep.target.includes('attendance') ||
                    currentStep.target.includes('salary') ||
                    currentStep.target.includes('advance')
                ) {
                    el = document.querySelector('#demo-add-worker-btn') ||
                         document.querySelector('#demo-workers-header') ||
                         document.querySelector('#demo-attendance-tabs');
                } else if (currentStep.target.includes('inventory')) {
                    el = document.querySelector('#demo-add-inventory-btn') ||
                         document.querySelector('#demo-inventory-tabs');
                } else if (currentStep.target.includes('finance')) {
                    el = document.querySelector('#demo-finance-kpis') ||
                         document.querySelector('#demo-finance-crop-table');
                }
            }
            return el;
        };

        const updateRect = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });

            const el = findTargetElement();
            if (el) {
                // If target switched, remove elevation from previous
                if (activeEl && activeEl !== el) {
                    activeEl.classList.remove('demo-tour-pop-foreground');
                    if (activeEl.dataset?.origPosition === 'static') {
                        activeEl.style.position = '';
                        delete activeEl.dataset.origPosition;
                    }
                }

                activeEl = el;

                // Elevate element into foreground
                const computedPos = window.getComputedStyle(el).position;
                if (computedPos === 'static') {
                    el.dataset.origPosition = 'static';
                    el.style.position = 'relative';
                }
                el.classList.add('demo-tour-pop-foreground');

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
                if (activeEl) {
                    activeEl.classList.remove('demo-tour-pop-foreground');
                    if (activeEl.dataset?.origPosition === 'static') {
                        activeEl.style.position = '';
                        delete activeEl.dataset.origPosition;
                    }
                    activeEl = null;
                }
                setTargetRect(null);
            }
        };

        // Initial scroll to bring element to center of viewport
        const initialEl = findTargetElement();
        if (initialEl) {
            initialEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        updateRect();

        // Re-measure after smooth scrolling finishes
        const t1 = setTimeout(updateRect, 150);
        const t2 = setTimeout(updateRect, 400);

        window.addEventListener('resize', updateRect, { passive: true });
        window.addEventListener('scroll', updateRect, { capture: true, passive: true });

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            if (activeEl) {
                activeEl.classList.remove('demo-tour-pop-foreground');
                if (activeEl.dataset?.origPosition === 'static') {
                    activeEl.style.position = '';
                    delete activeEl.dataset.origPosition;
                }
            }
            document.querySelectorAll('.demo-tour-pop-foreground').forEach(node => {
                node.classList.remove('demo-tour-pop-foreground');
                if (node.dataset?.origPosition === 'static') {
                    node.style.position = '';
                    delete node.dataset.origPosition;
                }
            });
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [isTourActive, currentStep, currentTourStep]);

    if (!isTourActive || !currentStep) return null;

    // Spotlight hole dimensions with comfortable padding
    const pad = 10;
    const holeX = targetRect ? Math.max(4, targetRect.left - pad) : 0;
    const holeY = targetRect ? Math.max(4, targetRect.top - pad) : 0;
    const holeW = targetRect ? Math.max(30, targetRect.width + pad * 2) : 0;
    const holeH = targetRect ? Math.max(30, targetRect.height + pad * 2) : 0;

    // Position calculation for the tooltip card
    let cardStyle = {};
    if (targetRect) {
        const cardWidth = Math.min(420, windowSize.width - 32);
        const spaceBelow = windowSize.height - targetRect.bottom;
        const spaceAbove = targetRect.top;

        if (spaceBelow > 310) {
            cardStyle = {
                top: Math.min(windowSize.height - 320, targetRect.bottom + 16),
                left: Math.max(16, Math.min(windowSize.width - cardWidth - 16, targetRect.left))
            };
        } else if (spaceAbove > 310) {
            cardStyle = {
                bottom: Math.min(windowSize.height - 16, windowSize.height - targetRect.top + 16),
                left: Math.max(16, Math.min(windowSize.width - cardWidth - 16, targetRect.left))
            };
        } else {
            // If neither above nor below has sufficient space, dock at bottom-right
            cardStyle = {
                bottom: 24,
                right: Math.max(16, Math.min(windowSize.width - cardWidth - 16, 24))
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
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 99990 }}>
            {/* ── BACKDROP LAYER: Cutout hole over the active step element ── */}
            {targetRect ? (
                <svg
                    className="fixed inset-0 w-full h-full pointer-events-none"
                    style={{ width: '100vw', height: '100vh', zIndex: 99991 }}
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d={`
                            M 0 0
                            H ${windowSize.width}
                            V ${windowSize.height}
                            H 0
                            Z
                            ${getRoundedRectSvgPath(holeX, holeY, holeW, holeH, 16)}
                        `}
                        fill="rgba(15, 23, 42, 0.78)"
                        className="pointer-events-auto cursor-pointer transition-colors duration-300"
                        onClick={stopTour}
                        title="Click backdrop to exit tour"
                    />
                </svg>
            ) : (
                <div
                    className="fixed inset-0 bg-slate-950/80 pointer-events-auto cursor-pointer transition-opacity duration-300"
                    style={{ zIndex: 99991 }}
                    onClick={stopTour}
                    title="Click backdrop to exit tour"
                />
            )}

            {/* ── SPOTLIGHT FRAME: Glowing border & floating badge around active step ── */}
            {targetRect && (
                <div
                    className="fixed rounded-2xl pointer-events-none transition-all duration-300"
                    style={{
                        top: holeY,
                        left: holeX,
                        width: holeW,
                        height: holeH,
                        border: '3px solid #10b981',
                        boxShadow: '0 0 25px 4px rgba(16, 185, 129, 0.65), inset 0 0 12px rgba(16, 185, 129, 0.2)',
                        zIndex: 99995
                    }}
                >
                    {/* Pulsing beacon glow */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400 animate-pulse opacity-40 pointer-events-none" />

                    {/* Floating Step Badge popping up on top of the element */}
                    <div
                        className={`absolute -top-3.5 ${holeX + 260 > windowSize.width ? 'right-4' : 'left-4'} px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 whitespace-nowrap animate-bounce pointer-events-none z-60 max-w-[90vw] overflow-hidden`}
                    >
                        <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                        <span className="shrink-0">Step {currentTourStep + 1}</span>
                        {currentStep.category && (
                            <span className="opacity-90 font-medium truncate max-w-[200px]">
                                • {currentStep.category.replace(/^[^\w]+/, '')}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* ── TOOLTIP CARD: Highest z-index (100000), fully opaque, never masked ── */}
            <div
                ref={cardRef}
                style={{
                    ...cardStyle,
                    zIndex: 100000
                }}
                className={`fixed max-w-sm sm:max-w-md w-full p-5 rounded-3xl shadow-2xl border-2 pointer-events-auto transition-all animate-in zoom-in-95 duration-200 ${
                    isDark
                        ? 'bg-slate-900 border-emerald-500 text-white shadow-2xl shadow-black/80'
                        : 'bg-white border-emerald-500 text-gray-900 shadow-2xl shadow-emerald-950/20'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header: Guide Title & Step Counter */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            {currentPageGuide?.name || 'Page Guide'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            {currentTourStep + 1} / {steps.length}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                stopTour();
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg font-bold leading-none p-1 rounded transition-colors cursor-pointer"
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
                <p className="text-xs text-gray-700 dark:text-slate-200 leading-relaxed mb-3 font-normal">
                    {currentStep.content}
                </p>

                {/* Pro Tip */}
                {currentStep.tip && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2 mb-4">
                        <span className="text-sm">💡</span>
                        <div className="leading-tight">
                            <strong className="font-bold">Tip:</strong> {currentStep.tip}
                        </div>
                    </div>
                )}

                {/* Navigation Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800 gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            prevTourStep();
                        }}
                        disabled={currentTourStep === 0}
                        className="py-2 px-3.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                        &larr; Back
                    </button>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                stopTour();
                                openGuideModal();
                            }}
                            className="py-2 px-3 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                        >
                            📖 Read Guide
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                nextTourStep();
                            }}
                            className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
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

