import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Briefcase,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    Calendar,
    ChevronRight,
    TrendingUp,
    MessageSquare
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const StaffDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [{ data: dashData }, { data: queryData }] = await Promise.all([
                    api.get('/dashboard/staff'),
                    api.get('/queries/all'),
                ]);
                setStats({ ...dashData.data, totalQueries: queryData.data.open || 0 });
            } catch (err) {
                setError(err.response?.data?.message || 'Could not load dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 md:py-32 min-h-[300px] md:min-h-[500px]">
                <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-[#173d9f] mb-4" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Initialising Portal...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-8 rounded-[32px] border border-red-100 flex items-center gap-6 text-red-500 shadow-sm">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md border border-red-50">
                    <AlertCircle className="w-7 h-7 flex-shrink-0" />
                </div>
                <div>
                    <h3 className="font-bold uppercase tracking-widest text-[10px] mb-1">Status Error</h3>
                    <p className="text-sm font-medium opacity-80">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-reveal pb-20">
            {/* ── Header ── */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1A1A1A] tracking-tight leading-none">Operational Dashboard</h1>
                    <p className="text-gray-500 mt-2 font-medium text-base leading-relaxed">Centralised overview of your active assignments and milestones.</p>
                </div>
                <button
                    onClick={() => navigate('/staff/projects')}
                    className="w-full lg:w-auto px-8 py-4 blue-gradient text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#173d9f]/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    Project Ledger
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* ── Stats Grid (Clickable) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
                <StatCard 
                    label="Assigned Projects" 
                    value={stats.total} 
                    icon={Briefcase} 
                    color="text-[#173d9f]" 
                    bg="bg-[#173d9f]/5" 
                    onClick={() => navigate('/staff/projects')} 
                />
                <StatCard 
                    label="In Progress" 
                    value={stats.inProgress} 
                    icon={TrendingUp} 
                    color="text-[#173d9f]" 
                    bg="bg-[#173d9f]/5" 
                    onClick={() => navigate('/staff/projects?status=In+Progress')} 
                />
                <StatCard 
                    label="Completed" 
                    value={stats.completed} 
                    icon={CheckCircle} 
                    color="text-[#173d9f]" 
                    bg="bg-[#173d9f]/5" 
                    onClick={() => navigate('/staff/projects?status=Completed')} 
                />
                <StatCard 
                    label="Pending Updates" 
                    value={stats.delayed} 
                    icon={AlertCircle} 
                    color="text-[#f86a1f]" 
                    bg="bg-[#f86a1f]/5" 
                    onClick={() => navigate('/staff/projects?status=Delayed')} 
                />
                <StatCard 
                    label="Open Queries" 
                    value={stats.totalQueries} 
                    icon={MessageSquare} 
                    color="text-[#f86a1f]" 
                    bg="bg-[#f86a1f]/5" 
                    onClick={() => navigate('/staff/queries')} 
                />
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, color, bg, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-white p-4 sm:p-5 rounded-[20px] border border-gray-100 shadow-md group hover:border-${color === 'text-[#f86a1f]' ? '[#f86a1f]' : '[#173d9f]'}/20 hover:-translate-y-1 transition-all duration-300 flex flex-col items-start h-full cursor-pointer active:scale-[0.98] select-none`}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${color} mb-3 shadow-sm transition-transform group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-2xl sm:text-3xl font-display font-bold text-[#1A1A1A] tracking-tighter leading-none mb-1">{value || 0}</p>
            <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-tight">{label}</h3>
        </div>
    </div>
);

export default StaffDashboard;
