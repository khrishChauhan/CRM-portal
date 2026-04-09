import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import {
    Plus, Search, ChevronLeft, ChevronRight, Loader2, FolderOpen,
    Edit3, Trash2, X, AlertCircle, CheckCircle, Calendar, MapPin,
    Clock, AlertTriangle, Briefcase, TrendingUp, MessageSquare,
    ChevronDown, Users, User, UserPlus
} from 'lucide-react';

const STATUSES = ['Planned', 'In Progress', 'On Hold', 'Completed', 'Delayed', 'Cancelled'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUS_COLORS = {
    Planned: 'bg-[#faf8f8] text-[#173d9f] border-gray-100',
    'In Progress': 'bg-[#173d9f]/5 text-[#173d9f] border-[#173d9f]/10',
    'On Hold': 'bg-gray-50 text-gray-500 border-gray-100',
    Completed: 'bg-[#faf8f8] text-gray-400 border-gray-100',
    Delayed: 'bg-red-50 text-red-600 border-red-100',
    Cancelled: 'bg-gray-50 text-gray-400 border-gray-100',
};
const PRIORITY_COLORS = { Low: 'text-gray-400', Medium: 'text-[#173d9f]', High: 'text-[#f86a1f]' };

const ManageProjects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }
    const [toast, setToast] = useState(null);

    const fetchProjects = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 10 });
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);
            if (priorityFilter) params.append('priority', priorityFilter);
            const { data } = await api.get(`/projects?${params}`);
            setProjects(data.data.projects);
            setPagination(data.data.pagination);
        } catch (err) {
            showToast('Failed to fetch projects', 'error');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, priorityFilter]);

    const fetchDashboard = useCallback(async () => {
        try {
            const { data } = await api.get('/projects/dashboard');
            setDashboard(data.data);
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
    useEffect(() => {
        const t = setTimeout(() => fetchProjects(1), 400);
        return () => clearTimeout(t);
    }, [search, statusFilter, priorityFilter, fetchProjects]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleDelete = async (id, name) => {
        setDeleteConfirm({ id, name });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await api.delete(`/projects/${deleteConfirm.id}`);
            showToast('Project deleted');
            fetchProjects(pagination.page);
            fetchDashboard();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed', 'error');
        } finally {
            setDeleteConfirm(null);
        }
    };

    const openEdit = async (id) => {
        try {
            const { data } = await api.get(`/projects/${id}`);
            setEditingProject(data.data);
            setShowModal(true);
        } catch (err) {
            showToast('Failed to load project', 'error');
        }
    };

    const handleSaved = () => {
        setShowModal(false);
        setEditingProject(null);
        fetchProjects(pagination.page);
        fetchDashboard();
    };

    const ov = dashboard?.overview || {};

    return (
        <div className="space-y-10 animate-reveal pb-20">
            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed top-8 right-8 z-[150] flex items-center gap-4 px-6 py-4 rounded-[20px] shadow-2xl bg-white border border-gray-100 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-right-10 duration-500 ${toast.type === 'error' ? 'text-red-500' : 'text-[#f86a1f]'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${toast.type === 'error' ? 'bg-red-50' : 'bg-[#f86a1f]/5'}`}>
                        {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </div>
                    {toast.message}
                </div>
            )}

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1A1A1A] tracking-tight leading-none">Manage Projects</h1>
                    <p className="text-gray-500 mt-2 font-medium text-sm sm:text-base leading-relaxed">Central hub for project oversight and resource allocation.</p>
                </div>
                <button
                    onClick={() => { setEditingProject(null); setShowModal(true); }}
                    className="w-full md:w-auto accent-gradient text-white font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-lg shadow-[#f86a1f]/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    <UserPlus className="w-5 h-5" />
                    New Project
                </button>
            </div>

            {/* ── Dashboard Stats ── */}
            {dashboard && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
                     <MiniStat label="Total" value={ov.total || 0} icon={FolderOpen} color="text-[#8192c4]" bgColor="bg-[#8192c4]/10" onClick={() => { setStatusFilter(''); setSearchParams({}); }} />
                    <MiniStat label="Active" value={ov.active || 0} icon={TrendingUp} color="text-[#f86a1f]" bgColor="bg-[#f86a1f]/10" onClick={() => { setStatusFilter('In Progress'); setSearchParams({ status: 'In Progress' }); }} />
                    <MiniStat label="Completed" value={ov.completed || 0} icon={CheckCircle} color="text-gray-400" bgColor="bg-[#faf8f8]" onClick={() => { setStatusFilter('Completed'); setSearchParams({ status: 'Completed' }); }} />
                    <MiniStat label="On Hold" value={ov.onHold || 0} icon={Clock} color="text-[#8192c4]" bgColor="bg-[#faf8f8]" onClick={() => { setStatusFilter('On Hold'); setSearchParams({ status: 'On Hold' }); }} />
                </div>
            )}

            {/* ── Control Center (Filters) ── */}
            <div className="bg-white p-2 rounded-[24px] shadow-lg border border-gray-100 flex flex-col lg:flex-row gap-2 mt-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#f86a1f] transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search projects by name..."
                        className="w-full bg-[#faf8f8] border border-transparent focus:bg-white focus:ring-4 focus:ring-[#f86a1f]/10 focus:border-[#f86a1f]/30 pl-14 pr-6 py-4.5 text-[#1A1A1A] placeholder-gray-400 rounded-2xl transition-all text-sm font-medium"
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 px-2 pb-2 md:p-0">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-auto px-6 py-4 bg-gray-50/80 border border-gray-100 rounded-[18px] text-[10px] font-bold uppercase tracking-widest text-[#2C3E50] focus:outline-none focus:bg-white transition-all cursor-pointer appearance-none"
                    >
                        <option value="">All Status</option>
                        {STATUSES.map((s) => <option key={s} value={s} className="uppercase">{s}</option>)}
                    </select>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="w-full sm:w-auto px-6 py-4 bg-gray-50/80 border border-gray-100 rounded-[18px] text-[10px] font-bold uppercase tracking-widest text-[#2C3E50] focus:outline-none focus:bg-white transition-all cursor-pointer appearance-none"
                    >
                        <option value="">All Priority</option>
                        {PRIORITIES.map((p) => <option key={p} value={p} className="uppercase">{p}</option>)}
                    </select>
                </div>
            </div>

            {/* ── Project Swipeable Cards ── */}
            <div className="mt-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 sm:py-40 bg-white rounded-[32px] border border-gray-100 shadow-2xl min-h-[300px]">
                        <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-[#173d9f] mb-4" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Initialising Database...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-32 md:py-40 px-4 text-center text-gray-400 bg-white rounded-[32px] border border-gray-100 shadow-2xl min-h-[300px]">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-2xl md:rounded-[32px] flex items-center justify-center mb-4 md:mb-6">
                            <FolderOpen className="w-8 h-8 md:w-10 md:h-10 opacity-20" />
                        </div>
                        <h3 className="text-lg md:text-xl font-display font-bold text-[#1A1A1A] opacity-30 tracking-tight">{statusFilter || priorityFilter || search ? 'No results found for this filter' : 'No Projects Found'}</h3>
                        <p className="text-[13px] md:text-sm mt-1 md:mt-2 font-medium italic mb-6">{statusFilter || priorityFilter || search ? 'Try adjusting your search or filters.' : 'Create your first operational project.'}</p>
                        {statusFilter || priorityFilter || search ? (
                            <button onClick={() => { setStatusFilter(''); setPriorityFilter(''); setSearch(''); setSearchParams({}); }} className="px-6 py-3 bg-[#faf8f8] text-gray-600 rounded-[14px] font-bold text-[10px] uppercase tracking-[0.15em] transition-all active:scale-95 flex items-center gap-2 border border-gray-100">
                                Clear Filters
                            </button>
                        ) : (
                            <button onClick={() => setShowModal(true)} className="px-6 py-3 accent-gradient text-white rounded-[14px] font-bold text-[10px] uppercase tracking-[0.15em] transition-all shadow-lg shadow-[#f86a1f]/20 active:scale-95 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Add Project
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Horizontal Scroll Track */}
                        <div className="flex overflow-x-auto gap-4 md:gap-6 pb-8 pt-4 px-4 sm:px-6 md:px-8 snap-x snap-mandatory scrollbar-hide" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
                            {/* Inner pseudo-margin spacer for perfect center alignment of the first item on mobile */}
                            <div className="w-[calc(50vw-42.5vw-16px)] sm:w-[calc(50vw-170px-24px)] md:hidden shrink-0 pointer-events-none" />
                            
                            {projects.map((p) => (
                                <div key={p._id} className="bg-white rounded-[24px] shrink-0 w-[85vw] sm:w-[340px] md:w-[360px] snap-center flex flex-col shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-400 group overflow-hidden">
                                    
                                    {/* Top Section Header (Off-white) */}
                                    <div className="bg-[#faf8f8] px-6 pt-6 pb-5 flex flex-col gap-3 border-b border-gray-100/60">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex flex-col min-w-0 pr-1">
                                                <h3 className="font-display font-bold text-[#1A1A1A] text-[18px] sm:text-[20px] truncate leading-tight tracking-tight">{p.projectName}</h3>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-[#173d9f]/40 rounded-full shrink-0"></div><span className="truncate">{p.projectCode} • {p.projectCategory || 'General'}</span></div>
                                            </div>
                                            <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-widest border ${STATUS_COLORS[p.projectStatus] || 'border-gray-100 text-gray-400 bg-gray-50 shadow-sm'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${p.projectStatus === 'In Progress' ? 'bg-current animate-pulse' : 'bg-current'}`}></div>
                                                {p.projectStatus}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Body Section */}
                                    <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                                        {/* Middle Section */}
                                        <div className="space-y-4 mb-6 flex-1">
                                            <div className="flex justify-between items-center bg-[#faf8f8] p-3.5 rounded-[14px] border border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-[12px] bg-white flex flex-shrink-0 items-center justify-center text-[#173d9f] border border-gray-100 shadow-sm">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Project Manager</p>
                                                        <p className="text-[13px] font-bold text-[#1A1A1A] truncate">{p.projectManager?.name || 'Unassigned'}</p>
                                                    </div>
                                                </div>
                                                <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[9px] font-bold uppercase tracking-widest border ${p.priority === 'High' ? 'bg-[#f86a1f]/5 text-[#f86a1f] border-[#f86a1f]/10' : p.priority === 'Medium' ? 'bg-[#173d9f]/5 text-[#173d9f] border-[#173d9f]/10' : 'bg-[#faf8f8] text-gray-400 border-gray-100'}`}>
                                                    <TrendingUp className="w-3 h-3" />
                                                    {p.priority}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex flex-col gap-1.5 bg-[#faf8f8] p-3.5 rounded-[14px] border border-gray-100 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Start Date</p>
                                                    </div>
                                                    <p className="text-[12px] font-bold text-gray-600 truncate pt-0.5">{p.startDate ? new Date(p.startDate).toLocaleDateString() : '---'}</p>
                                                </div>
                                                <div className="flex flex-col gap-1.5 bg-[#173d9f]/5 p-3.5 rounded-[14px] border border-[#173d9f]/10 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <CheckCircle className="w-3.5 h-3.5 text-[#173d9f]" />
                                                        <p className="text-[9px] font-bold text-[#173d9f]/70 uppercase tracking-widest">Expected End</p>
                                                    </div>
                                                    <p className="text-[12px] font-bold text-[#173d9f] truncate pt-0.5">{p.expectedCompletion ? new Date(p.expectedCompletion).toLocaleDateString() : '---'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="flex items-center gap-2 pt-2 border-t border-transparent">
                                            <button onClick={() => navigate(`/admin/projects/${p._id}/updates`)} className="flex-1 py-3 text-[#173d9f] hover:text-white bg-[#173d9f]/5 border border-[#173d9f]/10 hover:bg-[#173d9f] rounded-[12px] text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex justify-center items-center gap-2 shadow-sm">
                                                <MessageSquare className="w-4 h-4" /> Updates
                                            </button>
                                            <button onClick={() => openEdit(p._id)} className="p-3 text-gray-400 hover:text-[#173d9f] bg-white border border-gray-100 hover:border-[#173d9f]/20 rounded-[12px] transition-all duration-300 shadow-sm" title="Edit">
                                                <Edit3 className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(p._id, p.projectName)} className="p-3 bg-white hover:bg-red-50 text-red-600 rounded-[12px] transition-all duration-300 border border-red-100 hover:border-red-200 shadow-sm" title="Delete">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Inner pseudo-margin spacer for perfect center alignment of the last item on mobile */}
                            <div className="w-[calc(50vw-42.5vw-16px)] sm:w-[calc(50vw-170px-24px)] md:hidden shrink-0 pointer-events-none" />
                        </div>

                        {/* Pagination Overlay beneath cards */}
                        {pagination.totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 bg-white rounded-[24px] border border-gray-100 shadow-sm gap-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest order-2 sm:order-1">
                                    Page {pagination.page} <span className="text-gray-200 mx-2">/</span> {pagination.totalPages}
                                </p>
                                <div className="flex items-center justify-center gap-3 order-1 sm:order-2">
                                    <button
                                        onClick={() => fetchProjects(pagination.page - 1)}
                                        disabled={!pagination.hasPrev}
                                        className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-[#faf8f8] text-gray-500 disabled:opacity-30 hover:text-[#173d9f] transition-all font-bold border border-gray-100"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => fetchProjects(pagination.page + 1)}
                                        disabled={!pagination.hasNext}
                                        className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-[#faf8f8] text-gray-500 disabled:opacity-30 hover:text-[#173d9f] transition-all font-bold border border-gray-100"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showModal && (
                <ProjectFormModal
                    project={editingProject}
                    onClose={() => { setShowModal(false); setEditingProject(null); }}
                    onSaved={handleSaved}
                    showToast={showToast}
                />
            )}

            {deleteConfirm && (
                <ConfirmationModal
                    title="Delete Project"
                    message={`Are you sure you want to delete "${deleteConfirm.name}"? This action can be undone by admin.`}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteConfirm(null)}
                    confirmText="Delete Project"
                    isDestructive
                />
            )}
        </div>
    );
};

const MiniStat = ({ label, value, icon: Icon, color, bgColor, onClick }) => (
    <div onClick={onClick} className="bg-white p-4 sm:p-5 rounded-[20px] border border-gray-100 shadow-md group hover:border-[#173d9f]/20 hover:-translate-y-1 transition-all duration-300 flex flex-col items-start h-full cursor-pointer active:scale-[0.98] select-none">
        <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
            <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
            <p className="text-2xl sm:text-3xl font-display font-bold text-[#1A1A1A] tracking-tighter leading-none mb-1">{value}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">{label}</p>
        </div>
    </div>
);

const ProjectFormModal = ({ project, onClose, onSaved, showToast }) => {
    const isEdit = !!project;
    const [form, setForm] = useState({
        projectName: project?.projectName || '',
        projectCategory: project?.projectCategory || '',
        description: project?.description || '',
        siteAddress: project?.siteAddress || '',
        latitude: project?.latitude || '',
        longitude: project?.longitude || '',
        projectManager: project?.projectManager?._id || '',
        assignedStaff: project?.assignedStaff?.map(s => s._id) || [],
        startDate: project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        expectedCompletion: project?.expectedCompletion ? new Date(project.expectedCompletion).toISOString().split('T')[0] : '',
        actualCompletion: project?.actualCompletion ? new Date(project.actualCompletion).toISOString().split('T')[0] : '',
        projectStatus: project?.projectStatus || 'Planned',
        priority: project?.priority || 'Medium',
        riskLevel: project?.riskLevel || 'Low',
        delayReason: project?.delayReason || '',
    });
    const [staffList, setStaffList] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/projects/dropdowns')
            .then(res => setStaffList(res.data.data.staff || []))
            .catch(() => { });

        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const toggleStaff = (id) => {
        const updated = form.assignedStaff.includes(id)
            ? form.assignedStaff.filter(s => s !== id)
            : [...form.assignedStaff, id];
        setForm({ ...form, assignedStaff: updated });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        if (!form.projectName.trim()) { setError('Project name is required'); setSaving(false); return; }
        try {
            const payload = { ...form };
            if (!payload.projectManager) payload.projectManager = null;
            if (isEdit) {
                await api.put(`/projects/${project._id}`, payload);
                showToast('Project updated successfully');
            } else {
                await api.post('/projects', payload);
                showToast('Project created successfully');
            }
            onSaved();
        } catch (err) {
            setError(err.response?.data?.message || 'Could not save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[250] flex justify-center items-start p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Card */}
            <div className="bg-white w-[94%] max-w-[460px] h-auto max-h-[92vh] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col relative z-[260] animate-in slide-in-from-top-4 duration-300 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-[22px] pb-3 bg-white shrink-0">
                    <h2 className="text-[20px] font-bold text-[#2C3E50] tracking-tight">
                        {isEdit ? 'Update Project' : 'Create New Project'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 hover:text-red-600 hover:bg-red-50 transition-all duration-200 border border-slate-200/50"
                        aria-label="Close"
                        type="button"
                    >
                        <span className="text-[22px] leading-none mb-0.5">&times;</span>
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 bg-white">
                    <div className="flex-1 overflow-y-auto scrollbar-hide px-[22px] pb-2">
                        {error && (
                            <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-500 text-[10px] font-bold uppercase tracking-widest">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <Field
                            label="Project Name"
                            name="projectName"
                            value={form.projectName}
                            onChange={handleChange}
                            placeholder="Project Name"
                            required
                        />

                        <Field
                            label="Description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Project info..."
                            textarea
                        />

                        <Field
                            label="Location Address"
                            name="siteAddress"
                            value={form.siteAddress}
                            onChange={handleChange}
                            placeholder="Site Location"
                        />


                        <Field
                            label="Start Date"
                            name="startDate"
                            type="date"
                            value={form.startDate}
                            onChange={handleChange}
                        />

                        <div className="pt-4 border-t border-gray-100 mt-2 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4">
                                <Field label="Category" name="projectCategory" value={form.projectCategory} onChange={handleChange} placeholder="Category" />
                                <SelectField label="Priority" name="priority" value={form.priority} onChange={handleChange} options={PRIORITIES} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4">
                                <SelectField label="Status" name="projectStatus" value={form.projectStatus} onChange={handleChange} options={STATUSES} />
                                <Field label="Expected Completion" name="expectedCompletion" type="date" value={form.expectedCompletion} onChange={handleChange} />
                            </div>

                            <div className="space-y-1.5 mb-4">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Assign Manager</label>
                                <div className="relative">
                                    <select
                                        name="projectManager"
                                        value={form.projectManager}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-[#faf8f8] border border-gray-100 rounded-[14px] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#173d9f] focus:ring-4 focus:ring-[#173d9f]/5 transition-all cursor-pointer appearance-none min-h-[48px]"
                                    >
                                        <option value="">Select Manager</option>
                                        {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 mb-4">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Staff Allocation</label>
                                <div className="p-4 bg-[#faf8f8] border border-gray-100 rounded-[20px] min-h-[52px] focus-within:border-[#173d9f] focus-within:ring-4 focus-within:ring-[#173d9f]/5 transition-all" tabIndex="0">
                                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-400 font-medium select-none pointer-events-none">
                                        <Users className="w-4 h-4" /> Select staff members
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {staffList.map(s => {
                                            const selected = form.assignedStaff.includes(s._id);
                                            return (
                                                <button
                                                    key={s._id}
                                                    type="button"
                                                    onClick={() => toggleStaff(s._id)}
                                                    className={`px-3 py-2 rounded-lg text-[10px] sm:text-xs font-bold tracking-wider transition-all border cursor-pointer ${selected ? 'bg-[#173d9f] border-transparent text-white shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:bg-[#faf8f8] hover:text-gray-700'}`}
                                                >
                                                    {s.name} {selected && <CheckCircle className="w-3 h-3 inline-block ml-1 opacity-80" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[11px] font-medium text-gray-400 mt-3 pt-3 border-t border-gray-50">Choose one or more staff members for this project.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-[22px] pt-3 bg-white border-t border-gray-50 shrink-0">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-4.5 accent-gradient text-white font-bold rounded-[16px] shadow-lg shadow-[#f86a1f]/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : (isEdit ? 'Update Project' : 'Create Project')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Field = ({ label, name, value, onChange, placeholder, type = 'text', required = false, textarea = false }) => (
    <div className="space-y-1.5 mb-4">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
        <div className="relative flex items-center">
            {textarea ? (
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder}
                    rows={4}
                    style={{ minHeight: '110px' }}
                    className="w-full px-4 py-3 bg-[#faf8f8] border border-gray-100 rounded-[14px] text-sm font-medium text-[#1A1A1A] placeholder-gray-400 resize-none focus:outline-none focus:border-[#173d9f] focus:ring-4 focus:ring-[#173d9f]/5 transition-all cursor-text"
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder}
                    style={{ minHeight: '48px' }}
                    className={`w-full px-4 py-3 bg-[#faf8f8] border border-gray-100 rounded-[14px] text-sm font-medium text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-[#173d9f] focus:ring-4 focus:ring-[#173d9f]/5 transition-all ${type === 'date' ? 'cursor-pointer pr-10' : 'cursor-text'}`}
                />
            )}
            {type === 'date' && (
                <div className="absolute right-4 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
            )}
        </div>
    </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
    <div className="space-y-1.5 mb-4">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
        <div className="relative flex items-center">
            <select
                name={name}
                value={value}
                onChange={onChange}
                style={{ minHeight: '48px' }}
                className="w-full px-4 py-3 pr-10 bg-[#faf8f8] border border-gray-100 rounded-[14px] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#173d9f] focus:ring-4 focus:ring-[#173d9f]/5 transition-all cursor-pointer appearance-none"
            >
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <div className="absolute right-4 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
        </div>
    </div>
);

const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText, isDestructive }) => (
    <div className="fixed inset-0 z-[300] flex justify-center items-start p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onCancel}></div>
        <div className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-[94%] max-w-[420px] relative z-[310] animate-in slide-in-from-top-4 duration-300 p-8 text-center">
            <div className={`w-16 h-16 rounded-2xl ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-[#173d9f]/5 text-[#173d9f]'} flex items-center justify-center mx-auto mb-6`}>
                {isDestructive ? <Trash2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{title}</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">{message}</p>
            <div className="flex flex-col gap-3">
                <button
                    onClick={onConfirm}
                    className={`w-full py-4 ${isDestructive ? 'bg-red-500 shadow-red-100' : 'blue-gradient shadow-[#173d9f]/10'} text-white font-bold rounded-[16px] shadow-lg hover:opacity-90 active:scale-[0.98] transition-all`}
                >
                    {confirmText || 'Confirm'}
                </button>
                <button
                    onClick={onCancel}
                    className="w-full py-4 text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:text-gray-600 transition-all"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
);

export default ManageProjects;
