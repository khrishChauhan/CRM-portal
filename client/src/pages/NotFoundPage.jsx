import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Texture & Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="relative z-10 text-center animate-reveal">
                <h1 className="text-[12rem] font-display font-black text-[#1A1A1A]/5 tracking-tighter leading-none mb-[-2rem] select-none">
                    404
                </h1>
                <div className="bg-white p-12 rounded-[40px] card-shadow border border-gray-100 relative">
                    <h2 className="text-4xl font-display font-bold text-[#1A1A1A] tracking-tight leading-none mb-4 uppercase">Lost in Space</h2>
                    <p className="text-[#6B7280] max-w-sm mx-auto font-medium text-lg leading-relaxed">
                        The resource you are looking for has been moved or doesn't exist in our system.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-12 inline-flex items-center space-x-3 px-10 py-5 blue-gradient text-white font-bold text-xs uppercase tracking-[0.2em] rounded-2xl btn-shadow hover:-translate-y-1 active:scale-95 group transition-all"
                    >
                        <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Back to Dashboard</span>
                    </button>
                </div>
            </div>

            {/* Bottom details */}
            <div className="absolute bottom-12 text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">
                System Error // Code 404
            </div>
        </div>
    );
};

export default NotFoundPage;
