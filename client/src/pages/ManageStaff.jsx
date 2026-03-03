import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    UserPlus, Search, Filter, ChevronLeft, ChevronRight,
    Edit3, Trash2, ToggleLeft, ToggleRight, X, Loader2,
    Users, UserCheck, UserX, Building2, Phone, Mail,
    Calendar, Briefcase, DollarSign, AlertCircle, CheckCircle
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
        <div className="space-y-6">
            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top duration-300 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Manage Staff</h1>
                    <p className="text-slate-500 mt-1">Add, edit and manage your team members</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                    <UserPlus className="w-5 h-5" />
                    Add Staff
                </button>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={Users} label="Total Staff" value={stats.total} color="blue" />
                <StatCard icon={UserCheck} label="Active" value={stats.active} color="green" />
                <StatCard icon={UserX} label="Inactive" value={stats.inactive} color="red" />
            </div>

            {/* ── Filters Bar ── */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, email, or department..."
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">All Departments</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Staff Table ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : staff.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Users className="w-16 h-16 mb-4 text-slate-200" />
                        <p className="text-lg font-medium">No staff members found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="text-left px-6 py-4 font-semibold text-slate-600">Name</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-600">Department</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-600">Designation</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-600">Manager</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-600">Status</th>
                                    <th className="text-right px-6 py-4 font-semibold text-slate-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {staff.map((s) => (
                                    <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                                                    {s.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{s.name}</p>
                                                    <p className="text-xs text-slate-400">{s.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                                                <Building2 className="w-3 h-3" />
                                                {s.department || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{s.designation || '—'}</td>
                                        <td className="px-6 py-4 text-slate-600 text-xs">
                                            {s.reportingManager ? s.reportingManager.name : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-500' : 'bg-red-400'}`}></span>
                                                {s.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openModal(s)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600 transition" title="Edit">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleToggleStatus(s._id, s.name)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition" title={s.isActive ? 'Deactivate' : 'Activate'}>
                                                    {s.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => handleDelete(s._id, s.name)} className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
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
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-sm text-slate-500">
                            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchStaff(pagination.page - 1)}
                                disabled={!pagination.hasPrev}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium text-slate-600 px-2">{pagination.page} / {pagination.totalPages}</span>
                            <button
                                onClick={() => fetchStaff(pagination.page + 1)}
                                disabled={!pagination.hasNext}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                <ChevronRight className="w-4 h-4" />
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
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
    };
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${colors[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
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

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        // Client-side validation
        if (!form.name || !form.email) {
            setError('Name and email are required');
            setSaving(false);
            return;
        }
        if (!isEdit && (!form.password || form.password.length < 6)) {
            setError('Password must be at least 6 characters');
            setSaving(false);
            return;
        }

        try {
            const payload = { ...form };
            // Don't send empty password on edit
            if (isEdit && !payload.password) delete payload.password;
            // Don't send empty reportingManager
            if (!payload.reportingManager) payload.reportingManager = null;

            if (isEdit) {
                await api.put(`/staff/${staff._id}`, payload);
                showToast('Staff member updated successfully');
            } else {
                await api.post('/staff', payload);
                showToast('Staff member created successfully');
            }
            onSaved();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save staff member');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Staff Member' : 'Add New Staff'}</h2>
                        <p className="text-sm text-slate-500 mt-0.5">{isEdit ? `Editing ${staff.name}` : 'Fill in the details below'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Row: Name + Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField icon={Users} label="Full Name" name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
                        <FormField icon={Mail} label="Email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="john@company.com" disabled={isEdit} />
                    </div>

                    {/* Row: Password (required for create, optional for edit) */}
                    <FormField
                        icon={Briefcase}
                        label={isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        required={!isEdit}
                        placeholder={isEdit ? '••••••••' : 'Min 6 characters'}
                    />

                    {/* Row: Phone + Alt Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField icon={Phone} label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
                        <FormField icon={Phone} label="Alternate Phone" name="alternatePhone" value={form.alternatePhone} onChange={handleChange} placeholder="+91 12345 67890" />
                    </div>

                    {/* Row: Designation + Department */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField icon={Briefcase} label="Designation" name="designation" value={form.designation} onChange={handleChange} placeholder="Senior Developer" />
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-slate-400" />
                                Department
                            </label>
                            <select name="department" value={form.department} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option value="">Select Department</option>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Row: Joining Date + Employment Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField icon={Calendar} label="Joining Date" name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} />
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                <Briefcase className="w-4 h-4 text-slate-400" />
                                Employment Type
                            </label>
                            <select name="employmentType" value={form.employmentType} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Row: Salary Band + Reporting Manager */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField icon={DollarSign} label="Salary Band" name="salaryBand" value={form.salaryBand} onChange={handleChange} placeholder="e.g. Band A" />
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-slate-400" />
                                Reporting Manager
                            </label>
                            <select name="reportingManager" value={form.reportingManager} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option value="">No Manager</option>
                                {managers
                                    .filter(m => m._id !== staff?._id) // Can't be own manager
                                    .map(m => (
                                        <option key={m._id} value={m._id}>
                                            {m.name} — {m.designation || m.department || 'Staff'}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {isEdit ? 'Update Staff' : 'Create Staff'}
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
const FormField = ({ icon: Icon, label, name, type = 'text', value, onChange, required, placeholder, disabled }) => (
    <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            {Icon && <Icon className="w-4 h-4 text-slate-400" />}
            {label}
            {required && <span className="text-red-400">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 transition"
        />
    </div>
);

export default ManageStaff;
