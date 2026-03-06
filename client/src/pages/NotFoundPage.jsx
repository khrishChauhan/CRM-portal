import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Texture & Glow */}
            <div className="absolute inset-0 noise-bg opacity-[0.03] pointer-events-none z-50"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="relative z-10 text-center animate-reveal">
                <h1 className="text-[12rem] font-display font-black text-white/5 tracking-tighter leading-none mb-[-2rem] select-none">
                    404
                </h1>
                <div className="glass-dark p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative">
                    <h2 className="text-4xl font-display font-bold text-white tracking-tight leading-none mb-4 uppercase">Page Not Found</h2>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium text-lg leading-relaxed italic tracking-tight">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-12 inline-flex items-center space-x-3 px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-1 active:scale-95 group"
                    >
                        <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Go Home</span>
                    </button>
                </div>
            </div>

            {/* Cinematic details */}
            <div className="absolute bottom-12 text-[10px] font-bold text-slate-700 uppercase tracking-[0.4em] animate-pulse">
                Error 404 // Page Not Found
            </div>
        </div>
    );
};

export default NotFoundPage;
