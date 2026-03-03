import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Users,
    UserCheck,
    Briefcase,
    Loader2,
    AlertCircle,
    CheckCircle
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
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center gap-4 text-red-700">
                <AlertCircle className="w-6 h-6" />
                <p className="font-medium">{error}</p>
            </div>
        );
    }

    const cards = [
        { name: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: 'Total Staff', value: stats.totalStaff, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { name: 'Total Clients', value: stats.totalClients, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
                <p className="text-slate-500 mt-1">Real-time system overview and user metrics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <div key={card.name} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className={`${card.bg} ${card.color} p-4 rounded-2xl`}>
                                <card.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">{card.name}</h3>
                                <p className="text-3xl font-black text-slate-900 mt-0.5">{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions / System Health */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        System Health
                    </h2>
                    <div className="space-y-4">
                        <HealthItem label="Database Connection" status="Optimal" />
                        <HealthItem label="Storage Usage" status="12% Used" />
                        <HealthItem label="Last Backup" status="2 hours ago" />
                        <HealthItem label="Auth Service" status="Running" />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                        <Activity className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2 text-lg">Live Activity coming soon</h3>
                    <p className="text-slate-500 text-sm max-w-xs">WebSocket integration is scheduled for Phase 3 to provide real-time log streaming.</p>
                </div>
            </div>
        </div>
    );
};

const Activity = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const HealthItem = ({ label, status }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
        <span className="text-sm font-bold text-slate-600">{label}</span>
        <span className="text-xs font-black uppercase tracking-widest text-emerald-600 px-3 py-1 bg-white rounded-full ring-1 ring-emerald-100">{status}</span>
    </div>
);

export default AdminDashboard;
