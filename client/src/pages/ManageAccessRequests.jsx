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
        if (!window.confirm('Approve this access request?')) return;
        setProcessingId(id);
        try {
            await api.patch(`/access-requests/${id}/approve`);
            showToast('Request approved');
            fetchRequests(pagination.page);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to approve', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        if (!rejectionReason.trim()) {
            showToast('Provide a reason', 'error');
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
        <div className="space-y-8 animate-reveal pb-10">
            {toast && (
                <div className={`fixed top-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl ${toast.type === 'error' ? 'bg-red-600 text-white' : 'blue-gradient text-white'} text-sm font-bold animate-in slide-in-from-right-10`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    {toast.message}
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-[#1A1A1A]">Access Requests</h1>
                    <p className="text-[#6B7280] font-medium">Review and manage client project visibility.</p>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
                <StatCard label="Total" value={stats.total} icon={FileText} color="text-blue-600" bgColor="bg-blue-50" />
                <StatCard label="Pending" value={stats.pending} icon={Clock} color="text-amber-600" bgColor="bg-amber-50" />
                <StatCard label="Approved" value={stats.approved} icon={CheckCircle} color="text-emerald-600" bgColor="bg-emerald-50" />
                <StatCard label="Declined" value={stats.rejected} icon={XCircle} color="text-red-600" bgColor="bg-red-50" />
            </div>

            {/* Filters */}
            <div className="bg-white p-2 rounded-[22px] card-shadow flex flex-col md:flex-row gap-2">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by client or project..."
                        className="w-full bg-gray-50 border-2 border-transparent focus:bg-white pl-14 pr-6 py-4 rounded-[18px] text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:shadow-sm cursor-text transition-all text-sm font-medium"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="md:w-48 px-6 py-4 bg-gray-50 border-none rounded-[18px] text-xs font-bold uppercase tracking-wider text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-[24px] card-shadow overflow-hidden min-h-[300px] sm:min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 sm:py-32">
                        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-blue-600 mb-4" />
                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Loading requests...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-32 px-4 text-center text-gray-400">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-2xl md:rounded-[22px] flex items-center justify-center mb-4 sm:mb-6">
                            <FileText className="w-8 h-8 sm:w-10 sm:h-10 opacity-20" />
                        </div>
                        <h3 className="text-base sm:text-lg font-display font-bold text-gray-900">No requests found</h3>
                        <p className="text-[13px] sm:text-sm font-medium mt-1">Check back later for new access requests.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {requests.map(req => (
                            <div key={req._id} className="p-8 hover:bg-gray-50/50 transition-all duration-300">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                                    <div className="space-y-6 flex-1">
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {req.status}
                                            </span>
                                            <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                    <Briefcase className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Project</p>
                                                    <h3 className="font-display font-bold text-[#1A1A1A] text-lg leading-tight uppercase">{req.project?.projectName}</h3>
                                                    <p className="text-xs font-bold text-blue-600/70 mt-0.5">{req.project?.projectCode}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center flex-shrink-0">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Client</p>
                                                    <h3 className="font-display font-bold text-[#1A1A1A] text-lg leading-tight uppercase">{req.client?.name}</h3>
                                                    <p className="text-xs text-gray-500 font-medium">{req.client?.email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {req.message && (
                                            <div className="p-5 bg-gray-50 border border-gray-200 border-l-[3px] border-l-blue-600 rounded-2xl cursor-default">
                                                <div className="flex gap-3 items-start">
                                                    <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                    <p className="text-sm text-gray-900 leading-relaxed font-medium">"{req.message}"</p>
                                                </div>
                                            </div>
                                        )}

                                        {req.status === 'rejected' && req.rejectionReason && (
                                            <div className="p-5 bg-gray-50 border border-gray-200 border-l-[3px] border-l-red-600 rounded-2xl cursor-default">
                                                <div className="flex gap-3 items-start">
                                                    <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Rejection Reason</p>
                                                        <p className="text-sm text-gray-900 leading-relaxed font-medium">"{req.rejectionReason}"</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-auto">
                                        {req.status === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(req._id)}
                                                    disabled={processingId === req._id}
                                                    className="flex-1 lg:w-40 px-6 py-4 blue-gradient text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all btn-shadow flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {processingId === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => { setRejectingId(req._id); setRejectionReason(''); }}
                                                    className="flex-1 lg:w-40 px-6 py-4 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all"
                                                >
                                                    Decline
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center px-6 py-4 bg-gray-50 rounded-xl border border-gray-200 border-l-[3px] border-l-blue-600 cursor-default min-w-[140px]">
                                                <div className="flex items-center gap-1.5 mb-1 text-gray-500">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <p className="text-[10px] font-bold uppercase tracking-wider">Reviewed On</p>
                                                </div>
                                                <p className="text-sm font-medium text-gray-900">{req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : '---'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {rejectingId === req._id && (
                                    <div className="mt-6 p-8 bg-gray-50 border border-gray-200 rounded-[20px] space-y-4 animate-reveal">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-lg font-display font-bold text-[#1A1A1A]">Provide Reason</h4>
                                            <button onClick={() => setRejectingId(null)} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-red-600 transition-colors">Cancel</button>
                                        </div>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Why are you declining this request?"
                                            className="w-full p-5 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl text-sm focus:outline-none focus:border-blue-600 focus:shadow-sm cursor-text h-28 resize-none transition-all placeholder:text-gray-400 font-medium"
                                        />
                                        <button
                                            onClick={() => handleReject(req._id)}
                                            disabled={processingId === req._id}
                                            className="w-full py-4 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                                        >
                                            Confirm Decline
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-8 py-8 bg-gray-50/50 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Page {pagination.page} of {pagination.totalPages}</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchRequests(pagination.page - 1)}
                                disabled={!pagination.hasPrev}
                                className="p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 disabled:opacity-30 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => fetchRequests(pagination.page + 1)}
                                disabled={!pagination.hasNext}
                                className="p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 disabled:opacity-30 transition-all"
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
        <div className="bg-white p-4 sm:p-5 rounded-[20px] shadow-md border border-gray-100 group flex flex-col items-start h-full hover:-translate-y-1 transition-all duration-300">
            <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
                <p className="text-2xl sm:text-3xl font-display font-bold text-[#1A1A1A] tracking-tighter leading-none mb-1">{value}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">{label}</p>
            </div>
        </div>
    );
};

export default ManageAccessRequests;
