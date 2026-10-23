import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: 'DIRECTOR' | 'STUDENT';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    if (requiredRole === 'STUDENT' || location.pathname.startsWith('/student')) {
      return <Navigate to="/student/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation
  if (requiredRole && role !== requiredRole) {
    if (role === 'STUDENT') {
      return <Navigate to="/student/dashboard" replace />;
    }
    if (role === 'DIRECTOR') {
      return <Navigate to="/director/dashboard" replace />;
    }
  }

  return children;
};
