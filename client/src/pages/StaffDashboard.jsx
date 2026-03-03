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
        { label: 'Assigned Projects', value: stats.total, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Delayed', value: stats.delayed, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff Dashboard</h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage your assignments and track progress real-time</p>
                </div>
                <Link
                    to="/staff/projects"
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition shadow-lg shadow-slate-200"
                >
                    View My Projects
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex flex-col gap-4">
                            <div className={`${card.bg} ${card.color} w-12 h-12 rounded-2xl flex items-center justify-center`}>
                                <card.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{card.label}</h3>
                                <p className="text-3xl font-black text-slate-900 mt-1">{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Task Info Card */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                        <Clock className="w-6 h-6 text-primary-500" />
                        Management Guidelines
                    </h2>
                    <div className="space-y-6">
                        <GuidelineItem
                            number="01"
                            title="Update Status Regularly"
                            description="Ensure project status is updated as soon as milestones are reached to maintain accurate reporting."
                        />
                        <GuidelineItem
                            number="02"
                            title="Log Delays Promptly"
                            description="If a project is encountering roadblocks, update the status to 'Delayed' and provide a clear reason."
                        />
                        <GuidelineItem
                            number="03"
                            title="Verify Completion"
                            description="Set the actual completion date only when all deliverables have been formally signed off."
                        />
                    </div>
                </div>

                {/* Quick Profile/Status */}
                <div className="bg-primary-600 p-10 rounded-[2.5rem] text-white shadow-xl shadow-primary-100 flex flex-col justify-between">
                    <div>
                        <h3 className="text-2xl font-black mb-2">My Performance</h3>
                        <p className="text-primary-100 text-sm font-medium leading-relaxed opacity-80">
                            Your completion rate is currently {(stats.completed / (stats.total || 1) * 100).toFixed(0)}%.
                            Keep updating your projects for better visibility.
                        </p>
                    </div>
                    <div className="mt-8">
                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest mb-3">
                            <span>Target Completion</span>
                            <span>{stats.completed}/{stats.total}</span>
                        </div>
                        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-1000"
                                style={{ width: `${(stats.completed / (stats.total || 1) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GuidelineItem = ({ number, title, description }) => (
    <div className="flex gap-6 items-start group">
        <span className="text-4xl font-black text-slate-100 group-hover:text-primary-100 transition-colors leading-none">{number}</span>
        <div>
            <h4 className="font-black text-slate-900 text-lg mb-1">{title}</h4>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">{description}</p>
        </div>
    </div>
);

export default StaffDashboard;
