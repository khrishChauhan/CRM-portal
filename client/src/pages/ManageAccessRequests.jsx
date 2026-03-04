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
        <div className="space-y-10 animate-reveal pb-20">
            {toast && (
                <div className={`fixed top-8 right-8 z-[100] flex items-center gap-4 px-6 py-4 rounded-3xl shadow-2xl glass-dark border border-white/10 text-sm font-bold uppercase tracking-widest animate-in slide-in-from-right-10 duration-500 ${toast.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    {toast.message}
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-display font-bold text-white tracking-tight leading-none text-gradient">Access Oversight</h1>
                    <p className="text-slate-500 mt-3 font-medium text-lg italic">Administrative authorization and security clearance logs.</p>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Queue" value={stats.total} icon={FileText} color="text-indigo-400" bgColor="bg-indigo-500/10" />
                <StatCard label="Awaiting Sync" value={stats.pending} icon={Clock} color="text-amber-400" bgColor="bg-amber-500/10" />
                <StatCard label="Authorized" value={stats.approved} icon={CheckCircle} color="text-emerald-400" bgColor="bg-emerald-500/10" />
                <StatCard label="Restricted" value={stats.rejected} icon={XCircle} color="text-red-400" bgColor="bg-red-500/10" />
            </div>

            {/* Filters */}
            <div className="glass p-2 rounded-[2rem] border border-white/5 shadow-xl flex flex-col md:flex-row gap-2">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by operative or project code..."
                        className="w-full bg-transparent pl-14 pr-6 py-4.5 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 focus:outline-none focus:bg-white/10 hover:border-indigo-500/30 transition-all cursor-pointer"
                >
                    <option value="" className="bg-slate-900">All Status</option>
                    <option value="pending" className="bg-slate-900">PENDING</option>
                    <option value="approved" className="bg-slate-900">APPROVED</option>
                    <option value="rejected" className="bg-slate-900">REJECTED</option>
                </select>
            </div>

            {/* Requests List */}
            <div className="glass rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden min-h-[500px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">Querying Clearance Logs...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 text-slate-600">
                        <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 ring-1 ring-white/10 shadow-inner">
                            <FileText className="w-10 h-10 opacity-30" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-white/50 tracking-tight">Clearance Empty</h3>
                        <p className="text-sm mt-3 font-medium">No pending authorization requests in current buffer.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {requests.map(req => (
                            <div key={req._id} className="p-10 group hover:bg-white/[0.02] transition-all duration-500">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-10">
                                    <div className="space-y-8 flex-1">
                                        <div className="flex items-center gap-6">
                                            <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest ${STATUS_COLORS[req.status]?.replace('bg-', 'bg-transparent border border-').replace('text-', 'text-') || 'border-slate-500/20 text-slate-400'}`}>
                                                {req.status}
                                            </span>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] italic font-mono flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5" />
                                                Logged {new Date(req.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="flex gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                    <Briefcase className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Asset Target</p>
                                                    <h3 className="font-display font-bold text-white text-xl tracking-tight leading-tight group-hover:text-indigo-400 transition-colors uppercase">{req.project?.projectName}</h3>
                                                    <p className="text-xs font-mono font-bold text-indigo-500/70 mt-1 uppercase tracking-tighter">{req.project?.projectCode}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 text-slate-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                    <Users className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Requesting Operative</p>
                                                    <h3 className="font-display font-bold text-white text-xl tracking-tight leading-tight group-hover:text-indigo-400 transition-colors uppercase">{req.client?.name}</h3>
                                                    <p className="text-xs font-medium text-slate-500 mt-1">{req.client?.email}</p>
                                                    {req.client?.company && <p className="text-[10px] font-bold text-indigo-400/50 mt-1 uppercase tracking-widest">{req.client.company}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {req.message && (
                                            <div className="relative p-6 glass border border-white/5 rounded-[2rem] group/msg overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] -mr-16 -mt-16 group-hover/msg:bg-indigo-500/10 transition-colors"></div>
                                                <div className="flex gap-4 items-start relative z-10">
                                                    <MessageSquare className="w-4 h-4 text-indigo-500/50 mt-1 flex-shrink-0" />
                                                    <p className="text-sm text-slate-400 leading-relaxed italic font-medium">"{req.message}"</p>
                                                </div>
                                            </div>
                                        )}

                                        {req.status === 'rejected' && req.rejectionReason && (
                                            <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-[2rem]">
                                                <div className="flex gap-4 items-start">
                                                    <XCircle className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-2">RESTRICTION REASON</p>
                                                        <p className="text-sm text-slate-400 leading-relaxed font-medium italic">"{req.rejectionReason}"</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 w-full lg:w-auto">
                                        {req.status === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(req._id)}
                                                    disabled={processingId === req._id}
                                                    className="w-full lg:w-48 px-8 py-5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 disabled:opacity-30"
                                                >
                                                    {processingId === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                    Authorize
                                                </button>
                                                <button
                                                    onClick={() => { setRejectingId(req._id); setRejectionReason(''); }}
                                                    className="w-full lg:w-48 px-8 py-5 bg-white/5 border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-slate-500 hover:text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl transition-all"
                                                >
                                                    Restrict
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-right glass-dark px-6 py-4 rounded-2xl border border-white/5">
                                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">AUDIT VERIFIED</p>
                                                <p className="text-sm font-bold text-white font-mono tracking-tighter">{req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : '---'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Rejection UI */}
                                {rejectingId === req._id && (
                                    <div className="mt-8 p-10 glass border border-red-500/20 rounded-[3rem] space-y-6 animate-in slide-in-from-top-4 duration-500">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xl font-display font-bold text-white uppercase tracking-tight">Security Override Restriction</h4>
                                            <button onClick={() => setRejectingId(null)} className="text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:text-white transition-colors">ABORT_OVERRIDE</button>
                                        </div>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="OUTLINE THE CAUSE FOR ACCESS DENIAL..."
                                            className="w-full p-8 bg-white/5 border border-white/10 rounded-[2rem] text-sm text-white focus:outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 h-32 resize-none transition-all placeholder:text-slate-800 font-mono"
                                        />
                                        <button
                                            onClick={() => handleReject(req._id)}
                                            disabled={processingId === req._id}
                                            className="w-full py-5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-red-600/20 disabled:opacity-30"
                                        >
                                            CONFIRM RESTRICTION PROTOCOL
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-10 py-10 bg-white/[0.01] border-t border-white/5">
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Deployment Page {pagination.page} // {pagination.totalPages}</p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchRequests(pagination.page - 1)}
                                disabled={!pagination.hasPrev}
                                className="p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-10 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => fetchRequests(pagination.page + 1)}
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
    );
};

const StatCard = ({ label, value, icon: Icon, color, bgColor }) => {
    return (
        <div className="glass p-6 rounded-[2.5rem] border border-white/5 shadow-xl group hover:border-indigo-500/30 transition-all duration-500">
            <div className="flex flex-col gap-6">
                <div className={`w-14 h-14 rounded-2xl ${bgColor} border border-white/5 ring-1 ring-white/5 flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
                    <Icon className={`w-7 h-7 ${color}`} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 group-hover:text-slate-400 transition-colors">{label}</p>
                    <p className="text-4xl font-display font-bold text-white tracking-tighter">{value}</p>
                </div>
            </div>
        </div>
    );
};

export default ManageAccessRequests;
