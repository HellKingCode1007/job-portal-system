import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';

// Layout Components
import Layout from './components/layout/Layout';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Public Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import JobList from './pages/jobs/JobList';
import JobDetail from './pages/jobs/JobDetail';

// Protected Pages - Candidates
import CandidateDashboard from './pages/candidate/Dashboard';
import CandidateProfile from './pages/candidate/Profile';
import CandidateApplications from './pages/candidate/Applications';
import CandidateResume from './pages/candidate/Resume';

// Protected Pages - Employers
import EmployerDashboard from './pages/employer/Dashboard';
import EmployerProfile from './pages/employer/Profile';
import EmployerJobs from './pages/employer/Jobs';
import CreateJob from './pages/employer/CreateJob';
import EditJob from './pages/employer/EditJob';
import EmployerApplications from './pages/employer/Applications';

// Protected Pages - Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminJobs from './pages/admin/Jobs';
import AdminApplications from './pages/admin/Applications';
import AdminAnalytics from './pages/admin/Analytics';

// Error Pages
import NotFound from './pages/NotFound';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/jobs" element={<JobList />} />
      <Route path="/jobs/:id" element={<JobDetail />} />

      {/* Protected Routes - Candidates */}
      <Route
        path="/candidate/*"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <Routes>
              <Route path="dashboard" element={<CandidateDashboard />} />
              <Route path="profile" element={<CandidateProfile />} />
              <Route path="applications" element={<CandidateApplications />} />
              <Route path="resume" element={<CandidateResume />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Employers */}
      <Route
        path="/employer/*"
        element={
          <ProtectedRoute allowedRoles={['employer']}>
            <Routes>
              <Route path="dashboard" element={<EmployerDashboard />} />
              <Route path="profile" element={<EmployerProfile />} />
              <Route path="jobs" element={<EmployerJobs />} />
              <Route path="jobs/create" element={<CreateJob />} />
              <Route path="jobs/:id/edit" element={<EditJob />} />
              <Route path="applications" element={<EmployerApplications />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Admin */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <Routes>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="jobs" element={<AdminJobs />} />
              <Route path="applications" element={<AdminApplications />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </AdminRoute>
        }
      />

      {/* Dashboard Redirect */}
      <Route
        path="/dashboard"
        element={
          user ? (
            user.role === 'candidate' ? (
              <Navigate to="/candidate/dashboard" replace />
            ) : user.role === 'employer' ? (
              <Navigate to="/employer/dashboard" replace />
            ) : user.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-1">
          <AppRoutes />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App; 