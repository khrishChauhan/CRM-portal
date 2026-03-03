import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — blocks access if user is not logged in
 * Wraps child routes that require authentication
 */
export const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 text-sm font-medium">Authenticating...</p>
                </div>
            </div>
        );
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

/**
 * RoleProtectedRoute — blocks access if user's role is not in allowedRoles
 * Redirects to the user's correct dashboard instead of a dead-end page
 */
export const RoleProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 text-sm font-medium">Checking permissions...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        // Redirect to user's own dashboard instead of a non-existent /unauthorized page
        const roleRoutes = {
            admin: '/admin/dashboard',
            staff: '/staff/dashboard',
            client: '/client/dashboard',
        };
        const fallback = roleRoutes[user.role] || '/login';
        console.warn(`⚠️ Role ${user.role} tried to access route for [${allowedRoles.join(', ')}]. Redirecting to ${fallback}`);
        return <Navigate to={fallback} replace />;
    }

    return <Outlet />;
};
