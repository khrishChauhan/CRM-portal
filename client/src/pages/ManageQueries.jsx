import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Loader2, AlertCircle, MessageSquare, CheckCircle,
    Clock, ChevronDown, FolderOpen, User, ExternalLink
} from 'lucide-react';

const STATUS_COLORS = {
    open: 'bg-[#f86a1f]/10 text-[#f86a1f] border-[#f86a1f]/20',
    answered: 'bg-[#173d9f]/10 text-[#173d9f] border-[#173d9f]/20',
    closed: 'bg-[#faf8f8] text-gray-400 border-gray-100',
};

const ManageQueries = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const statusFilter = searchParams.get('status') || 'all';

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const basePath = user?.role === 'admin' ? '/admin' : '/staff';

    useEffect(() => {
        fetchQueries();
    }, [statusFilter]);

    const fetchQueries = async () => {
        setLoading(true);
        try {
            const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
            const { data: res } = await api.get(`/queries/all${params}`);
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load queries');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (newStatus) => {
        if (newStatus === 'all') {
            searchParams.delete('status');
        } else {
            searchParams.set('status', newStatus);
        }
        setSearchParams(searchParams);
    };

    const handleQueryClick = (query) => {
        const projectId = query.projectId?._id || query.projectId;
        navigate(`${basePath}/projects/${projectId}/updates?tab=queries&highlight=${query._id}`);
    };

    const timeAgo = (date) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 md:py-32 min-h-[300px] md:min-h-[500px]">
                <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-[#173d9f] mb-4" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading Queries...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-8 rounded-[32px] border border-red-100 flex items-center gap-6 text-red-500 shadow-sm">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md border border-red-50">
                    <AlertCircle className="w-7 h-7 flex-shrink-0" />
                </div>
                <div>
                    <h3 className="font-bold uppercase tracking-widest text-[10px] mb-1">Error</h3>
                    <p className="text-sm font-medium opacity-80">{error}</p>
                </div>
            </div>
        );
    }

    const queries = data?.queries || [];

    return (
        <div className="space-y-8 animate-reveal pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-[#1A1A1A] tracking-tight">Query Inbox</h1>
                    <p className="text-[#6B7280] font-medium mt-1">All client queries across your projects.</p>
                </div>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <MiniStat
                    label="Total"
                    value={data?.total || 0}
                    active={statusFilter === 'all'}
                    onClick={() => handleStatusChange('all')}
                    color="text-[#173d9f]"
                    bg="bg-[#173d9f]/5"
                    activeBorder="border-[#173d9f]/20"
                />
                <MiniStat
                    label="Open"
                    value={data?.open || 0}
                    active={statusFilter === 'open'}
                    onClick={() => handleStatusChange('open')}
                    color="text-[#f86a1f]"
                    bg="bg-[#f86a1f]/5"
                    activeBorder="border-[#f86a1f]/20"
                />
                <MiniStat
                    label="Answered"
                    value={data?.answered || 0}
                    active={statusFilter === 'answered'}
                    onClick={() => handleStatusChange('answered')}
                    color="text-[#173d9f]"
                    bg="bg-[#173d9f]/5"
                    activeBorder="border-[#173d9f]/20"
                />
                <MiniStat
                    label="Closed"
                    value={data?.closed || 0}
                    active={statusFilter === 'closed'}
                    onClick={() => handleStatusChange('closed')}
                    color="text-gray-400"
                    bg="bg-[#faf8f8]"
                    activeBorder="border-gray-200"
                />
            </div>

            {/* Query List */}
            <div className="space-y-3">
                {queries.length === 0 ? (
                    <div className="bg-white py-16 px-4 rounded-[24px] card-shadow flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-display font-bold text-[#1A1A1A]">No queries available</h3>
                        <p className="text-[#6B7280] text-sm font-medium mt-1">
                            {statusFilter === 'all'
                                ? 'No client queries have been submitted yet.'
                                : `No queries with status "${statusFilter}" found.`}
                        </p>
                    </div>
                ) : (
                    queries.map((query) => (
                        <div
                            key={query._id}
                            onClick={() => handleQueryClick(query)}
                            className="bg-white p-5 sm:p-6 rounded-[20px] border border-gray-100 shadow-sm hover:shadow-md hover:border-[#173d9f]/20 transition-all duration-300 cursor-pointer active:scale-[0.99] group"
                        >
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-xl bg-[#173d9f]/5 flex items-center justify-center text-[#173d9f] font-bold text-sm shrink-0">
                                    {query.clientId?.name?.charAt(0) || 'C'}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Top Row: Name + Status */}
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-sm font-bold text-[#1A1A1A] truncate">
                                                {query.clientId?.name || 'Client'}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest border ${STATUS_COLORS[query.status] || STATUS_COLORS.open}`}>
                                                {query.status}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {timeAgo(query.createdAt)}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-[15px] font-bold text-[#1A1A1A] leading-snug mb-1 group-hover:text-[#173d9f] transition-colors truncate">
                                        {query.title}
                                    </h3>

                                    {/* Message Preview */}
                                    <p className="text-gray-500 text-[13px] font-medium leading-relaxed line-clamp-2 mb-2">
                                        {query.message}
                                    </p>

                                    {/* Bottom Row: Project + Link */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-[#173d9f] bg-[#173d9f]/5 px-2 py-0.5 rounded-md border border-[#173d9f]/10 uppercase tracking-widest">
                                                {query.projectId?.projectCode || 'N/A'}
                                            </span>
                                            <span className="text-gray-400 text-[11px] font-medium truncate max-w-[180px]">
                                                {query.projectId?.projectName || 'Unknown Project'}
                                            </span>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
                                    </div>

                                    {/* Response indicator */}
                                    {query.status === 'answered' && query.respondedBy && (
                                        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                                            <CheckCircle className="w-3.5 h-3.5 text-[#173d9f]" />
                                            <span className="text-[10px] font-bold text-[#173d9f] uppercase tracking-widest">
                                                Responded by {query.respondedBy?.name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const MiniStat = ({ label, value, active, onClick, color, bg, activeBorder }) => (
    <div
        onClick={onClick}
        className={`p-3 sm:p-4 rounded-[16px] border transition-all duration-300 cursor-pointer active:scale-[0.98] select-none ${
            active
                ? `bg-white border-2 ${activeBorder} shadow-md`
                : 'bg-white border-gray-100 shadow-sm hover:border-gray-200'
        }`}
    >
        <p className={`text-xl sm:text-2xl font-display font-bold tracking-tighter leading-none mb-0.5 ${active ? color : 'text-[#1A1A1A]'}`}>
            {value}
        </p>
        <p className={`text-[9px] font-bold uppercase tracking-widest ${active ? color : 'text-gray-400'}`}>
            {label}
        </p>
    </div>
);

export default ManageQueries;
