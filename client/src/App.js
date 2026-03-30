import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; // wait for session restore
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/home" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="ambient-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="orb orb-4"></div>
      </div>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><AuthScreen /></PublicRoute>} />
          <Route path="/:section" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
