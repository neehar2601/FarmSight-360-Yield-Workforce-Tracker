import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import FarmSelector from './components/auth/FarmSelector';
import InitialSetup from './components/auth/InitialSetup';
import App from './App'; // The existing main app

const AuthenticatedApp = () => {
    const { isAuthenticated, currentUser, currentFarm, loading, completeFirstLogin } = useAuth();
    const [authView, setAuthView] = useState('login'); // 'login', 'register', 'farmSelector', 'initialSetup'
    const [showInitialSetup, setShowInitialSetup] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block p-3 bg-green-600 rounded-full mb-4">
                        <svg className="animate-spin w-12 h-12 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // If authenticated and farm selected, show main app
    if (isAuthenticated && currentFarm) {
        // Show initial setup if first login and not completed yet
        if (showInitialSetup && currentUser?.isFirstLogin) {
            return (
                <InitialSetup
                    onComplete={(financialData) => {
                        // Save initial financial data to localStorage
                        // This will be handled by the main App component
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

        return <App />;
    }

    // If authenticated but no farm selected, show farm selector
    if (isAuthenticated && !currentFarm) {
        return (
            <FarmSelector
                onFarmSelected={() => {
                    // Check if first login
                    if (currentUser?.isFirstLogin) {
                        setShowInitialSetup(true);
                    }
                }}
                onAddFarm={() => {
                    // TODO: Show add farm modal/page
                    alert('Add farm functionality coming soon!');
                }}
            />
        );
    }

    // Not authenticated - show login or register
    const handleLoginSuccess = (result) => {
        if (result.requiresFarmSelection) {
            setAuthView('farmSelector');
        } else if (result.isFirstLogin) {
            setShowInitialSetup(true);
        }
        // Otherwise, App will render automatically
    };

    const handleRegisterSuccess = (result) => {
        if (result.isFirstLogin) {
            setShowInitialSetup(true);
        }
        // Otherwise, App will render automatically
    };

    if (authView === 'register') {
        return (
            <RegisterPage
                onRegisterSuccess={handleRegisterSuccess}
                onNavigateToLogin={() => setAuthView('login')}
            />
        );
    }

    return (
        <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={() => setAuthView('register')}
        />
    );
};

const AuthApp = () => {
    return (
        <AuthProvider>
            <AuthenticatedApp />
        </AuthProvider>
    );
};

export default AuthApp;
