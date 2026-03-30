import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import MentorDashboard from './components/MentorDashboard';

function RoleRouter() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin')  return <AdminDashboard />;
  if (user.role === 'mentor') return <MentorDashboard />;
  return <Dashboard />;
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
          <Route path="/:section" element={<RoleRouter />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
