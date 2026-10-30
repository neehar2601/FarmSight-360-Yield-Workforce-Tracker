import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PAGE_GUIDES, getGuideForPath } from './demoConfig';
import { tokenStore } from '../../utils/apiClient';

const DemoContext = createContext(null);

const SEEN_PAGES_STORAGE_KEY = 'farm360_page_guide_seen_v1';

export const useDemo = () => {
    const context = useContext(DemoContext);
    if (!context) {
        throw new Error('useDemo must be used within a DemoProvider');
    }
    return context;
};

export const DemoProvider = ({ children }) => {
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
    const [isTourActive, setIsTourActive] = useState(false);
    const [currentTourStep, setCurrentTourStep] = useState(0);
    const [currentPath, setCurrentPath] = useState(window.location.pathname);
    const [seenPages, setSeenPages] = useState(() => {
        try {
            const raw = localStorage.getItem(SEEN_PAGES_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });

    // Keep currentPath synced with popstate & history changes
    useEffect(() => {
        const handleLocationChange = () => {
            setCurrentPath(window.location.pathname);
        };
        window.addEventListener('popstate', handleLocationChange);
        return () => window.removeEventListener('popstate', handleLocationChange);
    }, []);

    // Current page guide
    const currentPageGuide = getGuideForPath(currentPath);

    // First-time visit detection per page
    const shouldShowFirstTimePrompt = useCallback((pageId) => {
        const id = pageId || currentPageGuide?.id;
        if (!id) return false;
        return !seenPages[id];
    }, [currentPageGuide, seenPages]);

    const markPageSeen = useCallback((pageId) => {
        const id = pageId || currentPageGuide?.id;
        if (!id) return;
        setSeenPages(prev => {
            const updated = { ...prev, [id]: true };
            try {
                localStorage.setItem(SEEN_PAGES_STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
                console.warn('Could not persist to localStorage', e);
            }
            return updated;
        });
    }, [currentPageGuide]);

    // Modal Controls
    const openGuideModal = useCallback(() => {
        setIsGuideModalOpen(true);
        if (currentPageGuide) {
            markPageSeen(currentPageGuide.id);
        }
    }, [currentPageGuide, markPageSeen]);

    const closeGuideModal = useCallback(() => {
        setIsGuideModalOpen(false);
    }, []);

    // Spotlight Tour Controls
    const startTour = useCallback(() => {
        if (currentPageGuide?.tourSteps?.length > 0) {
            setCurrentTourStep(0);
            setIsTourActive(true);
            setIsGuideModalOpen(false);
            markPageSeen(currentPageGuide.id);
        } else {
            openGuideModal();
        }
    }, [currentPageGuide, markPageSeen, openGuideModal]);

    const startTourAt = useCallback((stepIndex = 0) => {
        if (currentPageGuide?.tourSteps?.length > 0) {
            const idx = Math.max(0, Math.min(stepIndex, currentPageGuide.tourSteps.length - 1));
            setCurrentTourStep(idx);
            setIsTourActive(true);
            setIsGuideModalOpen(false);
            markPageSeen(currentPageGuide.id);
        } else {
            openGuideModal();
        }
    }, [currentPageGuide, markPageSeen, openGuideModal]);

    const stopTour = useCallback(() => {
        setIsTourActive(false);
        setCurrentTourStep(0);
    }, []);

    const nextTourStep = useCallback(() => {
        const steps = currentPageGuide?.tourSteps || [];
        if (currentTourStep < steps.length - 1) {
            setCurrentTourStep(prev => prev + 1);
        } else {
            stopTour();
        }
    }, [currentPageGuide, currentTourStep, stopTour]);

    const prevTourStep = useCallback(() => {
        if (currentTourStep > 0) {
            setCurrentTourStep(prev => prev - 1);
        }
    }, [currentTourStep]);

    // Quick instant demo login
    const launchInstantFarmerDemo = useCallback(async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:4000'}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'farmer@example.com', password: 'Tester@123' })
            });
            const data = await res.json();
            if (data.accessToken) {
                tokenStore.setAccess(data.accessToken);
                tokenStore.setRefresh(data.refreshToken);
                if (data.user?.farms?.length > 0) {
                    localStorage.setItem('farm360_current_farm', data.user.farms[0].id);
                }
                window.location.href = '/';
                return;
            }
        } catch (err) {
            console.error('Instant login failed', err);
        }
        window.location.href = '/';
    }, []);

    const value = {
        currentPageGuide,
        isGuideModalOpen,
        openGuideModal,
        closeGuideModal,
        isTourActive,
        currentTourStep,
        startTour,
        startTourAt,
        stopTour,
        nextTourStep,
        prevTourStep,
        shouldShowFirstTimePrompt,
        markPageSeen,
        launchInstantFarmerDemo,
        allGuides: PAGE_GUIDES
    };

    return (
        <DemoContext.Provider value={value}>
            {children}
        </DemoContext.Provider>
    );
};
