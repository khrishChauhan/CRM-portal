import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (idOrEmail, password, role) => {
        try {
            let endpoint = '';
            let payload = {};

            if (role === 'staff') {
                endpoint = '/auth/staff/login';
                payload = { staffId: idOrEmail, password };
            } else if (role === 'admin') {
                // For admin, we use the specialized flow in Login.jsx, 
                // but this helper is here if needed.
                endpoint = '/auth/admin/verify-otp';
                payload = { email: idOrEmail, otp: password };
            }

            const { data } = await api.post(endpoint, payload);

            const { user: userData, token } = data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            redirectBasedOnRole(userData.role);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Authentication failed',
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    const redirectBasedOnRole = (role) => {
        switch (role) {
            case 'admin':
                navigate('/admin/dashboard');
                break;
            case 'staff':
                navigate('/staff/dashboard');
                break;
            case 'client':
                navigate('/client/dashboard');
                break;
            default:
                navigate('/');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, redirectBasedOnRole, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
