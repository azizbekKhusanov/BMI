import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import LessonPage from "./pages/LessonPage";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherCourses from "./pages/TeacherCourses";
import TeacherTests from "./pages/TeacherTests";
import TeacherStudents from "./pages/TeacherStudents";
import TeacherReports from "./pages/TeacherReports";
import TeacherAssignments from "./pages/TeacherAssignments";
import TeacherMonitoring from "./pages/TeacherMonitoring";
import TeacherSelfAssessments from "./pages/TeacherSelfAssessments";
import TeacherCourseDetail from "./pages/TeacherCourseDetail";

import StudentMyCourses from "./pages/StudentMyCourses";
import StudentResults from "./pages/StudentResults";
import StudentNotifications from "./pages/StudentNotifications";

import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminCourses from "./pages/AdminCourses";
import AdminModeration from "./pages/AdminModeration";
import AdminSettings from "./pages/AdminSettings";

import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            
            {/* Umumiy */}
            <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/lessons/:id" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Talaba (Student) maxsus - lek hammaga ochiq bo'lishi mumkin */}
            <Route path="/student/my-courses" element={<ProtectedRoute><StudentMyCourses /></ProtectedRoute>} />
            <Route path="/student/results" element={<ProtectedRoute><StudentResults /></ProtectedRoute>} />
            <Route path="/student/notifications" element={<ProtectedRoute><StudentNotifications /></ProtectedRoute>} />

            {/* O'qituvchi (Teacher) maxsus */}
            <Route path="/teacher" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/courses" element={<ProtectedRoute requiredRole="teacher"><TeacherCourses /></ProtectedRoute>} />
            <Route path="/teacher/courses/:id" element={<ProtectedRoute requiredRole="teacher"><TeacherCourseDetail /></ProtectedRoute>} />
            <Route path="/teacher/tests" element={<Navigate to="/teacher/assignments" replace />} />
            <Route path="/teacher/students" element={<ProtectedRoute requiredRole="teacher"><TeacherStudents /></ProtectedRoute>} />
            <Route path="/teacher/assignments" element={<ProtectedRoute requiredRole="teacher"><TeacherAssignments /></ProtectedRoute>} />
            <Route path="/teacher/reports" element={<ProtectedRoute requiredRole="teacher"><TeacherReports /></ProtectedRoute>} />
            <Route path="/teacher/monitoring" element={<ProtectedRoute requiredRole="teacher"><TeacherMonitoring /></ProtectedRoute>} />
            <Route path="/teacher/self-assessments" element={<ProtectedRoute requiredRole="teacher"><TeacherSelfAssessments /></ProtectedRoute>} />

            {/* Admin maxsus */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/courses" element={<ProtectedRoute requiredRole="admin"><AdminCourses /></ProtectedRoute>} />
            <Route path="/admin/moderation" element={<ProtectedRoute requiredRole="admin"><AdminModeration /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><AdminSettings /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
