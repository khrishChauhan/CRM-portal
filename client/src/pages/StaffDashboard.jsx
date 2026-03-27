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
    TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StaffDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/dashboard/staff');
                setStats(data.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Could not load dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 md:py-32 min-h-[300px] md:min-h-[500px]">
                <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-blue-600 mb-4" />
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

    const cards = [
        { label: 'Assigned Projects', value: stats.total, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-sky-600', bg: 'bg-sky-50' },
        { label: 'Delayed', value: stats.delayed, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    return (
        <div className="space-y-10 animate-reveal pb-20">
            {/* ── Header ── */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1A1A1A] tracking-tight leading-none">Operational Dashboard</h1>
                    <p className="text-gray-500 mt-2 font-medium text-base leading-relaxed">Centralised overview of your active assignments and milestones.</p>
                </div>
                <Link
                    to="/staff/projects"
                    className="w-full lg:w-auto px-8 py-4 blue-gradient text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all btn-shadow hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    Project Ledger
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white p-4 sm:p-5 rounded-[20px] border border-gray-100 shadow-md group hover:-translate-y-1 transition-all duration-300 flex flex-col items-start h-full">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg} ${card.color} mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                            <card.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl sm:text-3xl font-display font-bold text-[#1A1A1A] tracking-tighter leading-none mb-1">{card.value}</p>
                            <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-tight">{card.label}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                {/* ── Guidelines ── */}
                <div className="lg:col-span-2 bg-white p-8 sm:p-10 rounded-[32px] border border-gray-100 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110"></div>

                    <h2 className="text-2xl font-display font-bold text-[#1A1A1A] mb-10 flex items-center gap-4 relative z-10 tracking-tight">
                        <Clock className="w-7 h-7 text-blue-600" />
                        Quick Tips
                    </h2>

                    <div className="space-y-10 relative z-10">
                        <GuidelineItem
                            number="01"
                            title="Intelligence Consistency"
                            description="Ensure all project logs are detailed and regularly updated for client transparency."
                        />
                        <GuidelineItem
                            number="02"
                            title="Proactive Communication"
                            description="Identify potential bottlenecks or delays early to maintain streamlined operations."
                        />
                        <GuidelineItem
                            number="03"
                            title="Finalisation Accuracy"
                            description="Verify all deliverables are met before marking an assignment as fully completed."
                        />
                    </div>
                </div>

                {/* ── Performance Meter ── */}
                <div className="bg-[#1A1A1A] p-10 rounded-[32px] border border-gray-800 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent pointer-events-none"></div>

                    <div className="relative z-10">
                        <h3 className="text-3xl font-display font-bold text-white mb-4 leading-tight tracking-tight">Milestone Velocity</h3>
                        <p className="text-gray-400 text-sm font-medium leading-relaxed italic">
                            You have successfully completed <span className="text-blue-400 font-bold">{(stats.completed / (stats.total || 1) * 100).toFixed(0)}%</span> of your active project ledger.
                        </p>
                    </div>

                    <div className="mt-12 relative z-10">
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                                Performance
                            </span>
                            <span className="text-white">{stats.completed}/{stats.total}</span>
                        </div>
                        <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                            <div
                                className="h-full blue-gradient rounded-full transition-all duration-1000"
                                style={{ width: `${(stats.completed / (stats.total || 1) * 100)}%` }}
                            ></div>
                        </div>
                        <p className="mt-6 text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center">Velocity Coefficient</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GuidelineItem = ({ number, title, description }) => (
    <div className="flex gap-8 items-start group/item">
        <span className="text-5xl font-display font-bold text-gray-100 group-hover/item:text-blue-600/10 transition-all duration-500 leading-none">{number}</span>
        <div>
            <h4 className="font-bold text-[#1A1A1A] text-xl mb-2 group-hover/item:text-blue-600 transition-colors uppercase tracking-tight">{title}</h4>
            <p className="text-gray-400 text-[13px] font-medium leading-relaxed max-w-md">{description}</p>
        </div>
    </div>
);

export default StaffDashboard;
