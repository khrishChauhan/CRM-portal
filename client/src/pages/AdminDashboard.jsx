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
                setError(err.response?.data?.message || 'Failed to fetch dashboard stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-center gap-4 text-red-700">
                <AlertCircle className="w-6 h-6" />
                <p className="font-bold">{error}</p>
            </div>
        );
    }

    const cards = [
        { name: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
        { name: 'Total Staff', value: stats.totalStaff, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
        { name: 'Total Clients', value: stats.totalClients, icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50/50' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Overview</h1>
                <p className="text-slate-500 mt-2 font-medium">Production metrics and real-time activity tracking.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {cards.map((card) => (
                    <div key={card.name} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center gap-6">
                            <div className={`${card.bg} ${card.color} p-5 rounded-[1.5rem]`}>
                                <card.icon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">{card.name}</h3>
                                <p className="text-4xl font-black text-slate-900 mt-1">{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activities Section */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <Activity className="w-6 h-6 text-primary-600" />
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Recent Activities</h2>
                    </div>
                    <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Live Feed
                    </span>
                </div>

                <div className="divide-y divide-slate-50">
                    {stats.recentActivities && stats.recentActivities.length > 0 ? (
                        stats.recentActivities.map((log, idx) => (
                            <ActivityRow key={idx} log={log} />
                        ))
                    ) : (
                        <div className="p-20 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                                <Clock className="w-8 h-8 text-slate-200" />
                            </div>
                            <h3 className="font-bold text-slate-900">No activity yet</h3>
                            <p className="text-slate-400 text-sm mt-1">Activities will appear here as they are recorded.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ActivityRow = ({ log }) => {
    const roleColors = {
        admin: 'bg-indigo-100 text-indigo-700',
        staff: 'bg-emerald-100 text-emerald-700',
        client: 'bg-amber-100 text-amber-700'
    };

    return (
        <div className="px-10 py-6 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 group-hover:bg-white transition-colors`}>
                        <User className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800 leading-snug">
                            {log.message}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${roleColors[log.actorRole] || 'bg-slate-100 text-slate-500'}`}>
                                {log.actorRole}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
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
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
