import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Search, ChevronLeft, ChevronRight, Loader2,
    AlertCircle, CheckCircle, Clock, MapPin, Send, MessageSquare, X
} from 'lucide-react';

const PROJECT_STATUS_COLORS = {
    Planned: 'bg-blue-50 text-blue-600 border-blue-100',
    'In Progress': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'On Hold': 'bg-amber-50 text-amber-600 border-amber-100',
    Completed: 'bg-green-50 text-green-600 border-green-100',
    Delayed: 'bg-red-50 text-red-600 border-red-100',
    Cancelled: 'bg-gray-50 text-gray-400 border-gray-100',
};

const ClientDashboard = () => {
    const [myRequests, setMyRequests] = useState([]);
    const [projects, setProjects] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const [requestModal, setRequestModal] = useState(null);
    const [requestMessage, setRequestMessage] = useState('');
    const [requesting, setRequesting] = useState(false);
    const navigate = useNavigate();

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
            const { data } = await api.get(`/access-requests/projects?${params}`);
            setProjects(data.data.projects);
            setPagination(data.data.pagination);
        } catch (err) {
            showToast('Failed to fetch projects', 'error');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchMyRequests();
    }, [fetchMyRequests]);

    useEffect(() => {
        const t = setTimeout(() => fetchBrowseProjects(1), 400);
        return () => clearTimeout(t);
    }, [search, fetchBrowseProjects]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        if (requestModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [requestModal]);

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
            fetchMyRequests();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to request access', 'error');
        } finally {
            setRequesting(false);
        }
    };

    const requestMap = {};
    myRequests.forEach(r => {
        if (r.projectId?._id) requestMap[r.projectId._id] = r;
    });

    return (
        <div className="space-y-8 animate-reveal pb-20 font-body">
            {toast && (
                <div className={`fixed top-8 right-8 z-[150] flex items-center gap-4 px-6 py-4 rounded-[20px] shadow-2xl bg-white border border-gray-100 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-right-10 duration-500 ${toast.type === 'error' ? 'text-red-500' : 'text-blue-600'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${toast.type === 'error' ? 'bg-red-50' : 'bg-blue-50'}`}>
                        {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </div>
                    {toast.message}
                </div>
            )}

            {/* MAIN CARD SECTION */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl p-6 sm:p-10">
                <div className="mb-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h2 className="text-3xl font-display font-bold text-[#1A1A1A] tracking-tight">Project Directory</h2>
                            <p className="text-gray-500 font-medium text-sm mt-1">Browse and monitor infrastructure development.</p>
                        </div>
                    </div>
                    
                    {/* SEARCH BAR */}
                    <div className="relative group max-w-2xl">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors z-10" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by project name or location..."
                            className="w-full bg-gray-50 border border-transparent text-[#1A1A1A] pl-14 pr-6 py-4.5 rounded-2xl focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none placeholder:text-gray-400 text-sm font-medium"
                        />
                    </div>
                </div>

                {/* PROJECT LIST */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Compiling Database...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6">
                            <Search className="w-8 h-8 opacity-20" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-[#1A1A1A] opacity-30 tracking-tight">No Matches Found</h3>
                        <p className="text-sm mt-2 font-medium italic">Try broadening your search logic.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {projects.map(p => {
                            const req = requestMap[p._id];
                            const reqStatus = req?.status;
                            const isApproved = reqStatus === 'approved';

                            return (
                                <div key={p._id} className="bg-white border border-gray-100 rounded-[24px] p-6 sm:p-8 hover:border-blue-500/20 hover:shadow-xl transition-all duration-500 group">
                                    <div className="flex justify-between items-start gap-4 mb-5">
                                        <h3 className="text-xl font-display font-bold text-[#1A1A1A] leading-tight group-hover:text-blue-600 transition-colors">
                                            {p.projectName}
                                        </h3>
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex-shrink-0 border ${
                                            PROJECT_STATUS_COLORS[p.projectStatus] || 'bg-gray-50 text-gray-400 border-gray-100'
                                        }`}>
                                            {p.projectStatus}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <MapPin className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-500">{p.siteAddress || 'Location Undefined'}</span>
                                    </div>

                                    <p className="text-sm text-gray-400 font-medium line-clamp-2 mb-8 leading-relaxed">
                                        {p.description || 'Information regarding this specific project initiative is currently being curated for the portal.'}
                                    </p>

                                    <div className="h-px bg-gray-50 w-full mb-8"></div>

                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Commencement</span>
                                                <span className="text-sm font-bold text-gray-500">{p.startDate ? new Date(p.startDate).toLocaleDateString() : '---'}</span>
                                            </div>
                                            <div className="w-px h-8 bg-gray-100"></div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Category</span>
                                                <span className="text-sm font-bold text-gray-500">{p.projectCategory || 'General'}</span>
                                            </div>
                                        </div>
                                        
                                        {isApproved ? (
                                            <button 
                                                onClick={() => navigate(`/client/projects/${p._id}/updates`)}
                                                className="w-full sm:w-auto px-8 py-3.5 blue-gradient text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all btn-shadow flex items-center justify-center gap-2"
                                            >
                                                Intelligence Portal <ChevronRight className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setRequestModal(p)}
                                                disabled={reqStatus === 'pending'}
                                                className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all flex items-center justify-center gap-2 shadow-sm ${
                                                    reqStatus === 'pending' 
                                                    ? 'bg-amber-50 border-amber-100 text-amber-600 opacity-80' 
                                                    : 'bg-white border-blue-500 text-blue-600 hover:bg-blue-50'
                                                }`}
                                            >
                                                {reqStatus === 'pending' ? <Clock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                                                {reqStatus === 'pending' ? 'Verification Pending' : 'Request Protocols'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* PAGINATION */}
                {pagination.totalPages > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-4">
                        <button
                            onClick={() => fetchBrowseProjects(pagination.page - 1)}
                            disabled={!pagination.hasPrev}
                            className="w-12 h-12 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-blue-600 transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div className="px-6 py-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Page <span className="text-[#1A1A1A] mx-1">{pagination.page}</span> of {pagination.totalPages}
                            </span>
                        </div>
                        <button
                            onClick={() => fetchBrowseProjects(pagination.page + 1)}
                            disabled={!pagination.hasNext}
                            className="w-12 h-12 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-blue-600 transition-all shadow-sm"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                )}
            </div>

            {/* Request Modal */}
            {requestModal && (
                <div className="fixed inset-0 z-[200] flex md:items-center md:justify-center">
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity" onClick={() => { setRequestModal(null); setRequestMessage(''); }}></div>
                    <div className="bg-white w-full h-full md:h-auto md:w-[94%] md:max-w-[460px] md:max-w-[520px] md:max-h-[90vh] md:rounded-[26px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col relative z-[210] animate-in slide-in-from-bottom md:zoom-in-95 duration-300 md:duration-500 overflow-hidden">
                        <div className="flex items-center justify-between p-7 pb-4 bg-white shrink-0">
                            <h2 className="text-[22px] font-bold text-[#2C3E50] tracking-tight">Request Protocols</h2>
                            <button onClick={() => { setRequestModal(null); setRequestMessage(''); }} className="p-2 text-gray-400 hover:text-red-500 transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                            <div className="flex-1 overflow-y-auto scrollbar-hide px-7 pt-2 pb-8">
                                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-6 inline-block px-3 py-1 bg-blue-50 rounded-lg">{requestModal.projectName}</p>
                                <div className="space-y-1.5 mb-8">
                                    <label className="text-[15px] font-bold text-[#34495E] ml-1">Optional Context</label>
                                    <textarea
                                        value={requestMessage}
                                        onChange={(e) => setRequestMessage(e.target.value)}
                                        placeholder="Explain your interest in this project..."
                                        style={{ minHeight: '110px' }}
                                        className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-[14px] text-sm font-medium text-[#1A1A1A] placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="p-7 pt-4 bg-white border-t border-gray-50 flex-shrink-0">
                                <button
                                    onClick={handleRequestAccess}
                                    disabled={requesting}
                                    className="w-full py-4.5 blue-gradient text-white font-bold rounded-[16px] shadow-lg shadow-blue-200 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {requesting ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : <Send className="w-5 h-5" />}
                                    Submit Request
                                </button>
                            </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDashboard;
