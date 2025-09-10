import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import Dashboard from '@/components/Dashboard';
import Login from '@/components/Auth/Login';
import Register from '@/components/Auth/Register';
import YieldsPage from '@/components/Yields/YieldsPage';
import WorkersPage from '@/components/Workers/WorkersPage';
import FinancialsPage from '@/components/Financials/FinancialsPage';
import FertilisersPage from '@/components/Fertilisers/FertilisersPage';
import WeatherPage from '@/components/Weather/WeatherPage';
import SettingsPage from '@/components/Settings/SettingsPage';
import LoadingSpinner from '@/components/Common/LoadingSpinner';

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route component (redirects if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />
      
      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/yields" 
        element={
          <ProtectedRoute>
            <YieldsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/workers" 
        element={
          <ProtectedRoute>
            <WorkersPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/financials" 
        element={
          <ProtectedRoute>
            <FinancialsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/fertilisers" 
        element={
          <ProtectedRoute>
            <FertilisersPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/weather" 
        element={
          <ProtectedRoute>
            <WeatherPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
