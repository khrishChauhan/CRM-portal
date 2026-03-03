import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    Search, ChevronLeft, ChevronRight, Loader2, FolderOpen,
    AlertCircle, CheckCircle, Clock, XCircle, MapPin, Send
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
    const [myRequests, setMyRequests] = useState([]);
    const [projects, setProjects] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [toast, setToast] = useState(null);
    const [requesting, setRequesting] = useState(null);

    const fetchMyRequests = useCallback(async () => {
        try {
            const { data } = await api.get('/access-requests/my');
            setMyRequests(data.data || []);
        } catch (err) { console.error(err); }
    }, []);

    const fetchProjects = useCallback(async (page = 1) => {
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

    useEffect(() => { fetchMyRequests(); }, [fetchMyRequests]);
    useEffect(() => {
        const t = setTimeout(() => fetchProjects(1), 400);
        return () => clearTimeout(t);
    }, [search, statusFilter, locationFilter, fetchProjects]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const requestAccess = async (projectId) => {
        setRequesting(projectId);
        try {
            await api.post('/access-requests', { projectId });
            showToast('Access request submitted!');
            fetchMyRequests();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to request access', 'error');
        } finally {
            setRequesting(null);
        }
    };

    // Build a lookup of projectId → request status
    const requestMap = {};
    myRequests.forEach(r => {
        if (r.projectId?._id) requestMap[r.projectId._id] = r.status;
    });

    const pendingCount = myRequests.filter(r => r.status === 'pending').length;
    const approvedCount = myRequests.filter(r => r.status === 'approved').length;

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            <div>
                <h1 className="text-3xl font-bold text-slate-900">My Dashboard</h1>
                <p className="text-slate-500 mt-1">Browse projects and request access</p>
            </div>

            {/* Access Request Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><Clock className="w-6 h-6" /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Pending Requests</p>
                        <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle className="w-6 h-6" /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Approved Projects</p>
                        <p className="text-2xl font-bold text-slate-900">{approvedCount}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><FolderOpen className="w-6 h-6" /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Requests</p>
                        <p className="text-2xl font-bold text-slate-900">{myRequests.length}</p>
                    </div>
                </div>
            </div>

            {/* My Access Requests */}
            {myRequests.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">My Access Requests</h2>
                    <div className="space-y-3">
                        {myRequests.map(r => (
                            <div key={r._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">{r.projectId?.projectName || 'Unknown'}</p>
                                    <p className="text-xs text-slate-400">{r.projectId?.projectCode} · Requested {new Date(r.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status]}`}>
                                        {r.status === 'pending' && <Clock className="w-3 h-3" />}
                                        {r.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                                        {r.status === 'rejected' && <XCircle className="w-3 h-3" />}
                                        {r.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Browse All Projects */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">All Available Projects</h2>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white">
                        <option value="">All Status</option>
                        <option value="Planned">Planned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                    </select>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={locationFilter} onChange={e => setLocationFilter(e.target.value)} placeholder="Filter by location..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
                    ) : projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <FolderOpen className="w-12 h-12 mb-3 text-slate-200" />
                            <p className="font-medium">No projects found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {projects.map(p => {
                                const reqStatus = requestMap[p._id];
                                return (
                                    <div key={p._id} className="p-5 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-slate-800">{p.projectName}</h3>
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${PROJECT_STATUS_COLORS[p.projectStatus]}`}>{p.projectStatus}</span>
                                                </div>
                                                <p className="text-xs text-slate-400">{p.projectCode} · {p.projectCategory || 'Uncategorized'}</p>
                                                {p.siteAddress && (
                                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{p.siteAddress}</p>
                                                )}
                                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                    {p.startDate && <span>Start: {new Date(p.startDate).toLocaleDateString()}</span>}
                                                    {p.expectedCompletion && <span>Due: {new Date(p.expectedCompletion).toLocaleDateString()}</span>}
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0">
                                                {reqStatus === 'approved' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold">
                                                        <CheckCircle className="w-4 h-4" /> Approved
                                                    </span>
                                                ) : reqStatus === 'pending' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-semibold">
                                                        <Clock className="w-4 h-4" /> Pending
                                                    </span>
                                                ) : reqStatus === 'rejected' ? (
                                                    <button onClick={() => requestAccess(p._id)} disabled={requesting === p._id}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-semibold transition disabled:opacity-50">
                                                        {requesting === p._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                        Re-Request Access
                                                    </button>
                                                ) : (
                                                    <button onClick={() => requestAccess(p._id)} disabled={requesting === p._id}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50">
                                                        {requesting === p._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                        Request Access
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
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                            <p className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages}</p>
                            <div className="flex items-center gap-2">
                                <button onClick={() => fetchProjects(pagination.page - 1)} disabled={!pagination.hasPrev} className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={() => fetchProjects(pagination.page + 1)} disabled={!pagination.hasNext} className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
