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
            <div className="flex flex-col items-center justify-center py-20 md:py-32 min-h-[300px] md:min-h-[500px]">
                <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-blue-600 mb-4" />
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
                {cards.map((card, idx) => (
                    <div key={card.name} className="bg-white p-4 sm:p-5 rounded-[20px] border border-gray-100 shadow-md group hover:-translate-y-1 transition-all duration-300 flex flex-col items-start h-full relative overflow-hidden">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bgColor} ${card.color} mb-3 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                            <card.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl sm:text-3xl font-display font-bold text-[#1A1A1A] tracking-tighter leading-none mb-1">{card.value}</p>
                            <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-tight">{card.name}</h3>
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
                        <div className="py-12 md:py-20 text-center flex flex-col items-center justify-center px-4 max-w-sm mx-auto">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-2xl md:rounded-[32px] flex items-center justify-center mb-4 md:mb-6">
                                <Clock className="w-8 h-8 md:w-10 md:h-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg md:text-xl font-display font-bold text-[#1A1A1A] opacity-30 tracking-tight">No Events Recorded</h3>
                            <p className="text-gray-400/80 mt-1 md:mt-2 text-[13px] md:text-sm font-medium italic">System events and intelligence logs will appear here.</p>
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
        <div className="mx-4 sm:mx-6 my-3 p-4 md:p-6 bg-gray-50 border border-gray-200 border-l-[3px] border-l-blue-600 rounded-2xl cursor-default group hover:shadow-sm transition-shadow overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6">
                <div className="flex items-start sm:items-center gap-4 md:gap-6 w-full min-w-0">
                    <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center bg-white border border-gray-200 group-hover:scale-105 transition-all duration-500 shadow-sm">
                            <User className="w-5 h-5 md:w-6 md:h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-white border-2 border-white rounded-full flex items-center justify-center shadow-md">
                            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${log.actorRole === 'admin' ? 'bg-blue-600' : log.actorRole === 'staff' ? 'bg-emerald-600' : 'bg-amber-600'}`}></div>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm md:text-[15px] font-bold text-[#1A1A1A] leading-snug break-words">
                            {log.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 md:mt-2.5">
                            <span className={`px-2.5 py-0.5 rounded-lg border text-[8px] md:text-[9px] font-bold uppercase tracking-widest flex-shrink-0 ${roleColors[log.actorRole] || 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                {log.actorRole}
                            </span>
                            <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-gray-300 rounded-full flex-shrink-0"></div>
                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-widest whitespace-nowrap">
                                <Clock className="w-3 h-3 md:w-4 md:h-4" />
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
                <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 ml-auto flex-shrink-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl whitespace-nowrap">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Recorded</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
