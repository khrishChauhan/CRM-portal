import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Mail,
    Lock,
    ShieldCheck,
    Users,
    UserCircle,
    Loader2,
    AlertCircle,
    KeyRound,
    ArrowRight
} from 'lucide-react';

const Login = () => {
    const [selectedRole, setSelectedRole] = useState('admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [staffEmail, setStaffEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpField, setShowOtpField] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { user, sendAdminOTP, verifyAdminOTP, staffLogin: staffLoginFn, googleLogin, redirectBasedOnRole } = useAuth();
    const navigate = useNavigate();

    // If user is already logged in, redirect to their dashboard
    useEffect(() => {
        if (user) {
            redirectBasedOnRole(user.role);
        }
    }, [user, redirectBasedOnRole]);

    const roles = [
        { id: 'admin', title: 'Admin', icon: ShieldCheck },
        { id: 'staff', title: 'Staff', icon: Users },
        { id: 'client', title: 'Client', icon: UserCircle }
    ];

    // Initialize Google Sign-In button when client tab is selected
    useEffect(() => {
        /* global google */
        if (selectedRole === 'client' && window.google) {
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

            if (!clientId || clientId === 'your_google_client_id_here') {
                console.error('❌ VITE_GOOGLE_CLIENT_ID is missing in client/.env');
                setError('Google Login is not configured. Please set VITE_GOOGLE_CLIENT_ID in .env');
                return;
            }

            try {
                google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleGoogleResponse,
                });

                // Small delay to ensure the container exists in DOM
                setTimeout(() => {
                    const btnContainer = document.getElementById('googleBtn');
                    if (btnContainer) {
                        btnContainer.innerHTML = ''; // Clear previous renders
                        google.accounts.id.renderButton(btnContainer, {
                            theme: 'outline',
                            size: 'large',
                            width: '100%',
                        });
                    }
                }, 100);
            } catch (err) {
                console.error('Google Sign-In init error:', err);
                setError('Failed to initialize Google Sign-In');
            }
        }
    }, [selectedRole]);

    // ── Google OAuth handler — uses AuthContext ──
    const handleGoogleResponse = async (response) => {
        setLoading(true);
        setError('');
        try {
            const result = await googleLogin(response.credential);
            if (!result.success) {
                setError(result.message);
            }
        } catch (err) {
            setError('Google Sign-In failed');
        } finally {
            setLoading(false);
        }
    };

    // ── Admin Step 1: Send OTP — uses AuthContext ──
    const handleAdminStep1 = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await sendAdminOTP(email);
            if (result.success) {
                setShowOtpField(true);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // ── Admin Step 2: Verify OTP — uses AuthContext ──
    const handleAdminStep2 = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await verifyAdminOTP(email, otp);
            if (!result.success) {
                setError(result.message);
            }
            // Success → AuthContext handles redirect
        } catch (err) {
            setError('Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    // ── Staff Login — uses AuthContext ──
    const handleStaffLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await staffLoginFn(staffEmail, password);
            if (!result.success) {
                setError(result.message);
            }
            // Success → AuthContext handles redirect
        } catch (err) {
            setError('Login failed');
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
                    <div className="flex items-center space-x-2 text-white font-bold text-xl mb-32 hover:opacity-80 cursor-pointer">
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
                                        setShowOtpField(false);
                                    }}
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${selectedRole === role.id
                                        ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                        : 'border-slate-800 bg-slate-800/20 hover:border-slate-700'
                                        }`}
                                >
                                    <role.icon className={`w-5 h-5 mb-2 ${selectedRole === role.id ? 'text-emerald-500' : 'text-slate-500'
                                        }`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedRole === role.id ? 'text-emerald-400' : 'text-slate-600 font-medium'
                                        }`}>
                                        {role.title}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs animate-shake">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="min-h-[250px]">

                            {/* ADMIN FLOW */}
                            {selectedRole === 'admin' && (
                                <div className="animate-in fade-in duration-500">
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
                                            <div className="space-y-1 animate-in zoom-in-95 duration-300">
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
                                                        className="w-full bg-slate-950 border border-emerald-500/30 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-emerald-500 transition-all outline-none"
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
                                            <p className="text-center text-[10px] text-slate-600 hover:text-emerald-500 cursor-pointer" onClick={() => setShowOtpField(false)}>
                                                Use a different email address?
                                            </p>
                                        )}
                                    </form>
                                </div>
                            )}

                            {/* STAFF FLOW */}
                            {selectedRole === 'staff' && (
                                <div className="animate-in fade-in duration-500">
                                    <form onSubmit={handleStaffLogin} className="space-y-5">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest">Staff Email</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-emerald-500" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={staffEmail}
                                                    onChange={(e) => setStaffEmail(e.target.value)}
                                                    placeholder="staff@company.com"
                                                    className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-3.5 rounded-xl focus:border-emerald-500 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest">Master Password</label>
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

                            {/* CLIENT FLOW */}
                            {selectedRole === 'client' && (
                                <div className="flex flex-col items-center justify-center min-h-[220px] animate-in fade-in duration-500">
                                    <div id="googleBtn" className="w-full"></div>
                                    <p className="mt-6 text-[11px] text-slate-600 max-w-[250px] text-center">
                                        Access your project dashboard using your official Google Work account.
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
