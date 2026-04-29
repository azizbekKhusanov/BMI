import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import Layout from "@/components/Layout";
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
import StudentMetacognition from "./pages/StudentMetacognition";
import StudentSettings from "./pages/StudentSettings";

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
            
            {/* O'qituvchi (Teacher) maxsus */}
            <Route element={<ProtectedRoute requiredRole="teacher"><Layout><div className="flex-1 overflow-auto"><Outlet /></div></Layout></ProtectedRoute>}>
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/teacher/courses" element={<TeacherCourses />} />
              <Route path="/teacher/courses/:id" element={<TeacherCourseDetail />} />
              <Route path="/teacher/students" element={<TeacherStudents />} />
              <Route path="/teacher/assignments" element={<TeacherAssignments />} />
              <Route path="/teacher/reports" element={<TeacherReports />} />
              <Route path="/teacher/monitoring" element={<TeacherMonitoring />} />
              <Route path="/teacher/self-assessments" element={<TeacherSelfAssessments />} />
            </Route>

            {/* Talaba (Student) maxsus */}
            <Route element={<ProtectedRoute><Layout><div className="flex-1 overflow-auto"><Outlet /></div></Layout></ProtectedRoute>}>
              <Route path="/student/dashboard" element={<Dashboard />} />
              <Route path="/student/courses" element={<Courses />} />
              <Route path="/student/courses/:id" element={<CourseDetail />} />
              <Route path="/lessons/:id" element={<LessonPage />} />
              <Route path="/student/my-courses" element={<StudentMyCourses />} />
              <Route path="/student/results" element={<StudentResults />} />
              <Route path="/student/notifications" element={<StudentNotifications />} />
              <Route path="/student/metacognition" element={<StudentMetacognition />} />
              <Route path="/student/settings" element={<StudentSettings />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Admin maxsus */}
            <Route element={<ProtectedRoute requiredRole="admin"><Layout><div className="flex-1 overflow-auto"><Outlet /></div></Layout></ProtectedRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/courses" element={<AdminCourses />} />
              <Route path="/admin/moderation" element={<AdminModeration />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;