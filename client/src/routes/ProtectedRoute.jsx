import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export const RoleProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!user) return <Navigate to="/login" replace />;

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};
