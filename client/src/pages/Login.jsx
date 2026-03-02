import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Mail,
    Lock,
    ShieldCheck,
    Users,
    UserCircle,
    Loader2,
    AlertCircle,
    Hash,
    KeyRound,
    ArrowRight,
    CheckCircle
} from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
    const [selectedRole, setSelectedRole] = useState('admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [staffId, setStaffId] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpField, setShowOtpField] = useState(false);
    const [success, setSuccess] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleReady, setGoogleReady] = useState(false);

    const googleBtnRef = useRef(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const roles = [
        { id: 'admin', title: 'Admin', icon: ShieldCheck },
        { id: 'staff', title: 'Staff', icon: Users },
        { id: 'client', title: 'Client', icon: UserCircle }
    ];

    // Google Identity Services - Initialize once GSI script loads
    useEffect(() => {
        if (selectedRole !== 'client') return;

        if (!GOOGLE_CLIENT_ID) {
            setError('Google Client ID is not configured. Check your .env file.');
            console.error('Missing VITE_GOOGLE_CLIENT_ID in client/.env');
            return;
        }

        const initGoogle = () => {
            if (!window.google?.accounts?.id) return;

            try {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleResponse,
                    auto_select: false,
                });

                // Render the official Google Sign-In button
                if (googleBtnRef.current) {
                    googleBtnRef.current.innerHTML = ''; // Clear previous renders
                    window.google.accounts.id.renderButton(googleBtnRef.current, {
                        type: 'standard',
                        theme: 'outline',
                        size: 'large',
                        text: 'continue_with',
                        shape: 'pill',
                        width: 350,
                    });
                }
                setGoogleReady(true);
                setError('');
            } catch (err) {
                console.error('Google init error:', err);
                setError('Failed to initialize Google Sign-In.');
            }
        };

        // GSI script may already be loaded or not yet
        if (window.google?.accounts?.id) {
            initGoogle();
        } else {
            // Wait for the script to load
            const interval = setInterval(() => {
                if (window.google?.accounts?.id) {
                    clearInterval(interval);
                    initGoogle();
                }
            }, 300);

            // Cleanup after 10 seconds
            const timeout = setTimeout(() => {
                clearInterval(interval);
                if (!window.google?.accounts?.id) {
                    setError('Google Sign-In script failed to load. Please refresh the page.');
                }
            }, 10000);

            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        }
    }, [selectedRole]);

    const handleGoogleResponse = async (response) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/client/google-login', {
                tokenId: response.credential,
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/client/dashboard';
        } catch (err) {
            console.error('Google login backend error:', err.response?.data || err);
            setError(err.response?.data?.message || 'Google Sign-In failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAdminStep1 = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/auth/admin/send-otp', { email });
            setShowOtpField(true);
            setSuccess('OTP sent to your email!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleAdminStep2 = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const { data } = await api.post('/auth/admin/verify-otp', { email, otp });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/admin/dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleStaffLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/staff/login', { staffId, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/staff/dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex font-sans">

            {/* LEFT SIDE: Hero Section */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-slate-900 border-r border-slate-800 relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]"></div>
                <div className="relative z-10">
                    <div className="flex items-center space-x-2 text-white font-bold text-xl mb-32">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                        <span>CRM Portal</span>
                    </div>
                    <div className="max-w-md">
                        <h1 className="text-5xl font-extrabold text-white leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
                            Manage projects with clarity and control
                        </h1>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Real-time synchronization between Admin, Staff, and Clients. Secure and robust infrastructure.
                        </p>
                    </div>
                </div>
                <div className="relative z-10 text-slate-500 text-sm italic">
                    v2.0 Enterprise Release
                </div>
            </div>

            {/* RIGHT SIDE: Dynamic Card */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md">
                    <div className="bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl relative">

                        <div className="mb-10 text-center">
                            <h2 className="text-3xl font-bold text-white mb-2">Secure Access</h2>
                            <p className="text-slate-500 text-sm">Select your role to view login options</p>
                        </div>

                        {/* ROLE PICKER */}
                        <div className="grid grid-cols-3 gap-3 mb-10">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedRole(role.id);
                                        setError('');
                                        setSuccess('');
                                        setShowOtpField(false);
                                    }}
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${selectedRole === role.id
                                        ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                        : 'border-slate-800 bg-slate-800/20 hover:border-slate-700'
                                        }`}
                                >
                                    <role.icon className={`w-5 h-5 mb-2 ${selectedRole === role.id ? 'text-emerald-500' : 'text-slate-500'}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedRole === role.id ? 'text-emerald-400' : 'text-slate-600'}`}>
                                        {role.title}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* SUCCESS MESSAGE */}
                        {success && (
                            <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{success}</span>
                            </div>
                        )}

                        {/* ERROR MESSAGE */}
                        {error && (
                            <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="min-h-[250px]">

                            {/* ADMIN FLOW */}
                            {selectedRole === 'admin' && (
                                <div>
                                    <form onSubmit={showOtpField ? handleAdminStep2 : handleAdminStep1} className="space-y-6">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Admin Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                                <input
                                                    type="email"
                                                    required
                                                    disabled={showOtpField}
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="admin@gmail.com"
                                                    className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-emerald-500 transition-all outline-none disabled:opacity-50"
                                                />
                                            </div>
                                        </div>

                                        {showOtpField && (
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Enter 6-Digit OTP</label>
                                                <div className="relative">
                                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                                                    <input
                                                        type="text"
                                                        required
                                                        maxLength="6"
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value)}
                                                        placeholder="000000"
                                                        className="w-full bg-slate-950 border border-emerald-500/30 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-emerald-500 transition-all outline-none tracking-[0.5em] text-center font-mono text-lg"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                                <>
                                                    <span>{showOtpField ? 'Verify & Enter' : 'Send OTP'}</span>
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>

                                        {showOtpField && (
                                            <p
                                                className="text-center text-[10px] text-slate-600 hover:text-emerald-500 cursor-pointer transition-colors"
                                                onClick={() => { setShowOtpField(false); setSuccess(''); setOtp(''); }}
                                            >
                                                Use a different email address?
                                            </p>
                                        )}
                                    </form>
                                </div>
                            )}

                            {/* STAFF FLOW */}
                            {selectedRole === 'staff' && (
                                <div>
                                    <form onSubmit={handleStaffLogin} className="space-y-5">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest">Internal Staff ID</label>
                                            <div className="relative group">
                                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-emerald-500" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={staffId}
                                                    onChange={(e) => setStaffId(e.target.value)}
                                                    placeholder="STF-001"
                                                    className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-emerald-500 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest">Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-emerald-500" />
                                                <input
                                                    type="password"
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-emerald-500 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Staff Sign In'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* CLIENT FLOW - Google OAuth */}
                            {selectedRole === 'client' && (
                                <div className="flex flex-col items-center justify-center min-h-[220px]">
                                    {loading && (
                                        <div className="flex items-center gap-2 text-emerald-400 text-sm mb-4">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Authenticating with Google...</span>
                                        </div>
                                    )}

                                    {/* Google renders its official button here */}
                                    <div ref={googleBtnRef} className="w-full flex justify-center"></div>

                                    {!googleReady && !error && (
                                        <div className="flex items-center gap-2 text-slate-500 text-sm mt-4">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Loading Google Sign-In...</span>
                                        </div>
                                    )}

                                    <p className="mt-6 text-[11px] text-slate-600 max-w-[250px] text-center">
                                        Access your project dashboard using your Google account.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
