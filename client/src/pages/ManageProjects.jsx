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
    Planned: 'bg-blue-50 text-blue-700',
    'In Progress': 'bg-emerald-50 text-emerald-700',
    'On Hold': 'bg-amber-50 text-amber-700',
    Completed: 'bg-green-50 text-green-700',
    Delayed: 'bg-red-50 text-red-700',
    Cancelled: 'bg-slate-100 text-slate-500',
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
                <div className={`fixed top-8 right-8 z-[100] flex items-center gap-4 px-6 py-4 rounded-3xl shadow-2xl glass-dark border border-white/10 text-sm font-bold uppercase tracking-widest animate-in slide-in-from-right-10 duration-500 ${toast.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    {toast.message}
                </div>
            )}

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-display font-bold text-white tracking-tight leading-none text-gradient">Project Logistics</h1>
                    <p className="text-slate-500 mt-3 font-medium text-lg italic">Strategic orchestration of active deployments.</p>
                </div>
                <button
                    onClick={() => { setEditingProject(null); setShowModal(true); }}
                    className="group relative inline-flex items-center gap-3 px-8 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                    Initialize Deployment
                </button>
            </div>

            {/* ── Dashboard Stats ── */}
            {dashboard && (
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    <MiniStat label="Global Queue" value={ov.total || 0} icon={FolderOpen} color="text-indigo-400" bgColor="bg-indigo-500/10" />
                    <MiniStat label="In Velocity" value={ov.active || 0} icon={TrendingUp} color="text-emerald-400" bgColor="bg-emerald-500/10" />
                    <MiniStat label="Archived / Final" value={ov.completed || 0} icon={CheckCircle} color="text-sky-400" bgColor="bg-sky-500/10" />
                    <MiniStat label="Bottleneck" value={ov.delayed || 0} icon={AlertTriangle} color="text-red-400" bgColor="bg-red-500/10" />
                    <MiniStat label="Stasis" value={ov.onHold || 0} icon={Clock} color="text-amber-400" bgColor="bg-amber-500/10" />
                    <MiniStat label="Expunged" value={ov.deleted || 0} icon={Trash2} color="text-slate-500" bgColor="bg-slate-500/10" />
                </div>
            )}

            {/* ── Control Center (Filters) ── */}
            <div className="glass p-2 rounded-[2rem] border border-white/5 shadow-xl flex flex-col lg:flex-row gap-2">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Query deployments by code or designation..."
                        className="w-full bg-transparent pl-14 pr-6 py-4.5 text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 focus:outline-none focus:bg-white/10 hover:border-indigo-500/30 transition-all cursor-pointer"
                    >
                        <option value="" className="bg-slate-900">All Status</option>
                        {STATUSES.map((s) => <option key={s} value={s} className="bg-slate-900 uppercase">{s}</option>)}
                    </select>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 focus:outline-none focus:bg-white/10 hover:border-indigo-500/30 transition-all cursor-pointer"
                    >
                        <option value="" className="bg-slate-900">All Priority</option>
                        {PRIORITIES.map((p) => <option key={p} value={p} className="bg-slate-900 uppercase">{p}</option>)}
                    </select>
                </div>
            </div>

            {/* ── Main Data Mesh ── */}
            <div className="glass rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden min-h-[500px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">Synchronizing Asset Logs...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 text-slate-600">
                        <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 ring-1 ring-white/10 shadow-inner">
                            <FolderOpen className="w-10 h-10 opacity-30" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-white/50 tracking-tight">Zero Deployments</h3>
                        <p className="text-sm mt-3 font-medium">No active files matching the current parameters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-white/[0.01] border-b border-white/5">
                                    <th className="text-left px-10 py-8 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Deployment</th>
                                    <th className="text-left px-8 py-8 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Command</th>
                                    <th className="text-left px-8 py-8 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Vector State</th>
                                    <th className="text-left px-8 py-8 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Threat Lev.</th>
                                    <th className="text-left px-8 py-8 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Timeline</th>
                                    <th className="text-right px-10 py-8 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">System Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {projects.map((p) => (
                                    <tr key={p._id} className="group hover:bg-white/[0.02] transition-all duration-300">
                                        <td className="px-10 py-7">
                                            <div className="flex flex-col">
                                                <p className="font-bold text-white group-hover:text-indigo-400 transition-colors text-lg tracking-tight leading-tight">{p.projectName}</p>
                                                <p className="text-[10px] font-bold text-slate-500 mt-1 font-mono uppercase tracking-widest">{p.projectCode} // {p.projectCategory || 'General Operative'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7 font-semibold text-slate-400 italic text-[13px]">{p.projectManager?.name || '---'}</td>
                                        <td className="px-8 py-7">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest ${STATUS_COLORS[p.projectStatus]?.replace('bg-', 'bg-transparent border border-').replace('text-', 'text-') || 'border-slate-500/20 text-slate-400'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${p.projectStatus === 'In Progress' ? 'bg-emerald-400 animate-pulse' : 'bg-current'}`}></span>
                                                {p.projectStatus}
                                            </span>
                                        </td>
                                        <td className="px-8 py-7">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${PRIORITY_COLORS[p.priority]}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${p.priority === 'High' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-current opacity-50'}`}></span>
                                                {p.priority}
                                            </span>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                    <Calendar className="w-3 h-3 text-indigo-500/50" />
                                                    {p.startDate ? new Date(p.startDate).toLocaleDateString() : '---'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500/70 uppercase tracking-tighter">
                                                    <TrendingUp className="w-3 h-3" />
                                                    {p.expectedCompletion ? new Date(p.expectedCompletion).toLocaleDateString() : '---'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-7">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => navigate(`/admin/projects/${p._id}/updates`)} className="group/btn flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300" title="Updates">
                                                    <MessageSquare className="w-4 h-4" />
                                                    <span className="text-[9px] font-bold uppercase tracking-widest hidden lg:block">Updates</span>
                                                </button>
                                                <button onClick={() => openEdit(p._id)} className="p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300" title="Modify">
                                                    <Edit3 className="w-4.5 h-4.5" />
                                                </button>
                                                <button onClick={() => handleDelete(p._id, p.projectName)} className="p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300" title="Decommission">
                                                    <Trash2 className="w-4.5 h-4.5" />
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
                    <div className="flex items-center justify-between px-10 py-10 border-t border-white/5 bg-white/[0.01]">
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Deployment Page {pagination.page} <span className="text-slate-800 mx-2">//</span> {pagination.totalPages}</p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchProjects(pagination.page - 1)}
                                disabled={!pagination.hasPrev}
                                className="p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-10 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => fetchProjects(pagination.page + 1)}
                                disabled={!pagination.hasNext}
                                className="p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-10 transition-all"
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
    <div className="glass p-5 rounded-[2.5rem] border border-white/5 shadow-xl group hover:border-indigo-500/30 transition-all duration-500 flex items-center gap-5">
        <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center border border-white/5 ring-1 ring-white/5 group-hover:scale-110 transition-transform`}>
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-0.5 group-hover:text-slate-400 transition-colors">{label}</p>
            <p className="text-2xl font-display font-bold text-white tracking-tighter">{value}</p>
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
        if (!form.projectName.trim()) { setError('Deployment designation is mandatory'); setSaving(false); return; }
        try {
            const payload = { ...form };
            if (!payload.projectManager) payload.projectManager = null;
            if (isEdit) {
                await api.put(`/projects/${project._id}`, payload);
                showToast('Asset modifications synchronized');
            } else {
                await api.post('/projects', payload);
                showToast('New deployment initialized');
            }
            onSaved();
        } catch (err) {
            setError(err.response?.data?.message || 'Synchronous failure in data push');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-500" onClick={onClose}></div>
            <div className="glass-dark border border-white/10 rounded-[3.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative z-[120] animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">
                <div className="flex items-center justify-between px-10 py-10 border-b border-white/5 bg-white/[0.01]">
                    <div>
                        <h2 className="text-3xl font-display font-bold text-white tracking-tight">{isEdit ? 'Re-Configure Project' : 'Initiate Project'}</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2 italic font-mono">{isEdit ? project.projectCode : 'System Protocol: Deployment Initialization'}</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-all duration-300">
                        <X className="w-5 h-5 mx-auto" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-10 py-10 space-y-8 overflow-y-auto">
                    {error && (
                        <div className="flex items-center gap-4 p-5 bg-red-500/5 border border-red-500/20 rounded-3xl text-red-400 text-[11px] font-bold uppercase tracking-widest animate-shake">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Field label="Deployment Designation" name="projectName" value={form.projectName} onChange={handleChange} icon={FolderOpen} required placeholder="PROJECT_X" />
                        <Field label="Sector Category" name="projectCategory" value={form.projectCategory} onChange={handleChange} icon={Briefcase} placeholder="LOGISTICS_CORE" />
                    </div>

                    <Field label="Manifest / Description" name="description" value={form.description} onChange={handleChange} textarea placeholder="System objectives and mission details..." />
                    <Field label="Target Grid / Site Address" name="siteAddress" value={form.siteAddress} onChange={handleChange} icon={MapPin} placeholder="GEOGRAPHICAL_COORDINATES" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Field label="Launch Date" name="startDate" type="date" value={form.startDate} onChange={handleChange} icon={Calendar} />
                        <Field label="Est. Completion" name="expectedCompletion" type="date" value={form.expectedCompletion} onChange={handleChange} icon={Calendar} />
                        {isEdit && <Field label="Final Status" name="actualCompletion" type="date" value={form.actualCompletion} onChange={handleChange} icon={Calendar} />}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SelectField label="Vector State" name="projectStatus" value={form.projectStatus} onChange={handleChange} options={STATUSES} />
                        <SelectField label="Threat Priority" name="priority" value={form.priority} onChange={handleChange} options={PRIORITIES} />
                        <SelectField label="Risk Parameter" name="riskLevel" value={form.riskLevel} onChange={handleChange} options={['Low', 'Medium', 'High']} />
                    </div>

                    {form.projectStatus === 'Delayed' && (
                        <Field label="Interference Report" name="delayReason" value={form.delayReason} onChange={handleChange} textarea placeholder="Outline the cause of synchronization delay..." />
                    )}

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            Command Authority
                        </label>
                        <select name="projectManager" value={form.projectManager} onChange={handleChange} className="w-full px-6 py-5 bg-white/5 border border-white/5 rounded-2xl text-[13px] font-medium text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer">
                            <option value="" className="bg-slate-900">ASSIGN COMMANDER</option>
                            {staffList.map(s => <option key={s._id} value={s._id} className="bg-slate-900">{s.name.toUpperCase()} — {s.designation?.toUpperCase() || 'AGENT'}</option>)}
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            Assigned Operatives ({form.assignedStaff.length})
                        </label>
                        <div className="flex flex-wrap gap-3 p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] min-h-[100px]">
                            {staffList.length === 0 ? (
                                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.2em] italic">No active operatives in database</p>
                            ) : staffList.map(s => {
                                const selected = form.assignedStaff.includes(s._id);
                                return (
                                    <button
                                        key={s._id}
                                        type="button"
                                        onClick={() => toggleStaff(s._id)}
                                        className={`px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${selected ? 'bg-indigo-600 border-indigo-500/50 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                    >
                                        {s.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-5 p-5 bg-white/[0.01] border-t border-white/5 -mx-10 -mb-10 mt-10 px-10 py-8 sticky bottom-0 backdrop-blur-md">
                        <button type="button" onClick={onClose} className="px-10 py-5 bg-white/5 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-2xl hover:bg-white/10 hover:text-white transition-all">Abort Protocol</button>
                        <button type="submit" disabled={saving} className="px-12 py-5 bg-indigo-600 text-[11px] font-bold text-white uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-indigo-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isEdit ? 'Sync Deployment' : 'Launch Protocol')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Field = ({ label, name, type = 'text', value, onChange, icon: Icon, required, placeholder, textarea }) => (
    <div className="space-y-3 group">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
            {Icon && <Icon className="w-3.5 h-3.5 transition-colors group-focus-within:text-indigo-400" />}
            {label} {required && <span className="text-indigo-400 opacity-50">•</span>}
        </label>
        {textarea ? (
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder?.toUpperCase()}
                rows={4}
                className="w-full px-6 py-5 bg-white/5 border border-white/5 rounded-3xl text-[13px] font-medium text-white placeholder-slate-800 resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono"
            />
        ) : (
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder?.toUpperCase()}
                className="w-full px-6 py-5 bg-white/5 border border-white/5 rounded-2xl text-[13px] font-medium text-white placeholder-slate-800 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
        )}
    </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className="w-full px-6 py-5 bg-white/5 border border-white/5 rounded-2xl text-[13px] font-medium text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
        >
            {options.map((o) => <option key={o} value={o} className="bg-slate-900 uppercase">{o}</option>)}
        </select>
    </div>
);

export default ManageProjects;
