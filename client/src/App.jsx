import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleProtectedRoute } from './routes/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ManageStaff from './pages/ManageStaff';
import ManageClients from './pages/ManageClients';
import ManageProjects from './pages/ManageProjects';
import StaffDashboard from './pages/StaffDashboard';
import ManageStaffProjects from './pages/ManageStaffProjects';
import ClientDashboard from './pages/ClientDashboard';
import MyProjects from './pages/MyProjects';
import ManageAccessRequests from './pages/ManageAccessRequests';
import ProjectUpdates from './pages/ProjectUpdates';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>

              {/* ── Admin Routes ── */}
              <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={
                  <DashboardLayout><AdminDashboard /></DashboardLayout>
                } />
                <Route path="/admin/staff" element={
                  <DashboardLayout><ManageStaff /></DashboardLayout>
                } />
                <Route path="/admin/clients" element={
                  <DashboardLayout><ManageClients /></DashboardLayout>
                } />
                <Route path="/admin/projects" element={
                  <DashboardLayout><ManageProjects /></DashboardLayout>
                } />
                <Route path="/admin/access-requests" element={
                  <DashboardLayout><ManageAccessRequests /></DashboardLayout>
                } />

                <Route path="/admin/projects/:id/updates" element={
                  <DashboardLayout><ProjectUpdates /></DashboardLayout>
                } />
              </Route>

              {/* ── Staff Routes ── */}
              <Route element={<RoleProtectedRoute allowedRoles={['staff']} />}>
                <Route path="/staff/dashboard" element={
                  <DashboardLayout><StaffDashboard /></DashboardLayout>
                } />
                <Route path="/staff/projects" element={
                  <DashboardLayout><ManageStaffProjects /></DashboardLayout>
                } />
                <Route path="/staff/projects/:id/updates" element={
                  <DashboardLayout><ProjectUpdates /></DashboardLayout>
                } />
              </Route>

              {/* ── Client Routes ── */}
              <Route element={<RoleProtectedRoute allowedRoles={['client']} />}>
                <Route path="/client/dashboard" element={
                  <DashboardLayout><ClientDashboard /></DashboardLayout>
                } />
                <Route path="/client/projects" element={
                  <DashboardLayout><MyProjects /></DashboardLayout>
                } />
                <Route path="/client/projects/:id/updates" element={
                  <DashboardLayout><ProjectUpdates /></DashboardLayout>
                } />
              </Route>

            </Route>

            {/* Root Redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
