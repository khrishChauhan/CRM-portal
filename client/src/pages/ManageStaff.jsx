import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import {
    UserPlus, Search, ChevronLeft, ChevronRight, Plus,
    Edit3, ToggleLeft, ToggleRight, X, Loader2,
    Users, UserCheck, UserX, Building2, Phone,
    Briefcase, AlertCircle, CheckCircle, ChevronDown, Trash2
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
    const [searchParams, setSearchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
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
    const [suspendConfirm, setSuspendConfirm] = useState(null); // { id, name, intent }

    const openSuspendModal = (id, name, intent) => {
        setSuspendConfirm({ id, name, intent });
    };

    const confirmToggleStatus = async () => {
        if (!suspendConfirm) return;
        try {
            const { data } = await api.patch(`/staff/${suspendConfirm.id}/toggle-status`);
            showToast(`Staff ${suspendConfirm.intent === 'suspend' ? 'suspended' : 'activated'} successfully`);
            fetchStaff(pagination.page);
            fetchMeta();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to toggle status', 'error');
        } finally {
            setSuspendConfirm(null);
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
                    <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1A1A1A] tracking-tight leading-none">Operational Staff</h1>
                    <p className="text-gray-500 mt-2 font-medium text-base leading-relaxed">System-wide personnel registry and permissions hub.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="w-full md:w-auto px-8 py-4 accent-gradient text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#f86a1f]/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    <UserPlus className="w-5 h-5" />
                    <span>Onboard Staff</span>
                </button>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
                <StatCard icon={Users} label="Total Assets" value={stats.total} color="secondary" onClick={() => { setStatusFilter(''); setSearchParams({}); }} />
                <StatCard icon={UserCheck} label="Operational" value={stats.active} color="secondary" onClick={() => { setStatusFilter('active'); setSearchParams({ status: 'active' }); }} />
                <StatCard icon={UserX} label="Suspended" value={stats.inactive} color="neutral" onClick={() => { setStatusFilter('suspended'); setSearchParams({ status: 'suspended' }); }} />
            </div>

            {/* ── Filters Bar ── */}
            <div className="bg-white p-2 rounded-[24px] shadow-lg border border-gray-100 mt-6">
                <div className="flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#173d9f] transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, email or designation..."
                            className="w-full bg-[#faf8f8] border border-transparent focus:bg-white focus:ring-4 focus:ring-[#173d9f]/10 focus:border-[#173d9f]/30 pl-14 pr-6 py-4.5 text-[#1A1A1A] placeholder-gray-400 rounded-2xl transition-all text-sm font-medium"
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
                            <option value="suspended">Suspended Assets</option>
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

            {/* ── Staff Swipeable Cards ── */}
            <div className="mt-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 sm:py-40 bg-white rounded-[32px] border border-gray-100 shadow-2xl min-h-[300px]">
                        <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-[#173d9f] mb-4" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Compiling Personnel...</p>
                    </div>
                ) : staff.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-32 md:py-40 px-4 text-center text-gray-400 bg-white rounded-[32px] border border-gray-100 shadow-2xl min-h-[300px]">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-2xl md:rounded-[32px] flex items-center justify-center mb-4 md:mb-6">
                            <Users className="w-8 h-8 md:w-10 md:h-10 opacity-20" />
                        </div>
                        <h3 className="text-lg md:text-xl font-display font-bold text-[#1A1A1A] opacity-30 tracking-tight">{statusFilter || deptFilter || search ? 'No results found for this filter' : 'No staff available'}</h3>
                        <p className="text-[13px] md:text-sm mt-1 md:mt-2 font-medium italic mb-6">{statusFilter || deptFilter || search ? 'Try adjusting your search or filters.' : "Let's get your team on board."}</p>
                        {statusFilter || deptFilter || search ? (
                            <button onClick={() => { setStatusFilter(''); setDeptFilter(''); setSearch(''); setSearchParams({}); }} className="px-6 py-3 bg-[#faf8f8] text-gray-600 rounded-[14px] font-bold text-[10px] uppercase tracking-[0.15em] transition-all active:scale-95 flex items-center gap-2 border border-gray-100">
                                Clear Filters
                            </button>
                        ) : (
                            <button onClick={() => openModal()} className="px-6 py-3 accent-gradient text-white rounded-[14px] font-bold text-[10px] uppercase tracking-[0.15em] transition-all shadow-lg shadow-[#f86a1f]/20 active:scale-95 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Add Staff
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Horizontal Scroll Track */}
                        <div className="flex overflow-x-auto gap-4 md:gap-6 pb-8 pt-4 px-4 sm:px-6 md:px-8 snap-x snap-mandatory scrollbar-hide" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
                            {/* Inner pseudo-margin spacer for perfect center alignment of the first item on mobile */}
                            <div className="w-[calc(50vw-42.5vw-16px)] sm:w-[calc(50vw-170px-24px)] md:hidden shrink-0 pointer-events-none" />
                            
                            {staff.map((s) => (
                                <div key={s._id} className={`bg-white rounded-[24px] shrink-0 w-[85vw] sm:w-[340px] md:w-[350px] snap-center flex flex-col shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-400 group overflow-hidden ${!s.isActive ? 'opacity-60' : ''}`}>
                                    
                                    {/* Top Section Header (Off-white) */}
                                    <div className="bg-[#faf8f8] px-6 pt-6 pb-5 flex justify-between items-start gap-4 border-b border-gray-100/60">
                                        <div className="flex flex-col min-w-0 pr-1">
                                            <h3 className="font-display font-bold text-[#1A1A1A] text-[18px] sm:text-[20px] truncate leading-tight tracking-tight">{s.name}</h3>
                                            <p className="text-[13px] text-gray-500 font-medium truncate mt-0.5">{s.email}</p>
                                        </div>
                                        <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-widest ${s.isActive ? 'bg-[#173d9f]/10 text-[#173d9f] border border-[#173d9f]/20' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-[#173d9f] animate-pulse' : 'bg-orange-500'}`}></div>
                                            {s.isActive ? 'Active' : 'Suspended'}
                                        </span>
                                    </div>

                                    {/* Body Section */}
                                    <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                                        {/* Middle Section */}
                                        <div className="space-y-4 mb-6 flex-1">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-10 h-10 rounded-[12px] bg-[#faf8f8] flex flex-shrink-0 items-center justify-center text-[#173d9f] border border-gray-100 shadow-sm">
                                                    <Briefcase className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Assign Manager</label>
                                                    <p className="text-sm font-bold text-[#1A1A1A] truncate">{s.designation || 'Staff Member'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3.5">
                                                <div className="w-10 h-10 rounded-[12px] bg-[#faf8f8] flex flex-shrink-0 items-center justify-center text-[#173d9f] border border-gray-100 shadow-sm">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Project Manager</p>
                                                    <p className="text-sm font-bold text-gray-600 truncate">{s.department || 'General'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-50 flex-wrap">
                                            <button onClick={() => openModal(s)} className="flex-1 py-2.5 px-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-500 hover:text-[#173d9f] font-bold text-[10px] uppercase tracking-wider transition-all min-w-[30%]">
                                                View Details
                                            </button>
                                            
                                            {s.isActive ? (
                                                <button onClick={() => openSuspendModal(s._id, s.name, 'suspend')} className="flex-1 py-2.5 px-3 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white font-bold text-[10px] uppercase tracking-wider transition-all min-w-[40%]">
                                                    Suspend
                                                </button>
                                            ) : (
                                                <button onClick={() => openSuspendModal(s._id, s.name, 'activate')} className="flex-1 py-2.5 px-3 rounded-xl bg-green-50/50 border border-green-100 text-green-600 hover:bg-green-600 hover:text-white font-bold text-[10px] uppercase tracking-wider transition-all min-w-[40%]">
                                                    Activate
                                                </button>
                                            )}
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
                                        onClick={() => fetchStaff(pagination.page - 1)}
                                        disabled={!pagination.hasPrev}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#faf8f8] text-gray-500 disabled:opacity-30 hover:text-[#173d9f] transition-all font-bold border border-gray-100"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => fetchStaff(pagination.page + 1)}
                                        disabled={!pagination.hasNext}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#faf8f8] text-gray-500 disabled:opacity-30 hover:text-[#173d9f] transition-all font-bold border border-gray-100"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
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

            {suspendConfirm && (
                <ConfirmationModal
                    title={suspendConfirm.intent === 'suspend' ? 'Suspend Staff' : 'Activate Staff'}
                    message={suspendConfirm.intent === 'suspend' 
                        ? `Are you sure you want to suspend ${suspendConfirm.name}? They will lose access to the system.` 
                        : `Are you sure you want to activate ${suspendConfirm.name}?`}
                    onConfirm={confirmToggleStatus}
                    onCancel={() => setSuspendConfirm(null)}
                    confirmText={suspendConfirm.intent === 'suspend' ? 'Suspend' : 'Activate'}
                    isDestructive={suspendConfirm.intent === 'suspend'}
                />
            )}
        </div>
    );
};

// ════════════════════════════════════════
//  Stat Card Component
// ════════════════════════════════════════
const StatCard = ({ icon: Icon, label, value, color, onClick }) => {
    const colors = {
        accent: 'bg-[#f86a1f]/5 text-[#f86a1f] border-[#f86a1f]/10',
        secondary: 'bg-[#173d9f]/5 text-[#173d9f] border-[#173d9f]/10',
        neutral: 'bg-white text-gray-400 border-gray-100',
    };
    return (
        <div onClick={onClick} className={`bg-white p-4 sm:p-5 rounded-[20px] border border-gray-100 shadow-md group flex flex-col items-start h-full cursor-pointer active:scale-[0.98] select-none hover:border-${color === 'accent' ? '[#f86a1f]' : '[#173d9f]'}/20 hover:-translate-y-1 transition-all duration-300`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${colors[color] || colors.neutral} mb-3 group-hover:scale-110 transition-transform duration-500`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-2xl sm:text-3xl font-display font-bold text-[#1A1A1A] tracking-tighter leading-none mb-1">{value}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">{label}</p>
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
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 hover:text-red-600 hover:bg-red-50 transition-all duration-200 border border-slate-200/50"
                        aria-label="Close"
                    >
                        <span className="text-[22px] leading-none mb-0.5">&times;</span>
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

                        <FormField 
                            label={isEdit ? 'New Password' : 'Password'} 
                            name="password" 
                            type="password" 
                            value={form.password} 
                            onChange={handleChange} 
                            required={!isEdit} 
                            placeholder={isEdit ? '••••••••' : 'Create a password'} 
                            hint="Minimum 6 characters required"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Phone" name="phone" type="number" inputMode="numeric" value={form.phone} onChange={handleChange} placeholder="+1 234 567 890" />
                            <FormField label="Alt. Phone" name="alternatePhone" type="number" inputMode="numeric" value={form.alternatePhone} onChange={handleChange} placeholder="Optional" />
                        </div>

                        <FormField label="Professional Title" name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Project Manager" />

                        <div className="space-y-1.5 mb-5">
                            <label className="text-[15px] font-bold text-[#34495E] ml-1">Department</label>
                            <div className="relative">
                                <select name="department" value={form.department} onChange={handleChange} className="w-full px-4 py-3.5 bg-[#faf8f8] border border-gray-100 rounded-[14px] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#173d9f] focus:ring-4 focus:ring-[#173d9f]/5 transition-all cursor-pointer appearance-none">
                                    <option value="">Select department</option>
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <FormField label="Joining Date" name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} />

                        <div className="space-y-1.5 mb-5">
                            <label className="text-[15px] font-bold text-[#34495E] ml-1">Employment Type</label>
                            <div className="relative">
                                <select name="employmentType" value={form.employmentType} onChange={handleChange} className="w-full px-4 py-3.5 bg-[#faf8f8] border border-gray-100 rounded-[14px] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#173d9f] focus:ring-4 focus:ring-[#173d9f]/5 transition-all cursor-pointer appearance-none">
                                    {EMPLOYMENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5 mb-5">
                            <label className="text-[15px] font-bold text-[#34495E] ml-1">Job Type</label>
                            <div className="relative">
                                <select name="reportingManager" value={form.reportingManager} onChange={handleChange} className="w-full px-4 py-3.5 bg-[#faf8f8] border border-gray-100 rounded-[14px] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#173d9f] focus:ring-4 focus:ring-[#173d9f]/5 transition-all cursor-pointer appearance-none">
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
                            className="w-full py-4.5 accent-gradient text-white font-bold rounded-[16px] shadow-lg shadow-[#f86a1f]/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
const FormField = ({ label, name, type = 'text', value, onChange, placeholder, required, disabled, inputMode, pattern, hint }) => (
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
                inputMode={inputMode}
                pattern={pattern}
                className="w-full px-4 py-3.5 bg-[#faf8f8] border border-gray-100 rounded-[14px] text-sm font-medium text-[#1A1A1A] placeholder-gray-300 focus:outline-none focus:border-[#173d9f] focus:ring-4 focus:ring-[#173d9f]/5 transition-all disabled:opacity-30"
            />
            {type === 'date' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
            )}
        </div>
        {hint && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mt-1 opacity-70">{hint}</p>}
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

export default ManageStaff;
