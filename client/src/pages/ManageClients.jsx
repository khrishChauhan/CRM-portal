import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import {
    Search, ChevronLeft, ChevronRight, Loader2, Users, UserCheck,
    AlertTriangle, Mail, Building2, Calendar, FolderOpen, AlertCircle,
    CheckCircle, Eye, ShieldOff, ShieldCheck, UserPlus, ChevronDown
} from 'lucide-react';

const STATUS_COLORS = {
    active: 'bg-[#173d9f]/5 text-[#173d9f] border-[#173d9f]/10',
    suspended: 'bg-orange-50 text-orange-600 border-orange-100',
};

const ManageClients = () => {
    const [clients, setClients] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [toast, setToast] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const scrollRef = useRef(null);
    const [activeCardIndex, setActiveCardIndex] = useState(0);

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

    // Track scroll for dot indicator
    const handleScroll = () => {
        const container = scrollRef.current;
        if (!container || clients.length === 0) return;
        const cardWidth = container.scrollWidth / clients.length;
        const index = Math.round(container.scrollLeft / cardWidth);
        setActiveCardIndex(Math.min(index, clients.length - 1));
    };

    return (
        <div className="space-y-8 animate-reveal pb-10">
            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed top-8 right-8 z-[150] flex items-center gap-4 px-6 py-4 rounded-[20px] shadow-2xl bg-white border border-gray-100 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-right-10 duration-500 ${toast.type === 'error' ? 'text-red-500' : 'text-[#173d9f]'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${toast.type === 'error' ? 'bg-red-50' : 'bg-[#173d9f]/5'}`}>
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

            {/* ── Stats Cards (Optimized Mobile Layout) ── */}
            <div className="flex flex-col gap-4 sm:grid sm:grid-cols-3 sm:gap-6">
                {/* Large Horizontal Card for Total */}
                <div className="sm:col-span-1">
                    <StatCard 
                        isLarge 
                        icon={Users} 
                        label="Total Clients" 
                        value={stats.total} 
                        color="secondary" 
                        onClick={() => { setStatusFilter(''); setSearchParams({}); }} 
                    />
                </div>
                
                {/* Side-by-side Small Square Cards */}
                <div className="grid grid-cols-2 gap-4 sm:contents">
                    <StatCard 
                        icon={UserCheck} 
                        label="Active" 
                        value={stats.active} 
                        color="secondary" 
                        onClick={() => { setStatusFilter('active'); setSearchParams({ status: 'active' }); }} 
                    />
                    <StatCard 
                        icon={AlertTriangle} 
                        label="Suspended" 
                        value={stats.suspended} 
                        color="neutral" 
                        onClick={() => { setStatusFilter('suspended'); setSearchParams({ status: 'suspended' }); }} 
                    />
                </div>
            </div>

            {/* ── Filters Bar ── */}
            <div className="bg-white p-2 rounded-[24px] shadow-lg border border-gray-100 flex flex-col md:flex-row gap-2">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#173d9f] transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email or company..."
                        className="w-full bg-[#faf8f8] border border-transparent focus:bg-white focus:ring-4 focus:ring-[#173d9f]/10 focus:border-[#173d9f]/30 pl-14 pr-6 py-4.5 text-[#1A1A1A] placeholder-gray-400 rounded-2xl transition-all text-sm font-medium"
                    />
                </div>
                <div className="px-2 pb-2 md:p-0">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full md:w-auto px-6 py-4 bg-gray-50/80 border border-gray-100 rounded-[18px] text-[10px] font-bold uppercase tracking-widest text-[#2C3E50] focus:outline-none focus:bg-white transition-all cursor-pointer appearance-none"
                    >
                        <option value="">All Clients</option>
                        <option value="active">Active Only</option>
                        <option value="suspended">Suspended Only</option>
                    </select>
                </div>
            </div>

            {/* ── Client Cards (Swipeable) ── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 sm:py-32">
                    <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-[#173d9f] mb-4" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading Clients...</p>
                </div>
            ) : clients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-4 text-center">
                    <div className="w-20 h-20 bg-[#faf8f8] rounded-[24px] flex items-center justify-center mb-6 border border-gray-100">
                        <Users className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-[#1A1A1A] tracking-tight">
                        {statusFilter || search ? 'No results found' : 'No Clients Available'}
                    </h3>
                    <p className="text-gray-400 text-sm font-medium mt-2 mb-6 max-w-sm">
                        {statusFilter || search ? 'Try adjusting your search or filters.' : 'Client registrations will appear here once they sign up.'}
                    </p>
                    {(statusFilter || search) && (
                        <button
                            onClick={() => { setStatusFilter(''); setSearch(''); setSearchParams({}); }}
                            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-[14px] font-bold text-[10px] uppercase tracking-[0.15em] transition-all active:scale-95 mb-3 mx-auto"
                        >
                            Clear Filters
                        </button>
                    )}
                    {!statusFilter && !search && (
                        <button className="px-6 py-3 bg-[#173d9f] text-white rounded-[14px] font-bold text-[10px] uppercase tracking-[0.15em] transition-all active:scale-95 shadow-lg shadow-[#173d9f]/20 flex items-center gap-2 mx-auto">
                            <UserPlus className="w-4 h-4" />
                            Add Client
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Swipeable Carousel */}
                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 px-1 snap-x snap-mandatory scrollbar-hide -mx-1"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                        {clients.map((c, idx) => (
                            <div
                                key={c._id}
                                className="snap-start shrink-0 w-[85%] sm:w-[340px] lg:w-[320px]"
                            >
                                <ClientCard
                                    client={c}
                                    onView={() => viewClient(c._id)}
                                    onStatusChange={handleStatusChange}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Dot Indicators (mobile only) */}
                    {clients.length > 1 && (
                        <div className="flex items-center justify-center gap-2 sm:hidden">
                            {clients.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        idx === activeCardIndex
                                            ? 'w-6 bg-[#173d9f]'
                                            : 'w-1.5 bg-gray-200'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── Pagination ── */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Page {pagination.page} <span className="text-gray-200 mx-2">/</span> {pagination.totalPages}
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchClients(pagination.page - 1)}
                            disabled={!pagination.hasPrev}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-[#173d9f] transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => fetchClients(pagination.page + 1)}
                            disabled={!pagination.hasNext}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-[#173d9f] transition-all shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Client Detail Modal ── */}
            {selectedClient && (
                <div className="fixed inset-0 z-[150] flex justify-center items-start p-4">
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity" onClick={() => setSelectedClient(null)}></div>
                    <div className="bg-white w-[94%] max-w-[460px] h-auto max-h-[92vh] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col relative z-[160] animate-in slide-in-from-top-4 duration-300 overflow-hidden">
                        <div className="flex items-center justify-between p-[22px] pb-3 bg-white shrink-0">
                            <h2 className="text-[20px] font-bold text-[#2C3E50] tracking-tight">{selectedClient.name}</h2>
                            <button
                                onClick={() => setSelectedClient(null)}
                                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 hover:text-red-600 hover:bg-red-50 transition-all duration-200 border border-slate-200/50"
                                aria-label="Close"
                                type="button"
                            >
                                <span className="text-[22px] leading-none mb-0.5">&times;</span>
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
                                                <span className="shrink-0 text-[10px] font-bold text-[#173d9f] bg-[#173d9f]/5 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-[#173d9f]/10">{p.projectStatus}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-7 bg-white border-t border-gray-50 flex-shrink-0">
                            <button onClick={() => setSelectedClient(null)} className="w-full py-4.5 blue-gradient text-white font-bold rounded-[16px] shadow-lg shadow-[#173d9f]/20 hover:scale-[1.01] active:scale-[0.98] transition-all">
                                Close Viewer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════════
   CLIENT CARD — Premium, Minimal, Centered
   ═══════════════════════════════════════════════════ */
const ClientCard = ({ client, onView, onStatusChange }) => {
    const c = client;
    const statusLabel = c.clientStatus || 'active';

    return (
        <div
            className="bg-white rounded-[16px] p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center group cursor-pointer active:scale-[0.98] select-none h-full"
            onClick={onView}
        >
            {/* Top: Avatar */}
            <div className="w-16 h-16 rounded-full bg-[#173d9f]/5 border border-[#173d9f]/10 text-[#173d9f] flex items-center justify-center font-display font-bold text-2xl mb-3 shrink-0 group-hover:scale-105 transition-transform duration-300">
                {c.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            
            {/* Name & Status */}
            <h3 className="font-display font-bold text-[#1A1A1A] text-[16px] tracking-tight truncate w-full group-hover:text-[#173d9f] transition-colors">
                {c.name}
            </h3>
            
            <div className="mt-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border ${STATUS_COLORS[statusLabel] || 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                    {statusLabel === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-[#173d9f] animate-pulse"></span>}
                    {statusLabel}
                </span>
            </div>

            {/* Middle: Email, Company */}
            <div className="space-y-2.5 mb-6 w-full px-2 flex-grow">
                <div className="text-[12px] text-gray-500 font-medium truncate flex items-center justify-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{c.email}</span>
                </div>
                {c.company && (
                    <div className="text-[12px] text-gray-500 font-medium truncate flex items-center justify-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{c.company}</span>
                    </div>
                )}
            </div>

            {/* Bottom: Actions instead of suspending, we put Total Projects / Active Projects and View button */}
            <div className="mt-auto w-full pt-4 border-t border-gray-50 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-4">
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total</span>
                        <span className="text-[14px] font-bold text-[#1A1A1A] leading-none">{c.projectCount || 0}</span>
                    </div>
                </div>
                
                <button
                    onClick={(e) => { e.stopPropagation(); onView(); }}
                    className="py-2.5 px-6 rounded-xl bg-gray-50 border border-gray-100 text-[#173d9f] hover:text-white hover:bg-[#173d9f] font-bold text-[10px] uppercase tracking-wider transition-all"
                >
                    View Detials
                </button>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════
   STAT CARD
   ═══════════════════════════════════ */
const StatCard = ({ icon: Icon, label, value, color, onClick, isLarge = false }) => {
    const colors = {
        accent: 'bg-[#f86a1f]/5 text-[#f86a1f] border-[#f86a1f]/10',
        secondary: 'bg-[#173d9f]/5 text-[#173d9f] border-[#173d9f]/10',
        neutral: 'bg-white text-gray-400 border-gray-100',
    };
    
    return (
        <div 
            onClick={onClick} 
            className={`bg-white rounded-[20px] border border-gray-100 shadow-md group cursor-pointer active:scale-[0.98] select-none hover:-translate-y-1 transition-all duration-300 ${
                isLarge 
                ? 'p-5 flex items-center gap-6 w-full' 
                : 'p-4 sm:p-5 flex flex-col items-start h-full'
            }`}
        >
            <div className={`rounded-xl flex items-center justify-center border shadow-sm ${colors[color] || colors.neutral} group-hover:scale-110 transition-transform duration-500 ${
                isLarge ? 'w-14 h-14' : 'w-10 h-10 mb-3'
            }`}>
                <Icon className={isLarge ? 'w-7 h-7' : 'w-5 h-5'} />
            </div>
            <div className={isLarge ? 'flex-1' : ''}>
                <p className={`${isLarge ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'} font-display font-bold text-[#1A1A1A] tracking-tighter leading-none mb-1`}>
                    {value}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">
                    {label}
                </p>
            </div>
            {isLarge && (
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-[#173d9f] transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </div>
            )}
        </div>
    );
};

/* ═══════════════════════════════════
   INFO ROW (Detail Modal)
   ═══════════════════════════════════ */
const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-5 py-4 px-4 bg-[#faf8f8] border border-gray-100 rounded-2xl group transition-all">
        <div className="w-11 h-11 rounded-[14px] bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#173d9f] transition-all duration-300 shadow-sm">
            <Icon className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
            <span className="text-[13px] font-bold text-[#7F8C8D]">{label}</span>
            <span className="font-bold text-[#2C3E50] text-[15px] mt-0.5 tracking-tight">{value}</span>
        </div>
    </div>
);

export default ManageClients;
