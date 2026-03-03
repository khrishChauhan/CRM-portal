import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    Search, ChevronLeft, ChevronRight, Loader2, Users, UserCheck, UserX,
    AlertTriangle, Mail, Building2, Calendar, FolderOpen, AlertCircle,
    CheckCircle, Eye, ShieldOff, ShieldCheck, Trash2
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
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            <div>
                <h1 className="text-3xl font-bold text-slate-900">Manage Clients</h1>
                <p className="text-slate-500 mt-1">View and manage client accounts</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total" value={stats.total} color="blue" />
                <StatCard icon={UserCheck} label="Active" value={stats.active} color="green" />
                <StatCard icon={UserX} label="Inactive" value={stats.inactive} color="slate" />
                <StatCard icon={AlertTriangle} label="Suspended" value={stats.suspended} color="red" />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or company..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
                ) : clients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Users className="w-16 h-16 mb-4 text-slate-200" />
                        <p className="text-lg font-medium">No clients found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="text-left px-6 py-4 font-semibold text-slate-600">Client</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-600">Company</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-600">Status</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-600">Projects</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-600">Joined</th>
                                    <th className="text-right px-6 py-4 font-semibold text-slate-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {clients.map(c => (
                                    <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">{c.name?.charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{c.name}</p>
                                                    <p className="text-xs text-slate-400">{c.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{c.company || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[c.clientStatus] || STATUS_COLORS.active}`}>
                                                {c.clientStatus || 'active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4"><span className="inline-flex items-center gap-1 text-slate-600"><FolderOpen className="w-3.5 h-3.5" /> {c.projectCount}</span></td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => viewClient(c._id)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600 transition" title="View"><Eye className="w-4 h-4" /></button>
                                                {c.clientStatus !== 'active' && (
                                                    <button onClick={() => handleStatusChange(c._id, 'active')} className="p-2 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition" title="Activate"><ShieldCheck className="w-4 h-4" /></button>
                                                )}
                                                {c.clientStatus === 'active' && (
                                                    <button onClick={() => handleStatusChange(c._id, 'suspended')} className="p-2 rounded-lg hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition" title="Suspend"><ShieldOff className="w-4 h-4" /></button>
                                                )}
                                                <button onClick={() => handleDelete(c._id, c.name)} className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition" title="Deactivate"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-sm text-slate-500">Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => fetchClients(pagination.page - 1)} disabled={!pagination.hasPrev} className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-sm font-medium text-slate-600 px-2">{pagination.page} / {pagination.totalPages}</span>
                            <button onClick={() => fetchClients(pagination.page + 1)} disabled={!pagination.hasNext} className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Client Detail Modal */}
            {selectedClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">{selectedClient.name}</h2>
                            <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">Close</button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <InfoRow icon={Mail} label="Email" value={selectedClient.email} />
                            <InfoRow icon={Building2} label="Company" value={selectedClient.company || '—'} />
                            <InfoRow icon={ShieldCheck} label="Status" value={selectedClient.clientStatus} />
                            <InfoRow icon={Calendar} label="Joined" value={new Date(selectedClient.createdAt).toLocaleDateString()} />
                            <InfoRow icon={Calendar} label="Last Login" value={selectedClient.lastLogin ? new Date(selectedClient.lastLogin).toLocaleString() : 'Never'} />
                        </div>
                        {selectedClient.approvedProjects?.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-bold text-slate-700 mb-3">Approved Projects ({selectedClient.approvedProjects.length})</h3>
                                <div className="space-y-2">
                                    {selectedClient.approvedProjects.map(p => (
                                        <div key={p._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <div>
                                                <p className="font-medium text-slate-800 text-sm">{p.projectName}</p>
                                                <p className="text-xs text-slate-400">{p.projectCode}</p>
                                            </div>
                                            <span className="text-xs font-medium text-slate-500">{p.projectStatus}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = { blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', red: 'bg-red-50 text-red-600', slate: 'bg-slate-100 text-slate-600' };
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${colors[color]}`}><Icon className="w-6 h-6" /></div>
            <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 py-2 border-b border-slate-50">
        <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className="text-slate-500 w-24">{label}</span>
        <span className="font-medium text-slate-800">{value}</span>
    </div>
);

export default ManageClients;
