import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
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

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <LanguageProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Default redirects */}
              <Route path="/" element={<Navigate to="/director/dashboard" replace />} />
              <Route path="/director" element={<Navigate to="/director/dashboard" replace />} />

              {/* Protected Director Panel Nested Routes */}
              <Route
                path="/director"
                element={
                  <ProtectedRoute>
                    <DirectorLayout />
                  </ProtectedRoute>
                }
              >
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
              <Route path="*" element={<Navigate to="/director/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
