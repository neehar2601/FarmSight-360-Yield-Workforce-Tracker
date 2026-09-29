import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockStore } from './mockStore';

const MarketplaceContext = createContext(null);

export const MarketplaceProvider = ({ children }) => {
    const [, setTick] = useState(0);

    useEffect(() => {
        const unsubscribe = mockStore.subscribe(() => {
            setTick(t => t + 1);
        });
        return unsubscribe;
    }, []);

    const activeRole = mockStore.getActiveRole();
    const currentUser = mockStore.getCurrentUser();
    const currentFarm = mockStore.getCurrentFarm();

    const value = {
        mockStore,
        activeRole,
        setActiveRole: (role) => mockStore.setActiveRole(role),
        currentUser,
        setCurrentUser: (id) => mockStore.setCurrentUser(id),
        currentFarm,
        allUsers: mockStore.state.users,
        resetData: () => mockStore.resetToDefault(),
    };

    return (
        <MarketplaceContext.Provider value={value}>
            {children}
        </MarketplaceContext.Provider>
    );
};

export const useMarketplace = () => {
    const context = useContext(MarketplaceContext);
    if (!context) {
        throw new Error('useMarketplace must be used within a MarketplaceProvider');
    }
    return context;
};
