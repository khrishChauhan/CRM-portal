import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Plus, Search, ChevronLeft, ChevronRight, Loader2, FolderOpen,
    Edit3, Trash2, X, AlertCircle, CheckCircle, Calendar, MapPin,
    Clock, AlertTriangle, Briefcase, TrendingUp, MessageSquare
} from 'lucide-react';

const STATUSES = ['Planned', 'In Progress', 'On Hold', 'Completed', 'Delayed', 'Cancelled'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUS_COLORS = {
    Planned: 'bg-blue-50 text-blue-600 border-blue-100',
    'In Progress': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'On Hold': 'bg-amber-50 text-amber-600 border-amber-100',
    Completed: 'bg-green-50 text-green-600 border-green-100',
    Delayed: 'bg-red-50 text-red-600 border-red-100',
    Cancelled: 'bg-gray-50 text-gray-500 border-gray-100',
};
const PRIORITY_COLORS = { Low: 'text-blue-500', Medium: 'text-amber-500', High: 'text-red-500' };

const ManageProjects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
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
        if (!window.confirm(`Delete project "${name}"? This is a soft delete.`)) return;
        try {
            await api.delete(`/projects/${id}`);
            showToast('Project deleted');
            fetchProjects(pagination.page);
            fetchDashboard();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed', 'error');
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
                    <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1A1A1A] tracking-tight leading-none">Manage Projects</h1>
                    <p className="text-gray-500 mt-2 font-medium text-sm sm:text-base leading-relaxed">Central hub for project oversight and resource allocation.</p>
                </div>
                <button
                    onClick={() => { setEditingProject(null); setShowModal(true); }}
                    className="w-full md:w-auto blue-gradient text-white font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all btn-shadow hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    <Plus className="w-5 h-5" />
                    New Project
                </button>
            </div>

            {/* ── Dashboard Stats ── */}
            {dashboard && (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mt-6">
                    <MiniStat label="Total" value={ov.total || 0} icon={FolderOpen} color="text-blue-500" bgColor="bg-blue-50" />
                    <MiniStat label="Active" value={ov.active || 0} icon={TrendingUp} color="text-emerald-500" bgColor="bg-emerald-50" />
                    <MiniStat label="Completed" value={ov.completed || 0} icon={CheckCircle} color="text-sky-500" bgColor="bg-sky-50" />
                    <MiniStat label="Delayed" value={ov.delayed || 0} icon={AlertTriangle} color="text-red-500" bgColor="bg-red-50" />
                    <MiniStat label="On Hold" value={ov.onHold || 0} icon={Clock} color="text-amber-500" bgColor="bg-amber-50" />
                    <MiniStat label="Deleted" value={ov.deleted || 0} icon={Trash2} color="text-gray-500" bgColor="bg-gray-50" />
                </div>
            )}

            {/* ── Control Center (Filters) ── */}
            <div className="bg-[#2E2E2E] p-2 rounded-[24px] shadow-xl flex flex-col lg:flex-row gap-2 mt-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search projects by name..."
                        className="w-full bg-transparent pl-14 pr-6 py-4.5 text-white placeholder-gray-600 focus:outline-none transition-all text-sm font-medium"
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 px-2 pb-2 md:p-0">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-auto px-6 py-4 bg-white/5 border border-white/5 rounded-[18px] text-[10px] font-bold uppercase tracking-widest text-gray-400 focus:outline-none focus:bg-white/10 transition-all cursor-pointer"
                    >
                        <option value="" className="bg-[#2E2E2E]">All Status</option>
                        {STATUSES.map((s) => <option key={s} value={s} className="bg-[#2E2E2E] uppercase">{s}</option>)}
                    </select>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="w-full sm:w-auto px-6 py-4 bg-white/5 border border-white/5 rounded-[18px] text-[10px] font-bold uppercase tracking-widest text-gray-400 focus:outline-none focus:bg-white/10 transition-all cursor-pointer"
                    >
                        <option value="" className="bg-[#2E2E2E]">All Priority</option>
                        {PRIORITIES.map((p) => <option key={p} value={p} className="bg-[#2E2E2E] uppercase">{p}</option>)}
                    </select>
                </div>
            </div>

            {/* ── Main Data Mesh ── */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden min-h-[500px] mt-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Initialising Database...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 text-gray-400">
                        <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6">
                            <FolderOpen className="w-10 h-10 opacity-20" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-[#1A1A1A] opacity-30 tracking-tight">No Projects Found</h3>
                        <p className="text-sm mt-2 font-medium">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="text-left px-10 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project Details</th>
                                    <th className="text-left px-8 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lead Manager</th>
                                    <th className="text-left px-8 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Operational Status</th>
                                    <th className="text-left px-8 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Security Level</th>
                                    <th className="text-left px-8 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Timeline</th>
                                    <th className="text-right px-10 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Commands</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {projects.map((p) => (
                                    <tr key={p._id} className="group hover:bg-gray-50 transition-colors duration-300">
                                        <td className="px-10 py-7">
                                            <div className="flex flex-col">
                                                <p className="font-bold text-[#1A1A1A] group-hover:text-blue-600 transition-colors text-base tracking-tight leading-tight mb-1">{p.projectName}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500/20"></span>
                                                    {p.projectCode} • {p.projectCategory || 'General'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7 font-bold text-gray-600 text-[13px]">{p.projectManager?.name || '---'}</td>
                                        <td className="px-8 py-7">
                                            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${STATUS_COLORS[p.projectStatus] || 'border-gray-100 text-gray-400 bg-gray-50'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${p.projectStatus === 'In Progress' ? 'bg-current animate-pulse' : 'bg-current'}`}></div>
                                                {p.projectStatus}
                                            </span>
                                        </td>
                                        <td className="px-8 py-7">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${PRIORITY_COLORS[p.priority]}`}>
                                                <TrendingUp className="w-3.5 h-3.5" />
                                                {p.priority}
                                            </span>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                    {p.startDate ? new Date(p.startDate).toLocaleDateString() : '---'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    {p.expectedCompletion ? new Date(p.expectedCompletion).toLocaleDateString() : '---'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-7">
                                            <div className="flex items-center justify-end gap-3">
                                                <button onClick={() => navigate(`/admin/projects/${p._id}/updates`)} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Updates">
                                                    <MessageSquare className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => openEdit(p._id)} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Edit">
                                                    <Edit3 className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDelete(p._id, p.projectName)} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
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
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Page {pagination.page} of {pagination.totalPages}</p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchProjects(pagination.page - 1)}
                                disabled={!pagination.hasPrev}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-blue-600 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => fetchProjects(pagination.page + 1)}
                                disabled={!pagination.hasNext}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-blue-600 transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
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
        </div>
    );
};

