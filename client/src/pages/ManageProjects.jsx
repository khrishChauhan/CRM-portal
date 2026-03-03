import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    Plus, Search, ChevronLeft, ChevronRight, Loader2, FolderOpen,
    Edit3, Trash2, X, AlertCircle, CheckCircle, Calendar, MapPin,
    Clock, AlertTriangle, Briefcase, TrendingUp
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
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
                    <p className="text-slate-500 mt-1">Manage all projects across your organization</p>
                </div>
                <button onClick={() => { setEditingProject(null); setShowModal(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition shadow-sm">
                    <Plus className="w-5 h-5" /> New Project
                </button>
            </div>

            {dashboard && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <MiniStat label="Total" value={ov.total || 0} icon={FolderOpen} color="bg-blue-500" />
                    <MiniStat label="Active" value={ov.active || 0} icon={TrendingUp} color="bg-emerald-500" />
                    <MiniStat label="Completed" value={ov.completed || 0} icon={CheckCircle} color="bg-green-500" />
                    <MiniStat label="Delayed" value={ov.delayed || 0} icon={AlertTriangle} color="bg-red-500" />
                    <MiniStat label="On Hold" value={ov.onHold || 0} icon={Clock} color="bg-amber-500" />
                    <MiniStat label="Deleted" value={ov.deleted || 0} icon={Trash2} color="bg-slate-400" />
                </div>
            )}

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white">
                    <option value="">All Status</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white">
                    <option value="">All Priority</option>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <FolderOpen className="w-16 h-16 mb-4 text-slate-200" />
                        <p className="text-lg font-medium">No projects found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="text-left px-6 py-4 font-semibold text-slate-600">Project</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-600">Manager</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-600">Status</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-600">Priority</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-600">Timeline</th>
                                    <th className="text-right px-6 py-4 font-semibold text-slate-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {projects.map(p => (
                                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-slate-800">{p.projectName}</p>
                                            <p className="text-xs text-slate-400">{p.projectCode} · {p.projectCategory || 'Uncategorized'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm">{p.projectManager?.name || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[p.projectStatus]}`}>{p.projectStatus}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-semibold text-xs ${PRIORITY_COLORS[p.priority]}`}>● {p.priority}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {p.startDate ? new Date(p.startDate).toLocaleDateString() : '—'} → {p.expectedCompletion ? new Date(p.expectedCompletion).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(p._id)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600 transition"><Edit3 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(p._id, p.projectName)} className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => fetchProjects(pagination.page - 1)} disabled={!pagination.hasPrev} className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition"><ChevronLeft className="w-4 h-4" /></button>
                            <button onClick={() => fetchProjects(pagination.page + 1)} disabled={!pagination.hasNext} className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition"><ChevronRight className="w-4 h-4" /></button>
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

const MiniStat = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${color} text-white flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
    </div>
);

// ── Project Form Modal — NO client assignment ──
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
                showToast('Project updated');
            } else {
                await api.post('/projects', payload);
                showToast('Project created');
            }
            onSaved();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save project');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Project' : 'Create New Project'}</h2>
                        {isEdit && <p className="text-sm text-slate-400">{project.projectCode}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                    {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Project Name *" name="projectName" value={form.projectName} onChange={handleChange} icon={FolderOpen} required />
                        <Field label="Category" name="projectCategory" value={form.projectCategory} onChange={handleChange} icon={Briefcase} placeholder="e.g. Construction" />
                    </div>
                    <Field label="Description" name="description" value={form.description} onChange={handleChange} textarea />
                    <Field label="Site Address" name="siteAddress" value={form.siteAddress} onChange={handleChange} icon={MapPin} />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Start Date" name="startDate" type="date" value={form.startDate} onChange={handleChange} icon={Calendar} />
                        <Field label="Expected Completion" name="expectedCompletion" type="date" value={form.expectedCompletion} onChange={handleChange} icon={Calendar} />
                        {isEdit && <Field label="Actual Completion" name="actualCompletion" type="date" value={form.actualCompletion} onChange={handleChange} icon={Calendar} />}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SelectField label="Status" name="projectStatus" value={form.projectStatus} onChange={handleChange} options={STATUSES} />
                        <SelectField label="Priority" name="priority" value={form.priority} onChange={handleChange} options={PRIORITIES} />
                        <SelectField label="Risk Level" name="riskLevel" value={form.riskLevel} onChange={handleChange} options={['Low', 'Medium', 'High']} />
                    </div>

                    {form.projectStatus === 'Delayed' && (
                        <Field label="Delay Reason" name="delayReason" value={form.delayReason} onChange={handleChange} textarea placeholder="Explain the delay..." />
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Project Manager</label>
                        <select name="projectManager" value={form.projectManager} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white">
                            <option value="">No Manager</option>
                            {staffList.map(s => <option key={s._id} value={s._id}>{s.name} — {s.designation || s.department || 'Staff'}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Assigned Staff ({form.assignedStaff.length})</label>
                        <div className="flex flex-wrap gap-2 p-3 border border-slate-200 rounded-xl min-h-[44px]">
                            {staffList.length === 0 ? (
                                <p className="text-xs text-slate-400">No staff available</p>
                            ) : staffList.map(s => {
                                const selected = form.assignedStaff.includes(s._id);
                                return (
                                    <button key={s._id} type="button" onClick={() => toggleStaff(s._id)}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${selected ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{s.name}</button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50">
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isEdit ? 'Update' : 'Create'} Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Field = ({ label, name, type = 'text', value, onChange, icon: Icon, required, placeholder, textarea }) => (
    <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            {Icon && <Icon className="w-4 h-4 text-slate-400" />}
            {label}
        </label>
        {textarea ? (
            <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
        ) : (
            <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
        )}
    </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
    <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        <select name={name} value={value} onChange={onChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    </div>
);

export default ManageProjects;
