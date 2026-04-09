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
    ArrowRight,
    Building2,
    Timer
} from 'lucide-react';

import Footer from '../components/Footer';

const Login = () => {
    const [selectedRole, setSelectedRole] = useState('admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [staffEmail, setStaffEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpField, setShowOtpField] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

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

    // OTP Timer countdown logic
    useEffect(() => {
        if (showOtpField && timeLeft > 0) {
            const timerId = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timerId);
        }
    }, [showOtpField, timeLeft]);

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
                setTimeLeft(300); // 5 minutes (Matches backend EXPIRY_MINUTES = 5)
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
        <div className="min-h-screen bg-[#faf8f8] flex flex-col font-body">
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-[440px] animate-reveal">
                    {/* TOP SECTION */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-20 h-20 bg-[#173d9f] rounded-[22px] flex items-center justify-center mb-6 shadow-xl shadow-[#173d9f]/20">
                            <Building2 className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-display font-bold text-[#1A1A1A] mb-2 text-center">Khushi Technology Application</h1>
                        <p className="text-[#6B7280] font-medium text-sm text-center max-w-[280px]">
                            Project Tracking & Management System
                        </p>
                    </div>

                    {/* FORM SECTION */}
                    <div className="bg-white card-shadow rounded-[24px] p-8 mb-6">
                        {/* ROLE PICKER - Subtle Tabs */}
                        <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => {
                                        setSelectedRole(role.id);
                                        setError('');
                                        setShowOtpField(false);
                                        setTimeLeft(0);
                                    }}
                                    className={`flex-1 py-3 px-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                                        selectedRole === role.id
                                            ? 'bg-[#173d9f] text-white shadow-sm'
                                            : 'text-[#173d9f]/60 hover:text-[#173d9f]'
                                    }`}
                                >
                                    {role.title}
                                </button>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs animate-shake">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="font-semibold">{error}</span>
                            </div>
                        )}

                        <form onSubmit={
                            selectedRole === 'admin' 
                                ? (showOtpField ? handleAdminStep2 : handleAdminStep1)
                                : (selectedRole === 'staff' ? handleStaffLogin : (e) => e.preventDefault())
                        } className="space-y-6">
                            
                            {/* Email Field */}
                            {selectedRole !== 'client' && (
                                <div className="space-y-2">
                                    <div className="relative group">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#173d9f] transition-colors z-10" />
                                        <input
                                            type="email"
                                            required
                                            disabled={showOtpField && selectedRole === 'admin'}
                                            value={selectedRole === 'admin' ? email : staffEmail}
                                            onChange={(e) => selectedRole === 'admin' ? setEmail(e.target.value) : setStaffEmail(e.target.value)}
                                            placeholder="Email Address"
                                            className="w-full bg-[#faf8f8] border-2 border-gray-100 text-[#1A1A1A] pl-14 pr-5 py-4.5 rounded-[18px] focus:ring-2 focus:ring-[#173d9f]/20 focus:border-[#173d9f] transition-all outline-none placeholder:text-gray-400 font-medium"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Password / OTP Field */}
                            {((selectedRole === 'staff') || (selectedRole === 'admin' && showOtpField)) && (
                                <div className="space-y-2">
                                    <div className="relative group">
                                        {selectedRole === 'admin' ? (
                                            <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#173d9f] transition-colors z-10" />
                                        ) : (
                                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#173d9f] transition-colors z-10" />
                                        )}
                                        <input
                                            type={selectedRole === 'admin' ? "text" : "password"}
                                            inputMode={selectedRole === 'admin' ? "numeric" : undefined}
                                            pattern={selectedRole === 'admin' ? "[0-9]*" : undefined}
                                            required
                                            value={selectedRole === 'admin' ? otp : password}
                                            onChange={(e) => selectedRole === 'admin' ? setOtp(e.target.value) : setPassword(e.target.value)}
                                            placeholder={selectedRole === 'admin' ? "OTP Code" : "Password"}
                                            className="w-full bg-[#faf8f8] border-2 border-gray-100 text-[#1A1A1A] pl-14 pr-5 py-4.5 rounded-[18px] focus:ring-2 focus:ring-[#173d9f]/20 focus:border-[#173d9f] transition-all outline-none placeholder:text-gray-400 font-medium"
                                        />
                                    </div>
                                    {showOtpField && selectedRole === 'admin' && (
                                        <div className="flex justify-between items-center mt-2 px-2">
                                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                                <Timer className={`w-3.5 h-3.5 ${timeLeft < 60 ? 'text-red-500' : 'text-[#173d9f]'}`} />
                                                Expires in: 
                                                <span className={`font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-[#173d9f]'}`}>
                                                    {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                                                </span>
                                            </span>
                                            {timeLeft === 0 && (
                                                <button 
                                                    type="button"
                                                    onClick={handleAdminStep1}
                                                    disabled={loading}
                                                    className="text-[10px] font-bold text-[#173d9f] hover:underline uppercase tracking-widest disabled:opacity-50"
                                                >
                                                    Resend Code
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Client Google Login */}
                            {selectedRole === 'client' && (
                                <div className="flex flex-col items-center py-4">
                                    <div id="googleBtn" className="w-full"></div>
                                    <p className="mt-6 text-xs text-gray-400 text-center font-medium">
                                        Please use your registered Google account
                                    </p>
                                </div>
                            )}

                             {/* Login Button */}
                            {selectedRole !== 'client' && (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full accent-gradient text-white font-display font-bold py-5 rounded-[18px] shadow-lg shadow-[#f86a1f]/20 hover:opacity-95 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : (
                                        <>
                                            <span className="text-base">{selectedRole === 'admin' && !showOtpField ? 'Send OTP' : 'Login'}</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            )}
                        </form>

                        {showOtpField && selectedRole === 'admin' && (
                            <button 
                                onClick={() => setShowOtpField(false)}
                                className="w-full mt-4 text-[11px] font-bold text-[#173d9f]/50 uppercase tracking-widest hover:text-[#173d9f] transition-colors"
                            >
                                Change Email
                            </button>
                        )}
                    </div>

                    <div className="flex justify-center">
                        <button 
                            onClick={() => navigate('/privacy-policy')}
                            className="text-[12px] text-gray-400 hover:text-[#173d9f] transition-all font-medium tracking-wide flex items-center gap-1.5"
                        >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Privacy Policy
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Login;
