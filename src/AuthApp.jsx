import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SPAuthProvider, useSPAuth } from './contexts/SPAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import ProfileSettings from './components/auth/ProfileSettings';
import FarmSelector from './components/auth/FarmSelector';
import InitialSetup from './components/auth/InitialSetup';
import SPApp from './components/sp/SPApp';
import SPRegisterPage from './components/sp/SPRegisterPage';
import App from './App'; // The existing main app
import { DemoProvider } from './components/demo/DemoContext';
import FirstTimeDemoPrompt from './components/demo/FirstTimeDemoPrompt';
import DemoTourOverlay from './components/demo/DemoTourOverlay';
import DemoFloatingButton from './components/demo/DemoFloatingButton';
import FeatureDemoModal from './components/demo/FeatureDemoModal';

const AuthenticatedApp = () => {
    const { isAuthenticated, currentUser, currentFarm, loading: farmLoading, completeFirstLogin } = useAuth();
    const { isSPAuthenticated, loading: spLoading } = useSPAuth();

    const [authView, setAuthView] = useState(() => {
        if (window.location.pathname === '/sp/register') return 'spRegister';
        return 'login'; // 'login' | 'register' | 'forgotPassword' | 'spRegister'
    });

    const [showInitialSetup, setShowInitialSetup] = useState(false);
    const [showProfileSettings, setShowProfileSettings] = useState(false);

    useEffect(() => {
        const handleLocationChange = () => {
            if (window.location.pathname === '/sp/register') {
                setAuthView('spRegister');
            }
        };
        window.addEventListener('popstate', handleLocationChange);
        return () => window.removeEventListener('popstate', handleLocationChange);
    }, []);

    if (farmLoading || spLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block p-3 bg-green-600 rounded-full mb-4">
                        <svg className="animate-spin w-12 h-12 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <p className="text-gray-600">Loading FarmSight 360...</p>
                </div>
            </div>
        );
    }

    // 1. If authenticated as Service Provider, render SP App
    if (isSPAuthenticated) {
        return <SPApp />;
    }

    // 2. If authenticated as Farmer with selected farm, render main App
    if (isAuthenticated && currentFarm) {
        if (showInitialSetup && currentUser?.isFirstLogin) {
            return (
                <InitialSetup
                    onComplete={() => {
                        completeFirstLogin();
                        setShowInitialSetup(false);
                    }}
                    onSkip={() => {
                        completeFirstLogin();
                        setShowInitialSetup(false);
                    }}
                />
            );
        }

        return (
            <>
                <App onOpenProfile={() => setShowProfileSettings(true)} />
                {showProfileSettings && (
                    <ProfileSettings onClose={() => setShowProfileSettings(false)} />
                )}
            </>
        );
    }

    // 3. If authenticated as Farmer but no farm selected
    if (isAuthenticated && !currentFarm) {
        return (
            <FarmSelector
                onFarmSelected={() => {
                    if (currentUser?.isFirstLogin) {
                        setShowInitialSetup(true);
                    }
                }}
                onAddFarm={() => {
                    alert('Add farm functionality coming soon!');
                }}
            />
        );
    }

    // 4. Not authenticated - Routing public auth views
    const handleLoginSuccess = (result) => {
        if (result.requiresFarmSelection) {
            setAuthView('farmSelector');
        } else if (result.isFirstLogin) {
            setShowInitialSetup(true);
        }
    };

    const handleRegisterSuccess = (result) => {
        if (result.isFirstLogin) {
            setShowInitialSetup(true);
        }
    };

    if (authView === 'register') {
        return (
            <RegisterPage
                onRegisterSuccess={handleRegisterSuccess}
                onNavigateToLogin={() => {
                    window.history.pushState({}, '', '/');
                    setAuthView('login');
                }}
            />
        );
    }

    if (authView === 'spRegister') {
        return (
            <SPRegisterPage
                onNavigateToLogin={() => {
                    window.history.pushState({}, '', '/');
                    setAuthView('login');
                }}
                onRegisterSuccess={() => {
                    window.history.pushState({}, '', '/sp/dashboard');
                }}
            />
        );
    }

    if (authView === 'forgotPassword') {
        return (
            <ForgotPasswordPage
                onBack={() => setAuthView('login')}
                onSuccess={() => setAuthView('login')}
            />
        );
    }

    return (
        <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={() => {
                window.history.pushState({}, '', '/register');
                setAuthView('register');
            }}
            onForgotPassword={() => setAuthView('forgotPassword')}
            onSPLoginSuccess={() => {
                window.history.pushState({}, '', '/sp/dashboard');
            }}
            onNavigateToSPRegister={() => {
                window.history.pushState({}, '', '/sp/register');
                setAuthView('spRegister');
            }}
        />
    );
};

const AuthApp = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <SPAuthProvider>
                    <DemoProvider>
                        <AuthenticatedApp />
                        <FirstTimeDemoPrompt />
                        <DemoTourOverlay />
                        <DemoFloatingButton />
                        <FeatureDemoModal />
                    </DemoProvider>
                </SPAuthProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default AuthApp;
