import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import Layout from "@/components/Layout";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy loading components
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const LessonPage = lazy(() => import("./pages/LessonPage"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const TeacherCourses = lazy(() => import("./pages/TeacherCourses"));
const TeacherTests = lazy(() => import("./pages/TeacherTests"));
const TeacherStudents = lazy(() => import("./pages/TeacherStudents"));
const TeacherReports = lazy(() => import("./pages/TeacherReports"));
const TeacherAssignments = lazy(() => import("./pages/TeacherAssignments"));
const TeacherMonitoring = lazy(() => import("./pages/TeacherMonitoring"));
const TeacherSelfAssessments = lazy(() => import("./pages/TeacherSelfAssessments"));
const TeacherCourseDetail = lazy(() => import("./pages/TeacherCourseDetail"));
const TeacherMessages = lazy(() => import("./pages/TeacherMessages"));

const StudentMyCourses = lazy(() => import("./pages/StudentMyCourses"));
const StudentResults = lazy(() => import("./pages/StudentResults"));
const StudentNotifications = lazy(() => import("./pages/StudentNotifications"));
const StudentMetacognition = lazy(() => import("./pages/StudentMetacognition"));
const StudentSettings = lazy(() => import("./pages/StudentSettings"));

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminCourses = lazy(() => import("./pages/AdminCourses"));
const AdminModeration = lazy(() => import("./pages/AdminModeration"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));

const Dashboard = lazy(() => import("./pages/Dashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 border-2 border-[#0056d2] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium text-slate-500">Yuklanmoqda...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* O'qituvchi (Teacher) maxsus */}
                <Route element={<ProtectedRoute requiredRole="teacher"><Layout><Outlet /></Layout></ProtectedRoute>}>
                  <Route path="/teacher" element={<TeacherDashboard />} />
                  <Route path="/teacher/courses" element={<TeacherCourses />} />
                  <Route path="/teacher/courses/:id" element={<TeacherCourseDetail />} />
                  <Route path="/teacher/students" element={<TeacherStudents />} />
                  <Route path="/teacher/assignments" element={<TeacherAssignments />} />
                  <Route path="/teacher/reports" element={<TeacherReports />} />
                  <Route path="/teacher/monitoring" element={<TeacherMonitoring />} />
                  <Route path="/teacher/self-assessments" element={<TeacherSelfAssessments />} />
                  <Route path="/teacher/messages" element={<TeacherMessages />} />
                </Route>

                {/* Talaba (Student) maxsus */}
                <Route element={<ProtectedRoute><Layout><Outlet /></Layout></ProtectedRoute>}>
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
                <Route element={<ProtectedRoute requiredRole="admin"><Layout><Outlet /></Layout></ProtectedRoute>}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/courses" element={<AdminCourses />} />
                  <Route path="/admin/moderation" element={<AdminModeration />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;