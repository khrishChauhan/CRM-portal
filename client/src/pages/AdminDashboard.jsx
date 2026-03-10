import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Users,
    UserCheck,
    Briefcase,
    Loader2,
    AlertCircle,
    Activity,
    Clock,
    User
} from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/dashboard/admin');
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
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/5 p-8 rounded-[2.5rem] border border-red-500/20 flex items-center gap-4 text-red-400">
                <AlertCircle className="w-8 h-8" />
                <p className="font-bold text-lg">{error}</p>
            </div>
        );
    }

    const cards = [
        { name: 'Total Users', value: stats.totalUsers, subtitle: 'Registered', icon: Users, color: 'text-indigo-400', glow: 'shadow-[0_0_40px_rgba(99,102,241,0.1)]' },
        { name: 'Total Staff', value: stats.totalStaff, subtitle: 'Team Members', icon: UserCheck, color: 'text-emerald-400', glow: 'shadow-[0_0_40px_rgba(16,185,129,0.1)]' },
        { name: 'Total Clients', value: stats.totalClients, subtitle: 'Clients', icon: Briefcase, color: 'text-amber-400', glow: 'shadow-[0_0_40px_rgba(245,158,11,0.1)]' },
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight text-gradient leading-tight">Overview</h1>
                    <p className="text-slate-500 mt-2 font-medium text-base md:text-lg">Real-time stats and recent activity.</p>
                </div>
                <div className="self-center md:self-end px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Live Data</span>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                {cards.map((card, idx) => (
                    <div key={card.name} className={`glass p-8 rounded-[3rem] group hover:border-indigo-500/30 transition-all duration-500 hover:-translate-y-2 ${card.glow} animate-reveal`} style={{ animationDelay: `${idx * 0.1}s` }}>
                        <div className="flex flex-col gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 ${card.color} group-hover:scale-110 transition-transform duration-500 ring-1 ring-white/5`}>
                                <card.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{card.name}</h3>
                                <div className="flex items-baseline gap-3">
                                    <p className="text-5xl font-display font-bold text-white tracking-tighter">{card.value}</p>
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{card.subtitle}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activities Section */}
            <div className="glass rounded-[2rem] md:rounded-[3.5rem] overflow-hidden animate-reveal shadow-2xl" style={{ animationDelay: '0.4s' }}>
                <div className="px-6 py-6 md:px-10 md:py-10 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between bg-white/[0.01] gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-white tracking-tight">Recent Activity</h2>
                    </div>
                    <div className="hidden sm:flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-900" />
                            ))}
                        </div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                            +42 others
                        </span>
                    </div>
                </div>

                <div className="divide-y divide-white/5">
                    {stats.recentActivities && stats.recentActivities.length > 0 ? (
                        stats.recentActivities.map((log, idx) => (
                            <ActivityRow key={idx} log={log} />
                        ))
                    ) : (
                        <div className="p-32 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-white/5">
                                <Clock className="w-10 h-10 text-slate-700" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-white tracking-tight">No activity yet</h3>
                            <p className="text-slate-500 mt-2 max-w-xs font-medium">Actions will show up here as they happen.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ActivityRow = ({ log }) => {
    const roleColors = {
        admin: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        staff: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        client: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    };

    return (
        <div className="px-6 py-6 md:px-10 md:py-8 hover:bg-white/[0.02] transition-colors group cursor-default">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                    <div className="relative">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 group-hover:bg-white/10 transition-all duration-500 group-hover:scale-105 ring-1 ring-white/5`}>
                            <User className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-950 border border-white/10 rounded-full flex items-center justify-center shadow-lg">
                            <div className={`w-2.5 h-2.5 rounded-full ${log.actorRole === 'admin' ? 'bg-indigo-500' : log.actorRole === 'staff' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        </div>
                    </div>
                    <div>
                        <p className="text-lg font-medium text-slate-200 leading-tight group-hover:text-white transition-colors">
                            {log.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2.5">
                            <span className={`px-3 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-[0.15em] ${roleColors[log.actorRole] || 'bg-white/5 text-slate-500 border-white/5'}`}>
                                {log.actorRole}
                            </span>
                            <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-2 tracking-widest uppercase">
                                <Clock className="w-3.5 h-3.5 text-slate-600" />
                                {new Date(log.createdAt).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
