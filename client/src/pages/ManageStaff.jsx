import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    UserPlus, Search, ChevronLeft, ChevronRight,
    Edit3, Trash2, ToggleLeft, ToggleRight, X, Loader2,
    Users, UserCheck, UserX, Building2, Phone,
    Calendar, Briefcase, DollarSign, AlertCircle, CheckCircle, Mail
} from 'lucide-react';

// ── Constants ──
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Support', 'Management', 'Other'];
const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'intern'];

// ════════════════════════════════════════
//  Main Component
// ════════════════════════════════════════
const ManageStaff = () => {
    // Data state
    const [staff, setStaff] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, byDepartment: [] });
    const [managers, setManagers] = useState([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [toast, setToast] = useState(null);

    // ── Fetch staff list ──
    const fetchStaff = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 10 });
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);
            if (deptFilter) params.append('department', deptFilter);

            const { data } = await api.get(`/staff?${params}`);
            setStaff(data.data.staff);
            setPagination(data.data.pagination);
        } catch (err) {
            showToast('Failed to fetch staff list', 'error');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, deptFilter]);

    // ── Fetch stats and managers ──
    const fetchMeta = useCallback(async () => {
        try {
            const [statsRes, managersRes] = await Promise.all([
                api.get('/staff/stats'),
                api.get('/staff/managers'),
            ]);
            setStats(statsRes.data.data);
            setManagers(managersRes.data.data);
        } catch (err) {
            console.error('Failed to fetch meta:', err);
        }
    }, []);

    useEffect(() => { fetchStaff(); fetchMeta(); }, [fetchStaff, fetchMeta]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => fetchStaff(1), 400);
        return () => clearTimeout(timer);
    }, [search, statusFilter, deptFilter]);

    // ── Toast notification ──
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Toggle status ──
    const handleToggleStatus = async (id, name) => {
        try {
            const { data } = await api.patch(`/staff/${id}/toggle-status`);
            showToast(data.message);
            fetchStaff(pagination.page);
            fetchMeta();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to toggle status', 'error');
        }
    };

    // ── Delete (soft) ──
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) return;
        try {
            const { data } = await api.delete(`/staff/${id}`);
            showToast(data.message);
            fetchStaff(pagination.page);
            fetchMeta();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete staff', 'error');
        }
    };

    // ── Open create/edit modal ──
    const openModal = (staffMember = null) => {
        setEditingStaff(staffMember);
        setShowModal(true);
    };

    // ── After save ──
    const handleSaved = () => {
        setShowModal(false);
        setEditingStaff(null);
        fetchStaff(pagination.page);
        fetchMeta();
    };

    return (
        <div className="space-y-10 animate-reveal">
            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed top-8 right-8 z-[100] flex items-center gap-4 px-6 py-4 rounded-3xl shadow-2xl glass-dark border border-white/10 text-sm font-bold uppercase tracking-widest animate-in slide-in-from-right-10 duration-500 ${toast.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    {toast.message}
                </div>
            )}

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white tracking-tight leading-none text-gradient truncate max-w-full">Staff</h1>
                    <p className="text-slate-500 mt-2 sm:mt-3 font-medium text-sm sm:text-lg italic">Manage your team members and their details.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="w-full md:w-auto mt-4 md:mt-0 group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-display font-bold rounded-2xl transition-all shadow-[0_20px_40px_-12px_rgba(79,70,229,0.3)] hover:-translate-y-1 active:translate-y-0"
                >
                    <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span>Add Staff</span>
                    <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                </button>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6">
                <StatCard icon={Users} label="Total Staff" value={stats.total} color="indigo" />
                <StatCard icon={UserCheck} label="Active" value={stats.active} color="emerald" />
                <StatCard icon={UserX} label="Inactive" value={stats.inactive} color="red" />
            </div>

            {/* ── Filters Bar ── */}
            <div className="glass p-2 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 shadow-xl mt-6">
                <div className="flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search staff members..."
                            className="w-full bg-transparent pl-14 pr-6 py-4.5 text-white placeholder-slate-600 focus:outline-none transition-all text-sm font-medium"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 px-2 pb-2 md:p-0">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full sm:w-auto px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-400 focus:outline-none focus:bg-white/10 hover:border-indigo-500/30 transition-all cursor-pointer"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="w-full sm:w-auto px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-400 focus:outline-none focus:bg-white/10 hover:border-indigo-500/30 transition-all cursor-pointer"
                        >
                            <option value="">All Departments</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Staff Table ── */}
            <div className="glass rounded-[2rem] md:rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden min-h-[500px] mt-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">Loading...</p>
                    </div>
                ) : staff.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 text-slate-600">
                        <div className="w-20 h-20 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center mb-8 ring-1 ring-white/5">
                            <Users className="w-10 h-10 opacity-40" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-white/50 tracking-tight">No staff found</h3>
                        <p className="text-sm mt-2 font-medium">No staff members match your search.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-white/[0.01] border-b border-white/5">
                                    <th className="text-left px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name</th>
                                    <th className="text-left px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Department</th>
                                    <th className="text-left px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</th>
                                    <th className="text-left px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manager</th>
                                    <th className="text-left px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="text-right px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {staff.map((s) => (
                                    <tr key={s._id} className="group hover:bg-white/[0.02] transition-colors cursor-default">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-display font-bold text-sm ring-1 ring-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)] group-hover:scale-110 transition-transform">
                                                    {s.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white group-hover:text-indigo-400 transition-colors text-lg tracking-tight">{s.name}</p>
                                                    <p className="text-[11px] font-bold text-slate-500 tracking-wider font-mono opacity-80 uppercase">{s.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider group-hover:border-slate-500/30 transition-colors">
                                                <Building2 className="w-3.5 h-3.5" />
                                                {s.department || '—'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 font-medium text-slate-400 text-sm italic">{s.designation || '—'}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                {s.reportingManager ? (
                                                    <>
                                                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-400 capitalize">
                                                            {s.reportingManager.name?.charAt(0)}
                                                        </div>
                                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{s.reportingManager.name}</span>
                                                    </>
                                                ) : <span className="text-slate-700 tracking-widest">None</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${s.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                                {s.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center justify-end gap-2 px-1">
                                                <button onClick={() => openModal(s)} className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300" title="Edit">
                                                    <Edit3 className="w-4.5 h-4.5" />
                                                </button>
                                                <button onClick={() => handleToggleStatus(s._id, s.name)} className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all duration-300" title={s.isActive ? 'Deactivate' : 'Restore'}>
                                                    {s.isActive ? <ToggleRight className="w-4.5 h-4.5" /> : <ToggleLeft className="w-4.5 h-4.5" />}
                                                </button>
                                                <button onClick={() => handleDelete(s._id, s.name)} className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300" title="Delete">
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
                    <div className="flex items-center justify-between px-10 py-8 border-t border-white/5 bg-white/[0.01]">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} staff
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchStaff(pagination.page - 1)}
                                disabled={!pagination.hasPrev}
                                className="p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-xs font-display font-bold text-white px-4 border-r border-l border-white/5">{pagination.page} <span className="text-slate-600 mx-2">/</span> {pagination.totalPages}</span>
                            <button
                                onClick={() => fetchStaff(pagination.page + 1)}
                                disabled={!pagination.hasNext}
                                className="p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Create/Edit Modal ── */}
            {showModal && (
                <StaffFormModal
                    staff={editingStaff}
                    managers={managers}
                    onClose={() => { setShowModal(false); setEditingStaff(null); }}
                    onSaved={handleSaved}
                    showToast={showToast}
                />
            )}
        </div>
    );
};

// ════════════════════════════════════════
//  Stat Card Component
// ════════════════════════════════════════
const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = {
        indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return (
        <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/5 shadow-2xl group flex flex-col gap-4 md:gap-6 hover:border-indigo-500/30 transition-all duration-500">
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center border ${colors[color]} ring-4 ring-black ring-opacity-10 group-hover:scale-110 transition-transform duration-500`}>
                <Icon className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
                <p className="text-4xl md:text-5xl font-display font-bold text-white tracking-tighter">{value}</p>
            </div>
        </div>
    );
};

// ════════════════════════════════════════
//  Staff Form Modal (Create / Edit)
// ════════════════════════════════════════
const StaffFormModal = ({ staff, managers, onClose, onSaved, showToast }) => {
    const isEdit = !!staff;
    const [form, setForm] = useState({
        name: staff?.name || '',
        email: staff?.email || '',
        password: '',
        phone: staff?.phone || '',
        alternatePhone: staff?.alternatePhone || '',
        designation: staff?.designation || '',
        department: staff?.department || '',
        joiningDate: staff?.joiningDate ? new Date(staff.joiningDate).toISOString().split('T')[0] : '',
        employmentType: staff?.employmentType || 'full-time',
        salaryBand: staff?.salaryBand || '',
        reportingManager: staff?.reportingManager?._id || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        if (!form.name || !form.email) {
            setError('Name and email are required');
            setSaving(false);
            return;
        }

        try {
            const payload = { ...form };
            if (isEdit && !payload.password) delete payload.password;
            if (!payload.reportingManager) payload.reportingManager = null;

            if (isEdit) {
                await api.put(`/staff/${staff._id}`, payload);
                showToast('Staff updated successfully');
            } else {
                await api.post('/staff', payload);
                showToast('Staff member added successfully');
            }
            onSaved();
        } catch (err) {
            setError(err.response?.data?.message || 'Could not save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl transition-opacity animate-in fade-in duration-500" onClick={onClose}></div>
            <div className="glass-dark border border-white/10 rounded-3xl md:rounded-[3.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] w-[95%] sm:w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-[120] animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">
                <div className="flex items-center justify-between px-10 py-8 border-b border-white/5">
                    <div>
                        <h2 className="text-3xl font-display font-bold text-white tracking-tight">{isEdit ? 'Edit Staff' : 'Add Staff'}</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2 italic">Fill in the details below</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-all duration-300">
                        <X className="w-5 h-5 mx-auto" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto">
                    {error && (
                        <div className="flex items-center gap-4 p-5 bg-red-500/5 border border-red-500/20 rounded-3xl text-red-400 text-[11px] font-bold uppercase tracking-widest animate-shake">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField icon={Users} label="Full Name" name="name" value={form.name} onChange={handleChange} required placeholder="Enter name" />
                        <FormField icon={Mail} label="Email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="Enter email" disabled={isEdit} />
                    </div>

                    <FormField icon={Briefcase} label={isEdit ? 'New Password (optional)' : 'Password'} name="password" type="password" value={form.password} onChange={handleChange} required={!isEdit} placeholder={isEdit ? '•••••••• (unchanged)' : 'Create a password'} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField icon={Phone} label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 890" />
                        <FormField icon={Phone} label="Alternate Phone" name="alternatePhone" value={form.alternatePhone} onChange={handleChange} placeholder="Optional" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField icon={Briefcase} label="Job Title" name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Project Manager" />
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5" /> Department
                            </label>
                            <select name="department" value={form.department} onChange={handleChange} className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-[13px] font-medium text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition-all">
                                <option value="" className="bg-slate-900 text-white">Select department</option>
                                {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-slate-900 text-white uppercase">{d}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField icon={Calendar} label="Joining Date" name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} className="inverted-date-picker" />
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Briefcase className="w-3.5 h-3.5" /> Employment Type
                            </label>
                            <select name="employmentType" value={form.employmentType} onChange={handleChange} className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-[13px] font-medium text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition-all">
                                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t} className="bg-slate-900 text-white uppercase">{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                        <FormField icon={DollarSign} label="Salary Band" name="salaryBand" value={form.salaryBand} onChange={handleChange} placeholder="e.g. Level 5" />
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" /> Reporting Manager
                            </label>
                            <select name="reportingManager" value={form.reportingManager} onChange={handleChange} className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-[13px] font-medium text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition-all">
                                <option value="" className="bg-slate-900 text-slate-600 tracking-widest">No manager</option>
                                {managers.filter(m => m._id !== staff?._id).map(m => (
                                    <option key={m._id} value={m._id} className="bg-slate-900 text-white">{m.name.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 md:gap-4 p-4 md:p-6 sticky bottom-0 bg-slate-950/20 backdrop-blur-md rounded-3xl border border-white/5 mt-auto">
                        <button type="button" onClick={onClose} className="w-full sm:w-auto px-8 py-4 bg-white/5 text-[11px] font-bold text-slate-400 uppercase tracking-widest rounded-2xl hover:bg-white/10 hover:text-white transition-all">Cancel</button>
                        <button type="submit" disabled={saving} className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-[11px] font-bold text-white uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-indigo-500 transition-all disabled:opacity-30">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (isEdit ? 'Save Changes' : 'Add Staff')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ════════════════════════════════════════
//  Reusable Form Field
// ════════════════════════════════════════
const FormField = ({ icon: Icon, label, name, type = 'text', value, onChange, required, placeholder, disabled, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
            {Icon && <Icon className="w-3.5 h-3.5 transition-colors group-focus-within:text-indigo-400" />}
            {label} {required && <span className="text-indigo-400 opacity-50">•</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder?.toUpperCase()}
            disabled={disabled}
            className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl text-[13px] font-medium text-white placeholder-slate-700/50 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-30 transition-all"
        />
    </div>
);

export default ManageStaff;
