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
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-dark p-8 rounded-3xl border border-red-500/20 flex items-center gap-6 text-red-400">
                <AlertCircle className="w-8 h-8 flex-shrink-0" />
                <div>
                    <h3 className="font-bold uppercase tracking-widest text-[11px] mb-1">Something went wrong</h3>
                    <p className="text-sm font-medium opacity-80">{error}</p>
                </div>
            </div>
        );
    }

    const cards = [
        { label: 'Assigned Projects', value: stats.total, icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-sky-400', bg: 'bg-sky-500/10' },
        { label: 'Delayed', value: stats.delayed, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
    ];

    return (
        <div className="space-y-10 animate-reveal">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-display font-bold text-white tracking-tight leading-none text-gradient">My Dashboard</h1>
                    <p className="text-slate-500 mt-3 font-medium text-lg italic">Your projects and progress at a glance.</p>
                </div>
                <Link
                    to="/staff/projects"
                    className="group flex items-center gap-3 px-8 py-5 bg-white/5 border border-white/10 hover:border-white/20 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all hover:bg-white/10 shadow-2xl"
                >
                    View All Projects
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <div key={card.label} className="glass p-6 rounded-[2.5rem] border border-white/5 shadow-xl group hover:border-indigo-500/30 transition-all duration-500">
                        <div className="flex flex-col gap-5">
                            <div className={`${card.bg} ${card.color} w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 ring-1 ring-white/5 group-hover:scale-110 transition-transform`}>
                                <card.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] group-hover:text-slate-400 transition-colors">{card.label}</h3>
                                <p className="text-4xl font-display font-bold text-white mt-1 tracking-tighter">{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Guidelines ── */}
                <div className="lg:col-span-2 glass p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32"></div>

                    <h2 className="text-2xl font-display font-bold text-white mb-10 flex items-center gap-4 relative z-10">
                        <Clock className="w-7 h-7 text-indigo-500" />
                        Quick Tips
                    </h2>

                    <div className="space-y-10 relative z-10">
                        <GuidelineItem
                            number="01"
                            title="Keep Status Updated"
                            description="Regularly update your project status so everyone stays informed."
                        />
                        <GuidelineItem
                            number="02"
                            title="Report Delays Early"
                            description="If something is delayed, report it right away so the team can help."
                        />
                        <GuidelineItem
                            number="03"
                            title="Mark Completed Work"
                            description="Once a project is done, mark it as completed to keep records clean."
                        />
                    </div>
                </div>

                {/* ── Performance Meter ── */}
                <div className="glass-dark p-10 rounded-[3rem] border border-white/10 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent pointer-events-none"></div>

                    <div className="relative z-10">
                        <h3 className="text-3xl font-display font-bold text-white mb-4 leading-tight">Completion Rate</h3>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed italic">
                            You have completed <span className="text-indigo-400 font-bold">{(stats.completed / (stats.total || 1) * 100).toFixed(0)}%</span> of your assigned projects.
                        </p>
                    </div>

                    <div className="mt-12 relative z-10">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                Progress
                            </span>
                            <span className="text-white">{stats.completed}/{stats.total}</span>
                        </div>
                        <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-600 to-sky-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                                style={{ width: `${(stats.completed / (stats.total || 1) * 100)}%` }}
                            ></div>
                        </div>
                        <p className="mt-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center">Project Progress</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GuidelineItem = ({ number, title, description }) => (
    <div className="flex gap-8 items-start group/item">
        <span className="text-5xl font-display font-bold text-white/5 group-hover/item:text-indigo-500/20 transition-all duration-500 leading-none">{number}</span>
        <div>
            <h4 className="font-bold text-white text-xl mb-2 group-hover/item:text-indigo-400 transition-colors uppercase tracking-tight">{title}</h4>
            <p className="text-slate-500 text-[13px] font-medium leading-relaxed max-w-md">{description}</p>
        </div>
    </div>
);

export default StaffDashboard;
