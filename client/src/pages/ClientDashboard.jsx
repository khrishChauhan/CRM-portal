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
        <div className="space-y-8 animate-in fade-in duration-500">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Client Dashboard</h1>
                <p className="text-slate-500 mt-1">Real-time status of your project access and availability</p>
            </div>

            {/* Aggregated Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard
                    label="Approved Projects"
                    value={stats?.totalApprovedProjects || 0}
                    icon={CheckCircle}
                    color="emerald"
                />
                <StatCard
                    label="Pending Requests"
                    value={stats?.totalPendingRequests || 0}
                    icon={Clock}
                    color="amber"
                />
                <StatCard
                    label="Rejected Requests"
                    value={stats?.totalRejectedRequests || 0}
                    icon={XCircle}
                    color="red"
                />
            </div>

            {/* Browse & Request Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Available Projects</h2>
                    <p className="text-sm text-slate-400 font-medium">{pagination.total} total projects found</p>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
                    <div className="relative flex-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="w-full pl-11 pr-4 py-3 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-3 border border-slate-100 rounded-2xl text-sm bg-slate-50 font-medium outline-none">
                        <option value="">All Status</option>
                        <option value="Planned">Planned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="On Hold">On Hold</option>
                    </select>
                    <div className="relative flex-1">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={locationFilter} onChange={e => setLocationFilter(e.target.value)} placeholder="Location..." className="w-full pl-11 pr-4 py-3 border border-slate-100 rounded-2xl text-sm outline-none" />
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary-500" /></div>
                    ) : projects.length === 0 ? (
                        <div className="py-20 flex flex-col items-center text-slate-300">
                            <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-bold">No projects available for request</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {projects.map(p => {
                                const req = requestMap[p._id];
                                const reqStatus = req?.status;
                                return (
                                    <div key={p._id} className="p-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{p.projectName}</h3>
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${PROJECT_STATUS_COLORS[p.projectStatus]}`}>
                                                        {p.projectStatus}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-400">
                                                    <span className="text-primary-600">#{p.projectCode}</span>
                                                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {p.siteAddress || 'N/A'}</span>
                                                    <span>{p.projectCategory}</span>
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0">
                                                {reqStatus === 'approved' ? (
                                                    <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-bold ring-1 ring-emerald-100">
                                                        <CheckCircle className="w-4 h-4" /> Access Granted
                                                    </div>
                                                ) : reqStatus === 'pending' ? (
                                                    <div className="flex items-center gap-2 px-6 py-3 bg-amber-50 text-amber-700 rounded-2xl text-sm font-bold ring-1 ring-amber-100">
                                                        <Clock className="w-4 h-4" /> Final Review
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setRequestModal(p)}
                                                        className="flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-sm font-black transition shadow-lg shadow-primary-200"
                                                    >
                                                        <Send className="w-4 h-4 text-white/70" />
                                                        {reqStatus === 'rejected' ? 'Re-Request Access' : 'Apply for Access'}
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
                        <div className="px-8 py-5 flex items-center justify-between bg-slate-50/50 border-t border-slate-100">
                            <p className="text-sm font-bold text-slate-400">Page {pagination.page} of {pagination.totalPages}</p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => fetchBrowseProjects(pagination.page - 1)} disabled={!pagination.hasPrev} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-white disabled:opacity-40 transition shadow-sm"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                                <button onClick={() => fetchBrowseProjects(pagination.page + 1)} disabled={!pagination.hasNext} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-white disabled:opacity-40 transition shadow-sm"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Request Modal */}
            {requestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-primary-50 text-primary-600 flex items-center justify-center rounded-3xl mx-auto mb-6">
                                    <Send className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">Project Access</h3>
                                <p className="text-slate-500 font-medium mt-1">Requesting access for {requestModal.projectName}</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Your Message (Optional)</label>
                                    <textarea
                                        value={requestMessage}
                                        onChange={(e) => setRequestMessage(e.target.value)}
                                        placeholder="Add context to your request..."
                                        className="w-full p-5 border border-slate-200 rounded-3xl text-sm focus:ring-4 focus:ring-primary-100 outline-none h-36 resize-none transition-all placeholder:text-slate-300 font-medium"
                                    />
                                </div>

                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={handleRequestAccess}
                                        disabled={requesting}
                                        className="w-full py-4.5 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-3xl transition shadow-xl shadow-primary-200 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        Send Request
                                    </button>
                                    <button
                                        onClick={() => { setRequestModal(null); setRequestMessage(''); }}
                                        className="text-slate-400 font-black text-sm uppercase tracking-widest hover:text-slate-600 transition"
                                    >
                                        Dismiss
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

const StatCard = ({ label, value, icon: Icon, color }) => {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        red: 'bg-red-50 text-red-600 border-red-100',
    };
    return (
        <div className={`bg-white p-8 rounded-[2.5rem] border ${colors[color]} shadow-sm`}>
            <div className="flex flex-col gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors[color].split(' ')[0]}`}>
                    <Icon className="w-7 h-7" />
                </div>
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="text-4xl font-black text-slate-900 mt-2">{value}</p>
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
