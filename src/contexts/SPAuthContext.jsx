import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { spProviderApi, spTokenStore } from '../utils/spApi';

const SPAuthContext = createContext(null);

export const useSPAuth = () => {
    const context = useContext(SPAuthContext);
    if (!context) {
        throw new Error('useSPAuth must be used within an SPAuthProvider');
    }
    return context;
};

export const SPAuthProvider = ({ children }) => {
    const [currentSP, setCurrentSP] = useState(() => spTokenStore.getUser());
    const [isSPAuthenticated, setIsSPAuthenticated] = useState(() => Boolean(spTokenStore.getAccess()));
    const [loading, setLoading] = useState(true);

    const handleForcedLogout = useCallback(() => {
        setCurrentSP(null);
        setIsSPAuthenticated(false);
        spTokenStore.clear();
    }, []);

    useEffect(() => {
        window.addEventListener('sp:logout', handleForcedLogout);
        return () => window.removeEventListener('sp:logout', handleForcedLogout);
    }, [handleForcedLogout]);

    useEffect(() => {
        const verifySession = async () => {
            const token = spTokenStore.getAccess();
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const data = await spProviderApi.getMe();
                if (data?.sp) {
                    setCurrentSP(data.sp);
                    setIsSPAuthenticated(true);
                }
            } catch (err) {
                console.warn('SP session restore failed:', err.message);
                handleForcedLogout();
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, [handleForcedLogout]);

    const login = async (email, password) => {
        const res = await spProviderApi.login(email, password);
        setCurrentSP(res.sp);
        setIsSPAuthenticated(true);
        return res;
    };

    const register = async (payload) => {
        const res = await spProviderApi.register(payload);
        setCurrentSP(res.sp);
        setIsSPAuthenticated(true);
        return res;
    };

    const logout = async () => {
        await spProviderApi.logout();
        setCurrentSP(null);
        setIsSPAuthenticated(false);
    };

    const updateProfile = async (data) => {
        if (!currentSP?.id) throw new Error('Not authenticated');
        const res = await spProviderApi.updateProfile(currentSP.id, data);
        if (res?.sp) setCurrentSP(res.sp);
        return res;
    };

    const refreshProfile = async () => {
        try {
            const data = await spProviderApi.getMe();
            if (data?.sp) setCurrentSP(data.sp);
        } catch (e) {
            console.error('Failed to refresh SP profile:', e);
        }
    };

    return (
        <SPAuthContext.Provider
            value={{
                currentSP,
                isSPAuthenticated,
                loading,
                login,
                register,
                logout,
                updateProfile,
                refreshProfile,
            }}
        >
            {children}
        </SPAuthContext.Provider>
    );
};

export default SPAuthContext;
