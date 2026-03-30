import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import {
    Search, Loader2, FolderOpen, AlertCircle,
    MapPin, Calendar, CheckCircle, ChevronRight, ChevronDown,
    Edit3, X, Save, MessageSquare
} from 'lucide-react';

const PROJECT_STATUS_COLORS = {
    Planned: 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-primary-100 text-primary-700',
    'On Hold': 'bg-amber-100 text-amber-700',
    Completed: 'bg-emerald-100 text-emerald-700',
    Delayed: 'bg-red-100 text-red-700',
    Cancelled: 'bg-slate-100 text-slate-500',
};

const ManageStaffProjects = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const statusFilter = searchParams.get('status') || 'All';
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);   
    const [updating, setUpdating] = useState(false);
    const [editForm, setEditForm] = useState({
        projectStatus: '',
        actualCompletion: '',
        delayReason: '',
        riskLevel: 'Low'
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/projects/my');
            setProjects(data.data.projects);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (project) => {
        setSelectedProject(project);
        setEditForm({
            projectStatus: project.projectStatus,
            actualCompletion: project.actualCompletion ? new Date(project.actualCompletion).toISOString().split('T')[0] : '',
            delayReason: project.delayReason || '',
            riskLevel: project.riskLevel || 'Low'
        });
    };

    useEffect(() => {
        if (selectedProject) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedProject]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            await api.patch(`/projects/${selectedProject._id}/staff-update`, editForm);
            await fetchProjects();
            setSelectedProject(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 md:py-32 min-h-[300px] md:min-h-[400px]">
                <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Loading projects...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-reveal pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-[#1A1A1A]">Project Assignments</h1>
                    <p className="text-[#6B7280] font-medium">Manage and update progress on your active projects.</p>
                </div>
                {/* Auto-applied Filter Dropdown */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:inline-block">Filter:</span>
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                if (e.target.value === 'All') {
                                    searchParams.delete('status');
                                } else {
                                    searchParams.set('status', e.target.value);
                                }
                                setSearchParams(searchParams);
                            }}
                            className="h-10 pl-4 pr-10 bg-white border border-gray-100 rounded-xl text-sm font-bold text-[#1A1A1A] appearance-none focus:outline-none focus:border-blue-500 shadow-sm transition-all cursor-pointer"
                        >
                            <option value="All">All Projects</option>
                            <option value="Planned">Planned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Completed">Completed</option>
                            <option value="Delayed">Delayed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 p-6 rounded-[22px] border border-red-100 flex items-center gap-4 text-red-600">
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold text-xs uppercase tracking-wider mb-0.5">Error Occurred</h3>
                        <p className="text-sm font-medium opacity-80">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {(statusFilter === 'All' ? projects : projects.filter(p => p.projectStatus === statusFilter)).map(project => (
                    <div key={project._id} className="bg-white p-8 rounded-[24px] card-shadow border border-transparent hover:border-blue-500/30 transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                {project.projectCode}
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${PROJECT_STATUS_COLORS[project.projectStatus] || 'bg-gray-100 text-gray-600'}`}>
                                {project.projectStatus}
                            </span>
                        </div>

                        <h3 className="text-2xl font-display font-bold text-[#1A1A1A] mb-2 group-hover:text-blue-600 transition-colors uppercase leading-tight">
                            {project.projectName}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">{project.projectCategory || 'General Project'}</p>

                        <div className="space-y-4 mb-8">
                            <DetailItem icon={MapPin} value={project.siteAddress || 'Address not specified'} />
                            <DetailItem icon={Calendar} value={`Due: ${project.expectedCompletion ? new Date(project.expectedCompletion).toLocaleDateString() : 'TBD'}`} />
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-[11px] font-bold text-blue-600">
                                    {project.projectStatus[0]}
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ongoing</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate(`/staff/projects/${project._id}/updates`)}
                                    className="px-5 py-3.5 bg-gray-50 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 rounded-xl transition-all border border-transparent hover:border-emerald-100 text-[10px] font-bold uppercase tracking-wider"
                                    title="Upload Updates"
                                >
                                    Upload
                                </button>
                                <button
                                    onClick={() => handleEdit(project)}
                                    className="px-6 py-3.5 blue-gradient text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all btn-shadow flex items-center gap-2"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Update Status
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {(statusFilter === 'All' ? projects : projects.filter(p => p.projectStatus === statusFilter)).length === 0 && (
                    <div className="xl:col-span-2 bg-white py-12 md:py-20 px-4 rounded-[24px] md:rounded-[32px] card-shadow flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-2xl md:rounded-[22px] flex items-center justify-center mb-4 md:mb-6">
                            <FolderOpen className="w-8 h-8 md:w-10 md:h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg md:text-xl font-display font-bold text-[#1A1A1A]">No projects found</h3>
                        <p className="text-[#6B7280] text-[13px] md:text-sm font-medium mt-1 md:mt-2">
                            {statusFilter === 'All' 
                                ? "You haven't been assigned to any projects yet." 
                                : `No assigned projects match the status '${statusFilter}'.`}
                        </p>
                    </div>
                )}
            </div>

            {/* Update Modal */}
            {selectedProject && (
                <div className="fixed inset-0 z-[110] flex justify-center items-center p-4">
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedProject(null)}></div>
                    <div className="bg-white w-[94%] max-w-[420px] h-auto max-h-[92vh] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col relative z-[120] animate-in slide-in-from-top-4 duration-300 overflow-hidden">
                        
                        {/* Header */}
                        <div className="flex items-start justify-between p-5 pb-3 shrink-0 bg-white border-b border-gray-50/50">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-[18px] font-bold text-[#1A1A1A] tracking-tight">Project Update</h2>
                                <div className="flex">
                                    <span className="text-[8px] font-bold text-blue-600 uppercase tracking-widest px-2 py-0.5 bg-blue-50/80 rounded-md border border-blue-100/50">
                                        Ref: {selectedProject.projectCode}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedProject(null)} 
                                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 hover:text-red-600 hover:bg-red-50 transition-all duration-200 border border-slate-200/50"
                                aria-label="Close"
                                type="button"
                            >
                                <span className="text-[22px] leading-none mb-0.5 font-light" style={{ transform: 'scaleX(1.1)' }}>&times;</span>
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="flex-1 flex flex-col min-h-0 bg-white">
                            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pt-4 pb-4 space-y-4">
                                
                                {/* Status & Date - Side by Side */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-[#34495E] px-1">Status</label>
                                        <div className="relative group">
                                            <select
                                                value={editForm.projectStatus}
                                                onChange={e => setEditForm({ ...editForm, projectStatus: e.target.value })}
                                                className="w-full h-11 px-3.5 bg-gray-50/50 border border-gray-100 rounded-[12px] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="Planned">Planned</option>
                                                <option value="In Progress">Progress</option>
                                                <option value="On Hold">On Hold</option>
                                                <option value="Completed">Done</option>
                                                <option value="Delayed">Delay</option>
                                                <option value="Cancelled">Cancel</option>
                                            </select>
                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-[#34495E] px-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={editForm.actualCompletion}
                                            onChange={e => setEditForm({ ...editForm, actualCompletion: e.target.value })}
                                            className="w-full h-11 px-3.5 bg-gray-50/50 border border-gray-100 rounded-[12px] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Risk Level - Segmented Control (Tighter) */}
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-[#34495E] px-1">Risk Level</label>
                                    <div className="flex p-1 bg-gray-50/80 border border-gray-100 rounded-[12px] gap-1">
                                        {['Low', 'Medium', 'High'].map(level => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setEditForm({ ...editForm, riskLevel: level })}
                                                className={`flex-1 py-2 rounded-[9px] text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                                                    editForm.riskLevel === level
                                                        ? 'bg-blue-600 shadow-md shadow-blue-500/10 text-white'
                                                        : 'bg-white/50 text-gray-400 border border-transparent hover:text-gray-600'
                                                }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Update Notes (Tighter) */}
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-[#34495E] px-1">Progress Notes</label>
                                    <textarea
                                        value={editForm.delayReason}
                                        onChange={e => setEditForm({ ...editForm, delayReason: e.target.value })}
                                        placeholder="Add internal progress notes..."
                                        className="w-full min-h-[90px] max-h-[140px] px-3.5 py-2.5 bg-gray-50/50 border border-gray-100 rounded-[12px] text-sm font-medium text-[#1A1A1A] placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            {/* Footer Buttons (Tighter) */}
                            <div className="p-5 pt-2 bg-white border-t border-gray-50/50 shrink-0">
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full h-11 blue-gradient text-white font-bold rounded-[12px] shadow-[0_4px_12px_rgba(37,99,235,0.15)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {updating ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span className="text-[13px]">Save Progress</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailItem = ({ icon: Icon, value }) => (
    <div className="flex items-center gap-3 text-gray-500 group/item">
        <Icon className="w-5 h-5 text-blue-500/40 group-hover/item:text-blue-600 transition-colors" />
        <span className="text-sm font-medium tracking-tight group-hover/item:text-gray-900 transition-colors">{value}</span>
    </div>
);

export default ManageStaffProjects;
