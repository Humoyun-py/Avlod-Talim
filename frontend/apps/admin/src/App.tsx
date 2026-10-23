import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { UserRole } from './types';

// Layout
import { AdminLayout } from './components/layout/AdminLayout';

// Auth Pages
import { StaffLogin } from './pages/auth/StaffLogin';
import { StudentLogin } from './pages/auth/StudentLogin';

// Admin Pages
import { DashboardPage } from './pages/admin/DashboardPage';
import { StudentsPage } from './pages/admin/StudentsPage';
import { GroupsPage } from './pages/admin/GroupsPage';
import { CoursesPage } from './pages/admin/CoursesPage';
import { PaymentsPage } from './pages/admin/PaymentsPage';
import { PaymentVerificationPage } from './pages/admin/PaymentVerificationPage';
import { ShopPage } from './pages/admin/ShopPage';
import { ShopOrdersPage } from './pages/admin/ShopOrdersPage';
import { NotificationsPage } from './pages/admin/NotificationsPage';
import { ProfilePage } from './pages/admin/ProfilePage';

// Other Role Panels
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { StudentDashboard } from './pages/student/StudentDashboard';

// Error Pages
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoadingState } from './components/common/States';

// Route Guard component
interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingState message="Authenticating session with backend authority..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Index route redirector
const RootRedirect: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingState message="Connecting to Avlod Ta'lim..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'director') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  if (user.role === 'student') return <Navigate to="/student" replace />;

  return <Navigate to="/admin/dashboard" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Root index routing */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public Authentication Pages */}
            <Route path="/login" element={<StaffLogin />} />
            <Route path="/student-login" element={<StudentLogin />} />

            {/* Main console for administrators and directors */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin', 'director']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="groups" element={<GroupsPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="payment-verification" element={<PaymentVerificationPage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="shop-orders" element={<ShopOrdersPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="/director" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Dedicated Teacher Console */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'director', 'admin']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />

            {/* Dedicated Student Portal */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Error and fallback pages */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
