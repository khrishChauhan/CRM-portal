import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    Search, ChevronLeft, ChevronRight, Loader2, FolderOpen,
    AlertCircle, CheckCircle, Clock, XCircle, MapPin, Send, MessageSquare
} from 'lucide-react';

const STATUS_COLORS = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-600',
};

const PROJECT_STATUS_COLORS = {
    Planned: 'bg-blue-50 text-blue-700',
    'In Progress': 'bg-emerald-50 text-emerald-700',
    'On Hold': 'bg-amber-50 text-amber-700',
    Completed: 'bg-green-50 text-green-700',
    Delayed: 'bg-red-50 text-red-700',
    Cancelled: 'bg-slate-100 text-slate-500',
};

const ClientDashboard = () => {
    const [stats, setStats] = useState(null);
    const [myRequests, setMyRequests] = useState([]);
    const [projects, setProjects] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [toast, setToast] = useState(null);
    const [requestModal, setRequestModal] = useState(null);
    const [requestMessage, setRequestMessage] = useState('');
    const [requesting, setRequesting] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const { data } = await api.get('/dashboard/client');
            setStats(data.data);
        } catch (err) { console.error(err); }
    }, []);

    const fetchMyRequests = useCallback(async () => {
        try {
            const { data } = await api.get('/access-requests/my');
            setMyRequests(data.data || []);
        } catch (err) { console.error(err); }
    }, []);

    const fetchBrowseProjects = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 10 });
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);
            if (locationFilter) params.append('location', locationFilter);
            const { data } = await api.get(`/access-requests/projects?${params}`);
            setProjects(data.data.projects);
            setPagination(data.data.pagination);
        } catch (err) {
            showToast('Failed to fetch projects', 'error');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, locationFilter]);

    useEffect(() => {
        fetchStats();
        fetchMyRequests();
    }, [fetchStats, fetchMyRequests]);

    useEffect(() => {
        const t = setTimeout(() => fetchBrowseProjects(1), 400);
        return () => clearTimeout(t);
    }, [search, statusFilter, locationFilter, fetchBrowseProjects]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleRequestAccess = async () => {
        if (!requestModal) return;
        setRequesting(true);
        try {
            await api.post('/access-requests', {
                projectId: requestModal._id,
                message: requestMessage
            });
            showToast('Access request submitted!');
            setRequestModal(null);
            setRequestMessage('');
            fetchStats();
            fetchMyRequests();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to request access', 'error');
        } finally {
            setRequesting(false);
        }
    };

    // Build lookup of projectId → request
    const requestMap = {};
    myRequests.forEach(r => {
        if (r.projectId?._id) requestMap[r.projectId._id] = r;
    });

    return (
        <div className="space-y-10 animate-reveal pb-20">
            {toast && (
                <div className={`fixed top-8 right-8 z-[100] flex items-center gap-4 px-6 py-4 rounded-3xl shadow-2xl glass-dark border border-white/10 text-sm font-bold uppercase tracking-widest animate-in slide-in-from-right-10 duration-500 ${toast.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    {toast.message}
                </div>
            )}

            <div>
                <h1 className="text-5xl font-display font-bold text-white tracking-tight leading-none text-gradient">Client Portal</h1>
                <p className="text-slate-500 mt-3 font-medium text-lg italic">Strategic access and mission availability overview.</p>
            </div>

            {/* Aggregated Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard
                    label="Authorized Units"
                    value={stats?.totalApprovedProjects || 0}
                    icon={CheckCircle}
                    color="sky"
                    bgColor="bg-sky-500/10"
                />
                <StatCard
                    label="Pending Sync"
                    value={stats?.totalPendingRequests || 0}
                    icon={Clock}
                    color="amber"
                    bgColor="bg-amber-500/10"
                />
                <StatCard
                    label="Access Revoked"
                    value={stats?.totalRejectedRequests || 0}
                    icon={XCircle}
                    color="red"
                    bgColor="bg-red-500/10"
                />
            </div>

            {/* Browse & Request Section */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Deployment Grid</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] italic font-mono">{pagination.total} Logged Assets</p>
                </div>

                <div className="glass p-2 rounded-[2.5rem] border border-white/5 shadow-xl flex flex-col lg:flex-row gap-2">
                    <div className="relative flex-[2] group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Query deployments by designation..."
                            className="w-full bg-transparent pl-14 pr-6 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium"
                        />
                    </div>
                    <div className="flex flex-1 gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex-1 px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 focus:outline-none hover:border-indigo-500/30 transition-all cursor-pointer"
                        >
                            <option value="" className="bg-slate-900">All Status</option>
                            <option value="Planned" className="bg-slate-900">PLANNED</option>
                            <option value="In Progress" className="bg-slate-900">IN PROGRESS</option>
                            <option value="On Hold" className="bg-slate-900">ON HOLD</option>
                        </select>
                        <div className="relative flex-1 group">
                            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                placeholder="Grid..."
                                className="w-full bg-transparent pl-14 pr-6 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="glass rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40">
                            <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">Querying Asset Database...</p>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-40 text-slate-600">
                            <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 ring-1 ring-white/10 shadow-inner">
                                <FolderOpen className="w-10 h-10 opacity-30" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-white/50 tracking-tight">Zero Grid Matches</h3>
                            <p className="text-sm mt-3 font-medium">No available deployments matching current parameters.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {projects.map(p => {
                                const req = requestMap[p._id];
                                const reqStatus = req?.status;
                                return (
                                    <div key={p._id} className="p-10 group hover:bg-white/[0.02] transition-all duration-500">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center gap-5">
                                                    <h3 className="font-display font-bold text-white text-2xl tracking-tight group-hover:text-indigo-400 transition-colors leading-none">{p.projectName}</h3>
                                                    <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest ${PROJECT_STATUS_COLORS[p.projectStatus]?.replace('bg-', 'bg-transparent border border-').replace('text-', 'text-') || 'border-slate-500/20 text-slate-400'}`}>
                                                        {p.projectStatus}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                                    <span className="text-indigo-400 font-mono tracking-tighter self-center">ID // {p.projectCode}</span>
                                                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500/50" /> {p.siteAddress || 'UNSPECIFIED GRID'}</span>
                                                    <span className="flex items-center gap-2 italic">{p.projectCategory || 'GENERAL_INITIATIVE'}</span>
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 flex items-center">
                                                {reqStatus === 'approved' ? (
                                                    <div className="px-8 py-5 glass-dark border border-emerald-500/30 text-emerald-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 shadow-[0_0_20px_rgba(52,211,153,0.1)] transition-all group-hover:scale-105">
                                                        <CheckCircle className="w-4 h-4" /> Protocol Authorized
                                                    </div>
                                                ) : reqStatus === 'pending' ? (
                                                    <div className="px-8 py-5 glass-dark border border-amber-500/30 text-amber-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 shadow-[0_0_20px_rgba(251,191,36,0.1)] transition-all group-hover:scale-105">
                                                        <Clock className="w-4 h-4" /> Pending Override
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setRequestModal(p)}
                                                        className="group relative px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(79,70,229,0.25)] hover:scale-105 active:scale-95 flex items-center gap-3"
                                                    >
                                                        <Send className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                                                        {reqStatus === 'rejected' ? 'Re-Query Access' : 'Apply for Access'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {pagination.totalPages > 1 && (
                        <div className="px-10 py-10 flex items-center justify-between bg-white/[0.01] border-t border-white/5">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Deployment Page {pagination.page} // {pagination.totalPages}</p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => fetchBrowseProjects(pagination.page - 1)}
                                    disabled={!pagination.hasPrev}
                                    className="p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-10 transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => fetchBrowseProjects(pagination.page + 1)}
                                    disabled={!pagination.hasNext}
                                    className="p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-10 transition-all"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Request Modal */}
            {requestModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-500" onClick={() => { setRequestModal(null); setRequestMessage(''); }}></div>
                    <div className="glass-dark border border-white/10 rounded-[3.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] w-full max-w-md relative z-[120] animate-in zoom-in-95 slide-in-from-bottom-10 duration-700 overflow-hidden">
                        <div className="p-12">
                            <div className="text-center mb-10">
                                <div className="w-24 h-24 glass border border-indigo-500/30 text-indigo-400 flex items-center justify-center rounded-[2.5rem] mx-auto mb-8 shadow-[0_0_50px_rgba(79,70,229,0.1)] ring-1 ring-white/10">
                                    <Send className="w-10 h-10" />
                                </div>
                                <h3 className="text-3xl font-display font-bold text-white tracking-tight">Access Protocol</h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 italic font-mono">INITIATING REQUEST FOR: {requestModal.projectName.toUpperCase()}</p>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4 text-center">Authentication Context (Optional)</label>
                                    <textarea
                                        value={requestMessage}
                                        onChange={(e) => setRequestMessage(e.target.value)}
                                        placeholder="OUTLINE THE PURPOSE OF ACCESS REQUIREMENT..."
                                        className="w-full p-8 bg-white/5 border border-white/10 rounded-[2.5rem] text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 h-40 resize-none transition-all placeholder:text-slate-800 font-medium font-mono"
                                    />
                                </div>

                                <div className="flex flex-col gap-5 pt-4">
                                    <button
                                        onClick={handleRequestAccess}
                                        disabled={requesting}
                                        className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-[0.3em] rounded-3xl transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)] flex items-center justify-center gap-4 disabled:opacity-30"
                                    >
                                        {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        Initialize Protocol
                                    </button>
                                    <button
                                        onClick={() => { setRequestModal(null); setRequestMessage(''); }}
                                        className="text-slate-600 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors duration-300"
                                    >
                                        Abort Request
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, color, bgColor }) => {
    const colors = {
        sky: 'text-sky-400 group-hover:text-sky-300',
        amber: 'text-amber-400 group-hover:text-amber-300',
        red: 'text-red-400 group-hover:text-red-300',
    };
    return (
        <div className="glass p-8 rounded-[3rem] border border-white/5 shadow-xl group hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 ${bgColor} blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
            <div className="flex flex-col gap-8 relative z-10">
                <div className={`w-16 h-16 rounded-[1.5rem] ${bgColor} border border-white/5 flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
                    <Icon className={`w-8 h-8 ${colors[color]}`} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest group-hover:text-slate-400 transition-colors">{label}</p>
                    <p className="text-5xl font-display font-bold text-white mt-3 tracking-tighter">{value}</p>
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
