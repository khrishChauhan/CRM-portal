import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    Search, ChevronLeft, ChevronRight, Loader2, Users, UserCheck, UserX,
    AlertTriangle, Mail, Building2, Calendar, FolderOpen, AlertCircle,
    CheckCircle, Eye, ShieldOff, ShieldCheck, Trash2, X
} from 'lucide-react';

const STATUS_COLORS = {
    active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    inactive: 'bg-gray-50 text-gray-500 border-gray-100',
    suspended: 'bg-red-50 text-red-600 border-red-100',
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

    useEffect(() => {
        if (selectedClient) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedClient]);

    return (
        <div className="space-y-10 animate-reveal">
            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed top-8 right-8 z-[150] flex items-center gap-4 px-6 py-4 rounded-[20px] shadow-2xl bg-white border border-gray-100 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-right-10 duration-500 ${toast.type === 'error' ? 'text-red-500' : 'text-blue-600'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${toast.type === 'error' ? 'bg-red-50' : 'bg-blue-50'}`}>
                        {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </div>
                    {toast.message}
                </div>
            )}

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1A1A1A] tracking-tight leading-none">Client Registry</h1>
                    <p className="text-gray-500 mt-2 font-medium text-base leading-relaxed">System-wide client management and project access control.</p>
                </div>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
                <StatCard icon={Users} label="Total Assets" value={stats.total} color="blue" />
                <StatCard icon={UserCheck} label="Operational" value={stats.active} color="emerald" />
                <StatCard icon={UserX} label="Deactivated" value={stats.inactive} color="gray" />
                <StatCard icon={AlertTriangle} label="Suspended" value={stats.suspended} color="red" />
            </div>

            {/* ── Filters Bar ── */}
            <div className="bg-[#2E2E2E] p-2 rounded-[24px] shadow-xl flex flex-col md:flex-row gap-2 mt-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email or company..."
                        className="w-full bg-transparent pl-14 pr-6 py-4.5 text-white placeholder-gray-600 focus:outline-none transition-all text-sm font-medium"
                    />
                </div>
                <div className="px-2 pb-2 md:p-0">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full md:w-auto px-6 py-4 bg-white/5 border border-white/5 rounded-[18px] text-[10px] font-bold uppercase tracking-widest text-gray-400 focus:outline-none focus:bg-white/10 transition-all cursor-pointer"
                    >
                        <option value="" className="bg-[#2E2E2E]">All Status</option>
                        <option value="active" className="bg-[#2E2E2E]">Active Assets</option>
                        <option value="inactive" className="bg-[#2E2E2E]">Inactive Assets</option>
                        <option value="suspended" className="bg-[#2E2E2E]">Suspended Assets</option>
                    </select>
                </div>
            </div>

            {/* ── Client Table ── */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden min-h-[500px] mt-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Initialising Database...</p>
                    </div>
                ) : clients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 text-gray-400">
                        <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 opacity-20" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-[#1A1A1A] opacity-30 tracking-tight">No Clients Registered</h3>
                        <p className="text-sm mt-2 font-medium italic">Try adjusting your filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="text-left px-10 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client Identity</th>
                                    <th className="text-left px-8 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Affiliation</th>
                                    <th className="text-left px-8 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Status</th>
                                    <th className="text-left px-8 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Authorisations</th>
                                    <th className="text-left px-8 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Onboarding</th>
                                    <th className="text-right px-10 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Commands</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {clients.map((c) => (
                                    <tr key={c._id} className="group hover:bg-gray-50 transition-colors duration-300">
                                        <td className="px-10 py-7">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100/50 text-blue-600 flex items-center justify-center font-display font-bold text-sm group-hover:scale-110 transition-transform">
                                                    {c.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#1A1A1A] group-hover:text-blue-600 transition-colors text-base tracking-tight">{c.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7 font-bold text-gray-600 text-[13px]">{c.company || '—'}</td>
                                        <td className="px-8 py-7">
                                            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${STATUS_COLORS[c.clientStatus] || 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${c.clientStatus === 'active' ? 'bg-current animate-pulse' : 'bg-current'}`}></div>
                                                {c.clientStatus || 'active'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-7">
                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-widest group-hover:text-blue-600 transition-colors">
                                                <FolderOpen className="w-3.5 h-3.5" />
                                                {c.projectCount} Projects
                                            </span>
                                        </td>
                                        <td className="px-8 py-7 text-gray-400 text-[10px] font-bold uppercase tracking-widest">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                                        <td className="px-10 py-7">
                                            <div className="flex items-center justify-end gap-3">
                                                <button onClick={() => viewClient(c._id)} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="View">
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                {c.clientStatus !== 'active' && (
                                                    <button onClick={() => handleStatusChange(c._id, 'active')} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Activate">
                                                        <ShieldCheck className="w-5 h-5" />
                                                    </button>
                                                )}
                                                {c.clientStatus === 'active' && (
                                                    <button onClick={() => handleStatusChange(c._id, 'suspended')} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all" title="Suspend">
                                                        <ShieldOff className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(c._id, c.name)} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
                                                    <Trash2 className="w-5 h-5" />
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
                    <div className="flex items-center justify-between px-10 py-8 border-t border-gray-50 bg-gray-50/30">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Page {pagination.page} <span className="text-gray-200 mx-2">/</span> {pagination.totalPages}
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchClients(pagination.page - 1)}
                                disabled={!pagination.hasPrev}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-blue-600 transition-all shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => fetchClients(pagination.page + 1)}
                                disabled={!pagination.hasNext}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-blue-600 transition-all shadow-sm"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Client Detail Modal ── */}
            {selectedClient && (
                <div className="fixed inset-0 z-[150] flex justify-center items-start p-4">
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity" onClick={() => setSelectedClient(null)}></div>
                    <div className="bg-white w-[94%] max-w-[460px] h-auto max-h-[92vh] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col relative z-[160] animate-in slide-in-from-top-4 duration-300 overflow-hidden">
                        <div className="flex items-center justify-between p-[22px] pb-3 bg-white shrink-0">
                            <h2 className="text-[20px] font-bold text-[#2C3E50] tracking-tight">{selectedClient.name}</h2>
                            <button onClick={() => setSelectedClient(null)} className="p-1.5 text-gray-400 hover:text-red-500 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto scrollbar-hide px-[22px] pt-1 pb-8">
                            <div className="space-y-4">
                                <InfoRow icon={Mail} label="Contact Email" value={selectedClient.email} />
                                <InfoRow icon={Building2} label="Company Name" value={selectedClient.company || '—'} />
                                <InfoRow icon={ShieldCheck} label="Account Status" value={selectedClient.clientStatus.charAt(0).toUpperCase() + selectedClient.clientStatus.slice(1)} />
                                <InfoRow icon={Calendar} label="Date Joined" value={new Date(selectedClient.createdAt).toLocaleDateString()} />
                            </div>

                            {selectedClient.approvedProjects?.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-sm font-bold text-[#34495E] mb-4 flex items-center gap-2">
                                        Approved Projects ({selectedClient.approvedProjects.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedClient.approvedProjects.map(p => (
                                            <div key={p._id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-[20px] group transition-all">
                                                <div>
                                                    <p className="font-bold text-[#1A1A1A] text-sm">{p.projectName}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">{p.projectCode}</p>
                                                </div>
                                                <span className="shrink-0 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl uppercase tracking-widest">{p.projectStatus}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-7 bg-white border-t border-gray-50 flex-shrink-0">
                            <button onClick={() => setSelectedClient(null)} className="w-full py-4.5 blue-gradient text-white font-bold rounded-[16px] shadow-lg shadow-blue-200 hover:scale-[1.01] active:scale-95 transition-all">
                                Close Viewer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        gray: 'bg-gray-50 text-gray-500 border-gray-100',
    };
    return (
        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-xl group flex flex-col gap-6 hover:border-blue-500/20 transition-all duration-500">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${colors[color]} group-hover:scale-110 transition-transform duration-500`}>
                <Icon className="w-7 h-7" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl md:text-4xl font-display font-bold text-[#1A1A1A] tracking-tighter leading-none">{value}</p>
            </div>
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-5 py-4 px-4 bg-gray-50 border border-gray-100 rounded-2xl group transition-all">
        <div className="w-11 h-11 rounded-[14px] bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-all duration-300 shadow-sm">
            <Icon className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
            <span className="text-[13px] font-bold text-[#7F8C8D]">{label}</span>
            <span className="font-bold text-[#2C3E50] text-[15px] mt-0.5 tracking-tight">{value}</span>
        </div>
    </div>
);

export default ManageClients;
