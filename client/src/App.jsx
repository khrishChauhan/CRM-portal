import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleProtectedRoute } from './routes/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import ClientDashboard from './pages/ClientDashboard';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes Wrapper */}
          <Route element={<ProtectedRoute />}>

            {/* Admin Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={
                <DashboardLayout><AdminDashboard /></DashboardLayout>
              } />
              {/* Add more admin routes here */}
            </Route>

            {/* Staff Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={['staff']} />}>
              <Route path="/staff/dashboard" element={
                <DashboardLayout><StaffDashboard /></DashboardLayout>
              } />
              {/* Add more staff routes here */}
            </Route>

            {/* Client Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={['client']} />}>
              <Route path="/client/dashboard" element={
                <DashboardLayout><ClientDashboard /></DashboardLayout>
              } />
              {/* Add more client routes here */}
            </Route>

          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
