import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    Search, ChevronLeft, ChevronRight, Loader2, Users, UserCheck, UserX,
    AlertTriangle, Mail, Building2, Calendar, FolderOpen, AlertCircle,
    CheckCircle, Eye, ShieldOff, ShieldCheck, Trash2, X
} from 'lucide-react';

const STATUS_COLORS = {
    active: 'bg-emerald-50 text-emerald-700',
    inactive: 'bg-slate-100 text-slate-600',
    suspended: 'bg-red-50 text-red-600',
};

const ManageClients = () => {
    const [clients, setClients] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, suspended: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [toast, setToast] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);

    const fetchClients = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 10 });
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);
            const { data } = await api.get(`/clients?${params}`);
            setClients(data.data.clients);
            setPagination(data.data.pagination);
        } catch (err) {
            showToast('Failed to fetch clients', 'error');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const { data } = await api.get('/clients/stats');
            setStats(data.data);
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => {
        const t = setTimeout(() => fetchClients(1), 400);
        return () => clearTimeout(t);
    }, [search, statusFilter, fetchClients]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleStatusChange = async (id, status) => {
        try {
            const { data } = await api.patch(`/clients/${id}/status`, { status });
            showToast(data.message);
            fetchClients(pagination.page);
            fetchStats();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed', 'error');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Deactivate and suspend ${name}? They will be removed from all projects.`)) return;
        try {
            await api.delete(`/clients/${id}`);
            showToast('Client deactivated');
            fetchClients(pagination.page);
            fetchStats();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed', 'error');
        }
    };

    const viewClient = async (id) => {
        try {
            const { data } = await api.get(`/clients/${id}`);
            setSelectedClient(data.data);
        } catch (err) {
            showToast('Failed to load client details', 'error');
        }
    };

    return (
        <div className="space-y-10 animate-reveal">
            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed top-8 right-8 z-[100] flex items-center gap-4 px-6 py-4 rounded-3xl shadow-2xl glass-dark border border-white/10 text-sm font-bold uppercase tracking-widest animate-in slide-in-from-right-10 duration-500 ${toast.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    {toast.message}
                </div>
            )}

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white tracking-tight leading-none text-gradient truncate max-w-full">Clients</h1>
                    <p className="text-slate-500 mt-2 sm:mt-3 font-medium text-sm sm:text-lg italic">Manage your clients and their project access.</p>
                </div>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mt-6">
                <StatCard icon={Users} label="Total" value={stats.total} color="indigo" />
                <StatCard icon={UserCheck} label="Active" value={stats.active} color="emerald" />
                <StatCard icon={UserX} label="Inactive" value={stats.inactive} color="slate" />
                <StatCard icon={AlertTriangle} label="Suspended" value={stats.suspended} color="red" />
            </div>

            {/* ── Filters Bar ── */}
            <div className="glass p-2 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 shadow-xl flex flex-col md:flex-row gap-2 mt-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search clients..."
                        className="w-full bg-transparent pl-14 pr-6 py-4.5 text-white placeholder-slate-600 focus:outline-none transition-all text-sm font-medium"
                    />
                </div>
                <div className="px-2 pb-2 md:p-0">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full md:w-auto px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-400 focus:outline-none focus:bg-white/10 hover:border-indigo-500/30 transition-all cursor-pointer"
                    >
                        <option value="" className="bg-slate-900">All Status</option>
                        <option value="active" className="bg-slate-900">Active</option>
                        <option value="inactive" className="bg-slate-900">Inactive</option>
                        <option value="suspended" className="bg-slate-900">Suspended</option>
                    </select>
                </div>
            </div>

            {/* ── Client Table ── */}
            <div className="glass rounded-[2rem] md:rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden min-h-[500px] mt-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">Loading...</p>
                    </div>
                ) : clients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 text-slate-600">
                        <div className="w-20 h-20 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center mb-8 ring-1 ring-white/5">
                            <Users className="w-10 h-10 opacity-40" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-white/50 tracking-tight">No clients found</h3>
                        <p className="text-sm mt-2 font-medium">No clients match your search.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-white/[0.01] border-b border-white/5">
                                    <th className="text-left px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Client</th>
                                    <th className="text-left px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Company</th>
                                    <th className="text-left px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="text-left px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Projects</th>
                                    <th className="text-left px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Joined</th>
                                    <th className="text-right px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {clients.map((c) => (
                                    <tr key={c._id} className="group hover:bg-white/[0.02] transition-colors cursor-default">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-display font-bold text-sm ring-1 ring-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)] group-hover:scale-110 transition-transform">
                                                    {c.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white group-hover:text-indigo-400 transition-colors text-lg tracking-tight">{c.name}</p>
                                                    <p className="text-[11px] font-bold text-slate-500 tracking-wider font-mono opacity-80 uppercase">{c.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 font-medium text-slate-400 text-sm italic">{c.company || '—'}</td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${c.clientStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : c.clientStatus === 'suspended' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${c.clientStatus === 'active' ? 'bg-emerald-50 animate-pulse' : c.clientStatus === 'suspended' ? 'bg-red-500' : 'bg-slate-500'}`}></div>
                                                {c.clientStatus || 'active'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider group-hover:border-slate-500/30 transition-colors">
                                                <FolderOpen className="w-3.5 h-3.5" />
                                                {c.projectCount} Projects
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-slate-500 text-[10px] font-bold uppercase tracking-widest">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center justify-end gap-2 px-1">
                                                <button onClick={() => viewClient(c._id)} className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300" title="View">
                                                    <Eye className="w-4.5 h-4.5" />
                                                </button>
                                                {c.clientStatus !== 'active' && (
                                                    <button onClick={() => handleStatusChange(c._id, 'active')} className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300" title="Activate">
                                                        <ShieldCheck className="w-4.5 h-4.5" />
                                                    </button>
                                                )}
                                                {c.clientStatus === 'active' && (
                                                    <button onClick={() => handleStatusChange(c._id, 'suspended')} className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all duration-300" title="Suspend">
                                                        <ShieldOff className="w-4.5 h-4.5" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(c._id, c.name)} className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300" title="Delete">
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Pagination ── */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-10 py-8 border-t border-white/5 bg-white/[0.01]">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} clients
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchClients(pagination.page - 1)}
                                disabled={!pagination.hasPrev}
                                className="p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-xs font-display font-bold text-white px-4 border-r border-l border-white/5">{pagination.page} <span className="text-slate-600 mx-2">/</span> {pagination.totalPages}</span>
                            <button
                                onClick={() => fetchClients(pagination.page + 1)}
                                disabled={!pagination.hasNext}
                                className="p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Client Detail Modal ── */}
            {selectedClient && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-500" onClick={() => setSelectedClient(null)}></div>
                    <div className="glass-dark border border-white/10 rounded-[3.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col relative z-[120] animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">
                        <div className="px-10 py-10 overflow-y-auto">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h2 className="text-3xl font-display font-bold text-white tracking-tight">{selectedClient.name}</h2>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2 italic">Client Details</p>
                                </div>
                                <button onClick={() => setSelectedClient(null)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-all duration-300">
                                    <X className="w-5 h-5 mx-auto" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <InfoRow icon={Mail} label="Email" value={selectedClient.email} />
                                <InfoRow icon={Building2} label="Company" value={selectedClient.company || '—'} />
                                <InfoRow icon={ShieldCheck} label="Status" value={selectedClient.clientStatus.toUpperCase()} />
                                <InfoRow icon={Calendar} label="Joined" value={new Date(selectedClient.createdAt).toLocaleDateString()} />
                            </div>

                            {selectedClient.approvedProjects?.length > 0 && (
                                <div className="mt-12">
                                    <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mb-6 px-1">Approved Projects ({selectedClient.approvedProjects.length})</h3>
                                    <div className="space-y-3">
                                        {selectedClient.approvedProjects.map(p => (
                                            <div key={p._id} className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-3xl group hover:bg-white/10 transition-all cursor-default">
                                                <div>
                                                    <p className="font-bold text-white group-hover:text-indigo-400 transition-colors text-sm">{p.projectName}</p>
                                                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">{p.projectCode}</p>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 border border-white/5 px-3 py-1 rounded-lg uppercase tracking-widest">{p.projectStatus}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = {
        indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
        slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };
    return (
        <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/5 shadow-2xl group flex flex-col gap-4 md:gap-6 hover:border-indigo-500/30 transition-all duration-500">
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center border ${colors[color]} ring-4 ring-black ring-opacity-10 md:group-hover:scale-110 transition-transform duration-500`}>
                <Icon className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
                <p className="text-3xl md:text-4xl font-display font-bold text-white tracking-tighter">{value}</p>
            </div>
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-6 py-4 border-b border-white/5 group">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
            <Icon className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{label}</span>
            <span className="font-medium text-white text-sm mt-0.5">{value}</span>
        </div>
    </div>
);

export default ManageClients;
