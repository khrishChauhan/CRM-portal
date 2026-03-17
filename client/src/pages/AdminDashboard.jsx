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
            <div className="flex flex-col items-center justify-center min-h-[500px]">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Compiling Analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-8 rounded-[32px] border border-red-100 flex items-center gap-5 text-red-500 shadow-sm">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md border border-red-50">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold">Initialisation Error</h3>
                    <p className="text-sm font-medium opacity-80">{error}</p>
                </div>
            </div>
        );
    }

    const cards = [
        { name: 'Total Users', value: stats.totalUsers, subtitle: 'System-wide', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
        { name: 'Total Staff', value: stats.totalStaff, subtitle: 'Operators', icon: UserCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
        { name: 'Total Clients', value: stats.totalClients, subtitle: 'Subscribers', icon: Briefcase, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    ];

    return (
        <div className="space-y-10 animate-reveal pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1A1A1A] tracking-tight leading-none">Administrative Overview</h1>
                    <p className="text-gray-500 mt-2 font-medium text-base leading-relaxed">Cross-platform metrics and operational intelligence.</p>
                </div>
                <div className="self-start md:self-end px-4 py-2 bg-white border border-gray-100 rounded-xl flex items-center gap-3 shadow-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(47,107,255,0.4)]"></div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Real-time Stream</span>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 mt-6">
                {cards.map((card, idx) => (
                    <div key={card.name} className="bg-white p-7 md:p-8 rounded-[32px] border border-gray-100 shadow-xl group hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                        <div className="flex flex-col gap-6 relative z-10">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.bgColor} ${card.color} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                                <card.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">{card.name}</h3>
                                <div className="flex items-baseline gap-4">
                                    <p className="text-5xl font-display font-bold text-[#1A1A1A] tracking-tighter">{card.value}</p>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{card.subtitle}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activities Section */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden mt-6">
                <div className="px-8 py-8 md:px-10 md:py-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50">
                            <Activity className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-[#1A1A1A] tracking-tight">Intelligence Feed</h2>
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
                    {stats.recentActivities && stats.recentActivities.length > 0 ? (
                        stats.recentActivities.map((log, idx) => (
                            <ActivityRow key={idx} log={log} />
                        ))
                    ) : (
                        <div className="py-32 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6">
                                <Clock className="w-10 h-10 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-[#1A1A1A] opacity-20 tracking-tight">No events recorded</h3>
                            <p className="text-gray-400 mt-2 max-w-xs font-medium italic">New system events will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ActivityRow = ({ log }) => {
    const roleColors = {
        admin: 'bg-blue-50 text-blue-600 border-blue-100',
        staff: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        client: 'bg-amber-50 text-amber-600 border-amber-100'
    };

    return (
        <div className="px-8 py-8 md:px-10 md:py-8 hover:bg-gray-50 transition-colors group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-6">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50 border border-gray-100 group-hover:scale-105 transition-all duration-500">
                            <User className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border-2 border-white rounded-full flex items-center justify-center shadow-lg">
                            <div className={`w-2 h-2 rounded-full ${log.actorRole === 'admin' ? 'bg-blue-600' : log.actorRole === 'staff' ? 'bg-emerald-600' : 'bg-amber-600'}`}></div>
                        </div>
                    </div>
                    <div>
                        <p className="text-[15px] font-bold text-[#1A1A1A] leading-tight group-hover:text-blue-600 transition-colors">
                            {log.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2.5">
                            <span className={`px-3 py-0.5 rounded-lg border text-[9px] font-bold uppercase tracking-widest ${roleColors[log.actorRole] || 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                {log.actorRole}
                            </span>
                            <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase tracking-widest">
                                <Clock className="w-4 h-4" />
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
                <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Processed</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
