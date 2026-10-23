import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MyGroups } from './pages/MyGroups';
import { MyStudents } from './pages/MyStudents';
import { LessonSchedule } from './pages/LessonSchedule';
import { Attendance } from './pages/Attendance';
import { HomeworkPage } from './pages/Homework';
import { VideoSubmissions } from './pages/VideoSubmissions';
import { StudentProgress } from './pages/StudentProgress';
import { AnnouncementsPage } from './pages/Announcements';
import { ReportsPage } from './pages/Reports';
import { TeacherSalaryPage } from './pages/TeacherSalary';
import { TeacherProfilePage } from './pages/TeacherProfile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public login route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Teacher routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="groups" element={<MyGroups />} />
            <Route path="students" element={<MyStudents />} />
            <Route path="schedule" element={<LessonSchedule />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="homework" element={<HomeworkPage />} />
            <Route path="video-submissions" element={<VideoSubmissions />} />
            <Route path="progress" element={<StudentProgress />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="salary" element={<TeacherSalaryPage />} />
            <Route path="profile" element={<TeacherProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
