import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    UserPlus, Search, ChevronLeft, ChevronRight,
    Edit3, Trash2, ToggleLeft, ToggleRight, X, Loader2,
    Users, UserCheck, UserX, Building2, Phone,
    Calendar, Briefcase, DollarSign, AlertCircle, CheckCircle, Mail,
    ChevronDown
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
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }
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
        setDeleteConfirm({ id, name });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            const { data } = await api.delete(`/staff/${deleteConfirm.id}`);
            showToast(data.message);
            fetchStaff(pagination.page);
            fetchMeta();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete staff', 'error');
        } finally {
            setDeleteConfirm(null);
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
                    <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1A1A1A] tracking-tight leading-none">Operational Staff</h1>
                    <p className="text-gray-500 mt-2 font-medium text-base leading-relaxed">System-wide personnel registry and permissions hub.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="w-full md:w-auto px-8 py-4 blue-gradient text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all btn-shadow hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    <UserPlus className="w-5 h-5" />
                    <span>Onboard Staff</span>
                </button>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6">
                <StatCard icon={Users} label="Total Assets" value={stats.total} color="blue" />
                <StatCard icon={UserCheck} label="Operational" value={stats.active} color="emerald" />
                <StatCard icon={UserX} label="Deactivated" value={stats.inactive} color="red" />
            </div>

            {/* ── Filters Bar ── */}
            <div className="bg-white p-2 rounded-[24px] shadow-lg border border-gray-100 mt-6">
                <div className="flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, email or designation..."
                            className="w-full bg-gray-50/50 pl-14 pr-6 py-4.5 text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:bg-gray-50 focus:ring-4 focus:ring-blue-500/5 rounded-2xl transition-all text-sm font-medium"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 px-2 pb-2 md:p-0">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full sm:w-auto px-6 py-4 bg-gray-50/80 border border-gray-100 rounded-[18px] text-[10px] font-bold uppercase tracking-widest text-[#2C3E50] focus:outline-none focus:bg-white transition-all cursor-pointer appearance-none"
                        >
                            <option value="">All States</option>
                            <option value="active">Active Assets</option>
                            <option value="inactive">Inactive Assets</option>
                        </select>
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="w-full sm:w-auto px-6 py-4 bg-gray-50/80 border border-gray-100 rounded-[18px] text-[10px] font-bold uppercase tracking-widest text-[#2C3E50] focus:outline-none focus:bg-white transition-all cursor-pointer appearance-none"
                        >
                            <option value="">All Units</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Staff Table ── */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden min-h-[500px] mt-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Compiling Personnel...</p>
                    </div>
                ) : staff.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 text-gray-400">
                        <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 opacity-20" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-[#1A1A1A] opacity-30 tracking-tight">No Staff Found</h3>
                        <p className="text-sm mt-2 font-medium italic">Try broader search parameters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="text-left px-10 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Personnel Identity</th>
                                    <th className="text-left px-8 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Organisation Unit</th>
                                    <th className="text-left px-8 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Designation</th>
                                    <th className="text-left px-8 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Direct Supervisor</th>
                                    <th className="text-left px-8 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current State</th>
                                    <th className="text-right px-10 py-7 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {staff.map((s) => (
                                    <tr key={s._id} className="group hover:bg-gray-50 transition-colors duration-300">
                                        <td className="px-10 py-7">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100/50 text-blue-600 flex items-center justify-center font-display font-bold text-sm group-hover:scale-110 transition-transform">
                                                    {s.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#1A1A1A] group-hover:text-blue-600 transition-colors text-base tracking-tight">{s.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-widest group-hover:text-blue-600 transition-colors">
                                                <Building2 className="w-3.5 h-3.5" />
                                                {s.department || '—'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-7 font-bold text-gray-600 text-[13px]">{s.designation || '—'}</td>
                                        <td className="px-8 py-7">
                                            <div className="flex items-center gap-2">
                                                {s.reportingManager ? (
                                                    <>
                                                        <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase">
                                                            {s.reportingManager.name?.charAt(0)}
                                                        </div>
                                                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{s.reportingManager.name}</span>
                                                    </>
                                                ) : <span className="text-gray-300 text-[10px] font-bold uppercase tracking-widest">Top Level</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${s.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-current animate-pulse' : 'bg-current'}`}></div>
                                                {s.isActive ? 'Operational' : 'Deactivated'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-7">
                                            <div className="flex items-center justify-end gap-3">
                                                <button onClick={() => openModal(s)} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Edit">
                                                    <Edit3 className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleToggleStatus(s._id, s.name)} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all" title={s.isActive ? 'Deactivate' : 'Restore'}>
                                                    {s.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                                </button>
                                                <button onClick={() => handleDelete(s._id, s.name)} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
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
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Page {pagination.page} <span className="text-gray-200 mx-2">/</span> {pagination.totalPages}
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchStaff(pagination.page - 1)}
                                disabled={!pagination.hasPrev}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-blue-600 transition-all shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => fetchStaff(pagination.page + 1)}
                                disabled={!pagination.hasNext}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-blue-600 transition-all shadow-sm"
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

            {deleteConfirm && (
                <ConfirmationModal
                    title="Deactivate Staff"
                    message={`Are you sure you want to deactivate ${deleteConfirm.name}? This will revoke their access.`}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteConfirm(null)}
                    confirmText="Deactivate"
                    isDestructive
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
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        red: 'bg-red-50 text-red-600 border-red-100',
    };
    return (
        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-xl group flex flex-col gap-6 hover:border-blue-500/20 transition-all duration-500">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${colors[color]} group-hover:scale-110 transition-transform duration-500`}>
                <Icon className="w-7 h-7" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl md:text-4xl font-display font-bold text-[#1A1A1A] tracking-tighter leading-none">{value}</p>
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

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

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
        <div className="fixed inset-0 z-[150] flex justify-center items-start p-4">
            <div className="absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="bg-white w-[94%] max-w-[460px] h-auto max-h-[92vh] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col relative z-[160] animate-in slide-in-from-top-4 duration-300 overflow-hidden">
                <div className="flex items-center justify-between p-[22px] pb-3 shrink-0 bg-white">
                    <h2 className="text-[20px] font-bold text-[#2C3E50] tracking-tight">
                        {isEdit ? 'Modify Profile' : 'Add Staff'}
                    </h2>
                    <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-red-500 transition-all font-bold">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 bg-white">
                    <div className="flex-1 overflow-y-auto scrollbar-hide px-[22px] pb-2 space-y-4 md:space-y-5">
                    {error && (
                        <div className="flex items-center gap-4 p-5 animate-shake bg-red-50 border border-red-100 rounded-2xl text-red-500 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                        <FormField label="Full Name" name="name" value={form.name} onChange={handleChange} required placeholder="Enter name" />
                        <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="Enter email" disabled={isEdit} />

                        <FormField label={isEdit ? 'New Password' : 'Password'} name="password" type="password" value={form.password} onChange={handleChange} required={!isEdit} placeholder={isEdit ? '••••••••' : 'Create a password'} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 890" />
                            <FormField label="Alt. Phone" name="alternatePhone" value={form.alternatePhone} onChange={handleChange} placeholder="Optional" />
                        </div>

                        <FormField label="Professional Title" name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Lead Engineer" />
                        
                        <div className="space-y-1.5 mb-5">
                            <label className="text-[15px] font-bold text-[#34495E] ml-1">Organisation Unit</label>
                            <div className="relative">
                                <select name="department" value={form.department} onChange={handleChange} className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-[14px] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer appearance-none">
                                    <option value="">Select department</option>
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <FormField label="Induction Date" name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} />
                        
                        <div className="space-y-1.5 mb-5">
                            <label className="text-[15px] font-bold text-[#34495E] ml-1">Engagement Type</label>
                            <div className="relative">
                                <select name="employmentType" value={form.employmentType} onChange={handleChange} className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-[14px] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer appearance-none">
                                    {EMPLOYMENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <FormField label="Compensation Scale" name="salaryBand" value={form.salaryBand} onChange={handleChange} placeholder="e.g. Band A-1" />
                        
                        <div className="space-y-1.5 mb-5">
                            <label className="text-[15px] font-bold text-[#34495E] ml-1">Hierarchy Lead</label>
                            <div className="relative">
                                <select name="reportingManager" value={form.reportingManager} onChange={handleChange} className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-[14px] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer appearance-none">
                                    <option value="">Direct to Board</option>
                                    {managers.filter(m => m._id !== staff?._id).map(m => (
                                        <option key={m._id} value={m._id}>{m.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-[22px] pt-3 bg-white border-t border-gray-50 flex-shrink-0">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-4.5 blue-gradient text-white font-bold rounded-[16px] shadow-lg shadow-blue-200 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : (isEdit ? 'Update Staff Profile' : 'Confirm & Add Staff')}
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
const FormField = ({ label, name, type = 'text', value, onChange, placeholder, required, disabled }) => (
    <div className="space-y-1.5 mb-5 relative">
        <label className="text-[15px] font-bold text-[#34495E] ml-1">{label}</label>
        <div className="relative">
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-[14px] text-sm font-medium text-[#1A1A1A] placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all disabled:opacity-30"
            />
            {type === 'date' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
            )}
        </div>
    </div>
);

const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText, isDestructive }) => (
    <div className="fixed inset-0 z-[300] flex justify-center items-start p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onCancel}></div>
        <div className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-[94%] max-w-[420px] relative z-[310] animate-in slide-in-from-top-4 duration-300 p-8 text-center">
            <div className={`w-16 h-16 rounded-2xl ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'} flex items-center justify-center mx-auto mb-6`}>
                {isDestructive ? <Trash2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{title}</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">{message}</p>
            <div className="flex flex-col gap-3">
                <button 
                    onClick={onConfirm}
                    className={`w-full py-4 ${isDestructive ? 'bg-red-500 shadow-red-200' : 'blue-gradient shadow-blue-200'} text-white font-bold rounded-[16px] shadow-lg hover:opacity-90 active:scale-[0.98] transition-all`}
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

export default ManageStaff;
