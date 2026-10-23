import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Director Components
import { DirectorLayout } from './components/layout/DirectorLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TeachersPage } from './pages/TeachersPage';
import { StudentsPage } from './pages/StudentsPage';
import { CoinsPage } from './pages/CoinsPage';
import { GroupsPage } from './pages/GroupsPage';
import { CoursesPage } from './pages/CoursesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { TeacherSalaryPage } from './pages/TeacherSalaryPage';
import { ReportsPage } from './pages/ReportsPage';
import { ShopPage } from './pages/ShopPage';
import { OrdersPage } from './pages/OrdersPage';
import { SettingsPage } from './pages/SettingsPage';

// Student Components
import { StudentLayout } from './components/layout/StudentLayout';
import { StudentLoginPage } from './pages/student/StudentLoginPage';
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentCoinsPage } from './pages/student/StudentCoinsPage';
import { StudentShopPage } from './pages/student/StudentShopPage';
import { StudentAttendancePage } from './pages/student/StudentAttendancePage';
import { StudentSchedulePage } from './pages/student/StudentSchedulePage';
import { StudentGroupPage } from './pages/student/StudentGroupPage';
import { StudentHomeworkPage } from './pages/student/StudentHomeworkPage';
import { StudentAnnouncementsPage } from './pages/student/StudentAnnouncementsPage';
import { StudentNotificationsPage } from './pages/student/StudentNotificationsPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { StudentPaymentsPage } from './pages/student/StudentPaymentsPage';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/student/login" replace />;
  }
  if (role === 'DIRECTOR') {
    return <Navigate to="/director/dashboard" replace />;
  }
  return <Navigate to="/student/dashboard" replace />;
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <LanguageProvider>
          <BrowserRouter>
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<RootRedirect />} />

              {/* Public Login Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/student/login" element={<StudentLoginPage />} />

              {/* Protected Student Panel Routes */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute requiredRole="STUDENT">
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/student/dashboard" replace />} />
                <Route path="dashboard" element={<StudentDashboardPage />} />
                <Route path="coins" element={<StudentCoinsPage />} />
                <Route path="shop" element={<StudentShopPage />} />
                <Route path="attendance" element={<StudentAttendancePage />} />
                <Route path="schedule" element={<StudentSchedulePage />} />
                <Route path="group" element={<StudentGroupPage />} />
                <Route path="homework" element={<StudentHomeworkPage />} />
                <Route path="announcements" element={<StudentAnnouncementsPage />} />
                <Route path="notifications" element={<StudentNotificationsPage />} />
                <Route path="profile" element={<StudentProfilePage />} />
                <Route path="payments" element={<StudentPaymentsPage />} />
              </Route>

              {/* Protected Director Panel Routes */}
              <Route
                path="/director"
                element={
                  <ProtectedRoute requiredRole="DIRECTOR">
                    <DirectorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/director/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="teachers" element={<TeachersPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="coins" element={<CoinsPage />} />
                <Route path="groups" element={<GroupsPage />} />
                <Route path="courses" element={<CoursesPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="teacher-salary" element={<TeacherSalaryPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="shop" element={<ShopPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
