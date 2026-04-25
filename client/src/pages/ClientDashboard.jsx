import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Search, ChevronLeft, ChevronRight, Loader2,
    AlertCircle, CheckCircle, MapPin, ChevronRight as GoIcon
} from 'lucide-react';

const PROJECT_STATUS_COLORS = {
    Planned: 'bg-[#faf8f8] text-gray-400 border-gray-100',
    'In Progress': 'bg-[#173d9f]/5 text-[#173d9f] border-[#173d9f]/10',
    'On Hold': 'bg-gray-50 text-gray-500 border-gray-100',
    Completed: 'bg-green-50 text-green-600 border-green-100',
    Delayed: 'bg-red-50 text-red-600 border-red-100',
    Cancelled: 'bg-gray-50 text-gray-400 border-gray-100',
};

const ClientDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [allProjects, setAllProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/projects/client-all');
            setAllProjects(data.data || []);
        } catch (err) {
            showToast('Failed to fetch projects', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Client-side search filtering
    useEffect(() => {
        if (!search.trim()) {
            setProjects(allProjects);
            return;
        }
        const re = new RegExp(search, 'i');
        setProjects(allProjects.filter(p =>
            re.test(p.projectName) ||
            re.test(p.projectCode) ||
            re.test(p.siteAddress || '') ||
            re.test(p.projectCategory || '')
        ));
    }, [search, allProjects]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    return (
        <div className="space-y-8 animate-reveal pb-20 font-body">
            {toast && (
                <div className={`fixed top-8 right-8 z-[150] flex items-center gap-4 px-6 py-4 rounded-[20px] shadow-2xl bg-white border border-gray-100 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-right-10 duration-500 ${toast.type === 'error' ? 'text-red-500' : 'text-[#173d9f]'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${toast.type === 'error' ? 'bg-red-50' : 'bg-[#173d9f]/5'}`}>
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
                        {!loading && (
                            <div className="px-5 py-2.5 bg-[#173d9f]/5 border border-[#173d9f]/10 rounded-xl">
                                <span className="text-[10px] font-bold text-[#173d9f] uppercase tracking-widest">
                                    {allProjects.length} Project{allProjects.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* SEARCH BAR */}
                    <div className="relative group max-w-2xl">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#173d9f] transition-colors z-10" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by project name or location..."
                            className="w-full bg-[#faf8f8] border border-transparent text-[#1A1A1A] pl-14 pr-6 py-4.5 rounded-2xl focus:bg-white focus:border-[#173d9f]/20 focus:ring-4 focus:ring-[#173d9f]/5 transition-all outline-none placeholder:text-gray-400 text-sm font-medium"
                        />
                    </div>
                </div>

                {/* PROJECT LIST */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 md:py-20">
                        <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-[#173d9f] mb-4" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Compiling Database...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 md:py-20 px-4 text-center text-gray-400">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-2xl md:rounded-[32px] flex items-center justify-center mb-4 md:mb-6">
                            <Search className="w-6 h-6 md:w-8 md:h-8 opacity-20" />
                        </div>
                        <h3 className="text-lg md:text-xl font-display font-bold text-[#1A1A1A] opacity-30 tracking-tight">No Matches Found</h3>
                        <p className="text-[13px] md:text-sm mt-1 md:mt-2 font-medium italic">Try broadening your search logic.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {projects.map(p => (
                            <div key={p._id} className="bg-white border border-gray-100 rounded-[24px] p-6 sm:p-8 hover:border-[#173d9f]/20 hover:shadow-xl transition-all duration-500 group">
                                <div className="flex justify-between items-start gap-4 mb-5">
                                    <h3 className="text-xl font-display font-bold text-[#1A1A1A] leading-tight group-hover:text-[#173d9f] transition-colors">
                                        {p.projectName}
                                    </h3>
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex-shrink-0 border ${PROJECT_STATUS_COLORS[p.projectStatus] || 'bg-[#faf8f8] text-gray-400 border-gray-100'
                                        }`}>
                                        {p.projectStatus}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-8 h-8 rounded-lg bg-[#173d9f]/5 flex items-center justify-center">
                                        <MapPin className="w-4 h-4 text-[#173d9f]" />
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

                                    <button
                                        onClick={() => navigate(`/client/projects/${p._id}/updates`)}
                                        className="w-full sm:w-auto px-8 py-3.5 blue-gradient text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all btn-shadow flex items-center justify-center gap-2"
                                    >
                                        Intelligence Portal <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientDashboard;
