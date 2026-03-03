import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    Search, ChevronLeft, ChevronRight, Loader2, Users,
    CheckCircle, XCircle, Clock, Send, MessageSquare, Briefcase, FileText, Filter, MoreHorizontal, AlertCircle
} from 'lucide-react';

const STATUS_COLORS = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-600',
};

const ManageAccessRequests = () => {
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [toast, setToast] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchRequests = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 10 });
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);
            const { data } = await api.get(`/access-requests?${params}`);
            setRequests(data.data.requests);
            setStats(data.data.stats);
            setPagination(data.data.pagination);
        } catch (err) {
            showToast('Failed to fetch requests', 'error');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        const t = setTimeout(() => fetchRequests(1), 400);
        return () => clearTimeout(t);
    }, [search, statusFilter, fetchRequests]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this access request? The client will get full access to the project.')) return;
        setProcessingId(id);
        try {
            await api.patch(`/access-requests/${id}/approve`);
            showToast('Request approved successfully');
            fetchRequests(pagination.page);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to approve', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        if (!rejectionReason.trim()) {
            showToast('Please provide a reason for rejection', 'error');
            return;
        }
        setProcessingId(id);
        try {
            await api.patch(`/access-requests/${id}/reject`, { reason: rejectionReason });
            showToast('Request rejected');
            setRejectingId(null);
            setRejectionReason('');
            fetchRequests(pagination.page);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to reject', 'error');
        } finally {
            setProcessingId(null);
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

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Access Requests</h1>
                    <p className="text-slate-500 mt-1">Manage client project access requests</p>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Requests" value={stats.total} icon={FileText} color="blue" />
                <StatCard label="Pending" value={stats.pending} icon={Clock} color="amber" />
                <StatCard label="Approved" value={stats.approved} icon={CheckCircle} color="emerald" />
                <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="red" />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client or project..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <FileText className="w-16 h-16 mb-4 text-slate-200" />
                        <p className="text-lg font-medium">No requests found</p>
                    </div>
                ) : (
                    requests.map(req => (
                        <div key={req._id} className="p-6 hover:bg-slate-50/50 transition-colors">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center justify-between lg:justify-start gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[req.status]}`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400">Requested {new Date(req.createdAt).toLocaleDateString()}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                <Briefcase className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase font-bold tracking-tight mb-0.5">Project</p>
                                                <h3 className="font-bold text-slate-900 leading-tight">{req.project?.projectName}</h3>
                                                <p className="text-sm font-medium text-primary-600">{req.project?.projectCode}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase font-bold tracking-tight mb-0.5">Client</p>
                                                <h3 className="font-bold text-slate-900 leading-tight">{req.client?.name}</h3>
                                                <p className="text-sm text-slate-600">{req.client?.email}</p>
                                                {req.client?.company && <p className="text-xs text-slate-400 mt-0.5">{req.client.company}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {req.message && (
                                        <div className="flex gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-slate-600 leading-relaxed italic">"{req.message}"</p>
                                        </div>
                                    )}

                                    {req.status === 'rejected' && req.rejectionReason && (
                                        <div className="flex gap-3 p-4 bg-red-50/50 rounded-xl border border-red-100">
                                            <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-red-700 uppercase mb-1">Rejection Reason</p>
                                                <p className="text-sm text-red-600 leading-relaxed">{req.rejectionReason}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {req.status === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => handleApprove(req._id)}
                                                disabled={processingId === req._id}
                                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                                            >
                                                {processingId === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => { setRejectingId(req._id); setRejectionReason(''); }}
                                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl transition"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">Reviewed on</p>
                                            <p className="text-sm font-medium text-slate-700">{req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : '—'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Rejection UI */}
                            {rejectingId === req._id && (
                                <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-slate-900">Provide Rejection Reason</h4>
                                        <button onClick={() => setRejectingId(null)} className="text-slate-400 hover:text-slate-600 font-medium text-xs">Cancel</button>
                                    </div>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Explain why this request is being rejected..."
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none h-24 resize-none"
                                    />
                                    <button
                                        onClick={() => handleReject(req._id)}
                                        disabled={processingId === req._id}
                                        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition disabled:opacity-50"
                                    >
                                        Confirm Rejection
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}

                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50">
                        <p className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages}</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => fetchRequests(pagination.page - 1)} disabled={!pagination.hasPrev} className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition"><ChevronLeft className="w-4 h-4" /></button>
                            <button onClick={() => fetchRequests(pagination.page + 1)} disabled={!pagination.hasNext} className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, color }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        red: 'bg-red-50 text-red-600 border-red-100',
    };

    return (
        <div className={`bg-white p-5 rounded-2xl border ${colors[color]} shadow-sm`}>
            <div className="flex flex-col gap-4">
                <div className={`w-10 h-10 rounded-xl ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">{label}</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
                </div>
            </div>
        </div>
    );
};

export default ManageAccessRequests;
