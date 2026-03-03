import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // ── On mount: restore auth state from localStorage ──
    useEffect(() => {
        try {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setToken(storedToken);
                console.log('🔄 Auth restored from localStorage:', parsedUser.name, `(${parsedUser.role})`);
            }
        } catch (err) {
            console.warn('⚠️ Corrupted auth data in localStorage, clearing...');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Helper: persist auth state ──
    const saveAuth = useCallback((userData, tokenValue) => {
        localStorage.setItem('token', tokenValue);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setToken(tokenValue);
        console.log('✅ Auth saved:', userData.name, `(${userData.role})`);
    }, []);

    // ── Helper: redirect based on role ──
    const redirectBasedOnRole = useCallback((role) => {
        const roleRoutes = {
            admin: '/admin/dashboard',
            staff: '/staff/dashboard',
            client: '/client/dashboard',
        };
        const target = roleRoutes[role] || '/login';
        console.log(`↗️ Redirecting ${role} → ${target}`);
        navigate(target, { replace: true });
    }, [navigate]);

    // ════════════════════════════════════════
    //  Admin Auth: Send OTP
    // ════════════════════════════════════════
    const sendAdminOTP = useCallback(async (email) => {
        try {
            const { data } = await api.post('/auth/admin/send-otp', { email });
            return { success: true, message: data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send OTP',
            };
        }
    }, []);

    // ════════════════════════════════════════
    //  Admin Auth: Verify OTP
    // ════════════════════════════════════════
    const verifyAdminOTP = useCallback(async (email, otp) => {
        try {
            const { data } = await api.post('/auth/admin/verify-otp', { email, otp });
            saveAuth(data.data.user, data.data.token);
            redirectBasedOnRole('admin');
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Invalid OTP',
            };
        }
    }, [saveAuth, redirectBasedOnRole]);

    // ════════════════════════════════════════
    //  Staff Auth: Login (email + password)
    // ════════════════════════════════════════
    const staffLogin = useCallback(async (email, password) => {
        try {
            const { data } = await api.post('/auth/staff/login', { email, password });
            saveAuth(data.data.user, data.data.token);
            redirectBasedOnRole('staff');
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Staff login failed',
            };
        }
    }, [saveAuth, redirectBasedOnRole]);

    // ════════════════════════════════════════
    //  Client Auth: Google Login
    // ════════════════════════════════════════
    const googleLogin = useCallback(async (tokenId) => {
        try {
            const { data } = await api.post('/auth/client/google-login', { tokenId });
            saveAuth(data.data.user, data.data.token);
            redirectBasedOnRole('client');
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Google login failed',
            };
        }
    }, [saveAuth, redirectBasedOnRole]);

    // ════════════════════════════════════════
    //  Logout
    // ════════════════════════════════════════
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
        console.log('👋 User logged out');
        navigate('/login', { replace: true });
    }, [navigate]);

    const value = {
        user,
        token,
        loading,
        sendAdminOTP,
        verifyAdminOTP,
        staffLogin,
        googleLogin,
        logout,
        redirectBasedOnRole,
        setUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
