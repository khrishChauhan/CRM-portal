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
        <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row relative overflow-hidden selection:bg-indigo-500/30">
            {/* Background Texture/Noise */}
            <div className="absolute inset-0 noise-bg opacity-[0.03] pointer-events-none z-50"></div>

            {/* LEFT SIDE: Hero Section */}
            <div className="flex w-full lg:w-3/5 flex-col justify-between p-8 sm:p-12 lg:p-16 relative overflow-hidden">
                {/* Decorative Gradients */}
                <div className="absolute top-[-20%] left-[-10%] w-[300px] sm:w-[500px] lg:w-[800px] h-[300px] sm:h-[500px] lg:h-[800px] bg-indigo-600/10 rounded-full blur-[80px] lg:blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[250px] sm:w-[400px] lg:w-[600px] h-[250px] sm:h-[400px] lg:h-[600px] bg-violet-600/10 rounded-full blur-[80px] lg:blur-[120px] delay-1000"></div>

                <div className="relative z-10 animate-reveal">
                    <div className="flex items-center space-x-3 text-white font-display font-medium text-xl sm:text-2xl mb-12 sm:mb-20 lg:mb-32 tracking-tight group cursor-pointer text-center sm:text-left justify-center sm:justify-start">
                        <div className="relative">
                            <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)]"></div>
                            <div className="absolute inset-0 w-3 h-3 bg-indigo-400 rounded-full animate-ping opacity-75"></div>
                        </div>
                        <span className="opacity-90 group-hover:opacity-100 transition-opacity">CRM Portal</span>
                    </div>

                    <div className="max-w-xl mx-auto sm:mx-0 text-center sm:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] mb-6 sm:mb-8 animate-reveal" style={{ animationDelay: '0.2s' }}>
                            Enterprise Solutions
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-white leading-[1.1] mb-6 sm:mb-8 text-gradient animate-reveal" style={{ animationDelay: '0.4s' }}>
                            Precision in Every <br />
                            <span className="text-indigo-400">Connection.</span>
                        </h1>
                        <p className="text-slate-400 text-base sm:text-lg lg:text-xl leading-relaxed max-w-lg mb-8 sm:mb-12 animate-reveal" style={{ animationDelay: '0.6s' }}>
                            A unified dashboard for teams to manage projects, staff, and clients with ease.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 text-slate-500 text-[10px] sm:text-sm font-medium tracking-widest uppercase opacity-50 flex items-center gap-3 sm:gap-4 justify-center sm:justify-start animate-reveal mt-8 lg:mt-0" style={{ animationDelay: '0.8s' }}>
                    <div className="w-8 sm:w-12 h-[1px] bg-slate-800"></div>
                    v2.4 Core Release
                </div>
            </div>

            {/* RIGHT SIDE: Authentication Card */}
            <div className="w-full lg:w-2/5 flex items-center justify-center p-6 sm:p-12 relative z-10">
                <div className="w-full max-w-md animate-reveal" style={{ animationDelay: '0.5s' }}>
                    <div className="glass-dark p-10 sm:p-12 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        {/* Card Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

                        <div className="mb-12 text-center relative z-10">
                            <h2 className="text-4xl font-display font-bold text-white mb-3">Welcome Back</h2>
                            <p className="text-slate-500 font-medium">Choose how you sign in</p>
                        </div>

                        {/* ROLE PICKER */}
                        <div className="grid grid-cols-3 gap-4 mb-10 relative z-10">
                            {roles.map((role, idx) => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedRole(role.id);
                                        setError('');
                                        setShowOtpField(false);
                                    }}
                                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all duration-500 animate-reveal ${selectedRole === role.id
                                        ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20'
                                        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] grayscale hover:grayscale-0'
                                        }`}
                                    style={{ animationDelay: `${0.6 + (idx * 0.1)}s` }}
                                >
                                    <role.icon className={`w-6 h-6 mb-3 transition-colors duration-500 ${selectedRole === role.id ? 'text-indigo-400' : 'text-slate-500'
                                        }`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-colors duration-500 ${selectedRole === role.id ? 'text-indigo-300' : 'text-slate-600'
                                        }`}>
                                        {role.title}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-8 flex items-center gap-4 p-5 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-400 text-xs animate-shake relative z-10">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="font-medium leading-snug">{error}</span>
                            </div>
                        )}

                        <div className="min-h-[260px] relative z-10">

                            {/* ADMIN FLOW */}
                            {selectedRole === 'admin' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <form onSubmit={showOtpField ? handleAdminStep2 : handleAdminStep1} className="space-y-7">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-500 ml-1 uppercase tracking-widest opacity-80">Admin Email</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                                <input
                                                    type="email"
                                                    required
                                                    disabled={showOtpField}
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="Enter admin email"
                                                    className="w-full bg-slate-950/50 border border-white/5 text-white pl-14 pr-5 py-4.5 rounded-2xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none disabled:opacity-40"
                                                />
                                            </div>
                                        </div>

                                        {showOtpField && (
                                            <div className="space-y-2 animate-in zoom-in-95 duration-500">
                                                <label className="text-[11px] font-bold text-slate-500 ml-1 uppercase tracking-widest opacity-80">Verification Code</label>
                                                <div className="relative group">
                                                    <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                                                    <input
                                                        type="text"
                                                        required
                                                        maxLength="6"
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value)}
                                                        placeholder="••••••"
                                                        className="w-full bg-slate-950/50 border border-indigo-500/40 text-white pl-14 pr-5 py-4.5 rounded-2xl focus:border-indigo-500 transition-all outline-none text-xl tracking-[0.5em] font-display font-medium"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-display font-bold py-5 rounded-2xl transition-all shadow-[0_20px_40px_-12px_rgba(79,70,229,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:translate-y-0"
                                        >
                                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                                <>
                                                    <span className="text-base">{showOtpField ? 'Verify Code' : 'Send OTP'}</span>
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                                                </>
                                            )}
                                        </button>

                                        {showOtpField && (
                                            <p className="text-center text-[10px] text-slate-600 hover:text-indigo-400 font-bold uppercase tracking-widest cursor-pointer transition-colors" onClick={() => setShowOtpField(false)}>
                                                Use a different email?
                                            </p>
                                        )}
                                    </form>
                                </div>
                            )}

                            {/* STAFF FLOW */}
                            {selectedRole === 'staff' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <form onSubmit={handleStaffLogin} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-500 ml-1 uppercase tracking-widest opacity-80">Email</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={staffEmail}
                                                    onChange={(e) => setStaffEmail(e.target.value)}
                                                    placeholder="Enter your email"
                                                    className="w-full bg-slate-950/50 border border-white/5 text-white pl-14 pr-5 py-4.5 rounded-2xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-500 ml-1 uppercase tracking-widest opacity-80">Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                                <input
                                                    type="password"
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full bg-slate-950/50 border border-white/5 text-white pl-14 pr-5 py-4.5 rounded-2xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-display font-bold py-5 rounded-2xl transition-all shadow-[0_20px_40px_-12px_rgba(79,70,229,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Sign in'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* CLIENT FLOW */}
                            {selectedRole === 'client' && (
                                <div className="flex flex-col items-center justify-center min-h-[240px] animate-in fade-in zoom-in-95 duration-700">
                                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8 shadow-xl">
                                        <UserCircle className="w-10 h-10 text-indigo-400" />
                                    </div>
                                    <div id="googleBtn" className="w-full scale-110 mb-2"></div>
                                    <p className="mt-8 text-[11px] text-slate-500 font-medium tracking-wide max-w-[280px] text-center leading-relaxed">
                                        Sign in with your Google account to view your projects.
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