const MiniStat = ({ label, value, icon: Icon, color, bgColor }) => (
    <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-xl group hover:border-blue-500/20 transition-all duration-500 flex items-center gap-5">
        <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-2xl font-display font-bold text-[#1A1A1A] tracking-tighter">{value}</p>
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
        api.get('/projects/dropdowns').then(res => setStaffList(res.data.data.staff || [])).catch(() => { });
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
        <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-4 pt-10 sm:pt-4">
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity animate-in fade-in duration-500" onClick={onClose}></div>
            <div className="bg-white rounded-[32px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.15)] w-[95%] sm:w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col relative z-[220] animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between px-8 py-8 md:px-10 md:py-10 border-b border-gray-50 bg-gray-50/30 shrink-0">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-[#1A1A1A] tracking-tight">{isEdit ? 'Update Project' : 'New Project'}</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{isEdit ? `ID: ${project.projectCode}` : 'Configure project baseline'}</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden min-h-0 bg-white">
                    <div className="px-8 py-8 md:px-10 md:py-10 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="flex items-center gap-4 p-5 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-[10px] font-bold uppercase tracking-widest animate-shake">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                        <Field label="Project Name" name="projectName" value={form.projectName} onChange={handleChange} icon={FolderOpen} required placeholder="Enter project name" />
                        <Field label="Category" name="projectCategory" value={form.projectCategory} onChange={handleChange} icon={Briefcase} placeholder="e.g. Website, App" />
                    </div>

                    <Field label="Description" name="description" value={form.description} onChange={handleChange} textarea placeholder="Describe the project goals and scope..." />
                    <Field label="Location / Site Address" name="siteAddress" value={form.siteAddress} onChange={handleChange} icon={MapPin} placeholder="Enter site address" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <Field label="Start Date" name="startDate" type="date" value={form.startDate} onChange={handleChange} icon={Calendar} />
                        <Field label="Expected Completion" name="expectedCompletion" type="date" value={form.expectedCompletion} onChange={handleChange} icon={Calendar} />
                        {isEdit && <Field label="Actual Completion" name="actualCompletion" type="date" value={form.actualCompletion} onChange={handleChange} icon={Calendar} />}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <SelectField label="Status" name="projectStatus" value={form.projectStatus} onChange={handleChange} options={STATUSES} />
                        <SelectField label="Priority" name="priority" value={form.priority} onChange={handleChange} options={PRIORITIES} />
                        <SelectField label="Risk Level" name="riskLevel" value={form.riskLevel} onChange={handleChange} options={['Low', 'Medium', 'High']} />
                    </div>

                    {form.projectStatus === 'Delayed' && (
                        <Field label="Delay Reason" name="delayReason" value={form.delayReason} onChange={handleChange} textarea placeholder="Explain the reason for the delay..." />
                    )}

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            Project Manager
                        </label>
                        <select name="projectManager" value={form.projectManager} onChange={handleChange} className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer">
                            <option value="">Select Manager</option>
                            {staffList.map(s => <option key={s._id} value={s._id}>{s.name} — {s.designation || 'Staff'}</option>)}
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            Assigned Staff ({form.assignedStaff.length})
                        </label>
                        <div className="flex flex-wrap gap-2 p-5 bg-gray-50 border border-gray-100 rounded-[28px] min-h-[100px]">
                            {staffList.length === 0 ? (
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic p-4">Loading operational staff...</p>
                            ) : staffList.map(s => {
                                const selected = form.assignedStaff.includes(s._id);
                                return (
                                    <button
                                        key={s._id}
                                        type="button"
                                        onClick={() => toggleStaff(s._id)}
                                        className={`px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${selected ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-500/50'}`}
                                    >
                                        {s.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    </div>

                    <div className="shrink-0 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4 p-8 md:p-10 border-t border-gray-50 bg-gray-50/20">
                        <button type="button" onClick={onClose} className="w-full sm:w-auto px-10 py-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest rounded-xl hover:bg-gray-100 hover:text-gray-600 transition-all">Cancel</button>
                        <button type="submit" disabled={saving} className="w-full sm:w-auto px-12 py-4 blue-gradient text-[10px] font-bold text-white uppercase tracking-widest rounded-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30">
                            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isEdit ? 'Update Project' : 'Initialise Project')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Field = ({ label, name, type = 'text', value, onChange, icon: Icon, required, placeholder, textarea }) => (
    <div className="space-y-3 group">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
            {Icon && <Icon className="w-3.5 h-3.5 transition-colors group-focus-within:text-blue-500" />}
            {label} {required && <span className="text-blue-500">•</span>}
        </label>
        {textarea ? (
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={4}
                className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-[24px] text-sm font-medium text-[#1A1A1A] placeholder-gray-300 resize-none focus:outline-none focus:border-blue-500/50 transition-all"
            />
        ) : (
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-[#1A1A1A] placeholder-gray-300 focus:outline-none focus:border-blue-500/50 transition-all"
            />
        )}
    </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{label}</label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
        >
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
    </div>
);

export default ManageProjects;
