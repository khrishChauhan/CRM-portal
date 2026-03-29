import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
                {projects.map(project => (
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
                                    className="p-3 bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                                    title="View Updates"
                                >
                                    <MessageSquare className="w-5 h-5" />
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

                {projects.length === 0 && (
                    <div className="xl:col-span-2 bg-white py-12 md:py-20 px-4 rounded-[24px] md:rounded-[32px] card-shadow flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-2xl md:rounded-[22px] flex items-center justify-center mb-4 md:mb-6">
                            <FolderOpen className="w-8 h-8 md:w-10 md:h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg md:text-xl font-display font-bold text-[#1A1A1A]">No active projects</h3>
                        <p className="text-[#6B7280] text-[13px] md:text-sm font-medium mt-1 md:mt-2">You haven't been assigned to any projects yet.</p>
                    </div>
                )}
            </div>

            {/* Update Modal */}
            {selectedProject && (
                <div className="fixed inset-0 z-[110] flex justify-center items-start p-4">
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedProject(null)}></div>
                    <div className="bg-white w-[94%] max-w-[460px] h-auto max-h-[92vh] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col relative z-[120] animate-in slide-in-from-top-4 duration-300 overflow-hidden">
                        <div className="flex items-center justify-between p-[22px] pb-3 shrink-0 bg-white">
                            <div>
                                <h2 className="text-[20px] font-bold text-[#2C3E50] tracking-tight">Project Update</h2>
                                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mt-1.5 px-3 py-1 bg-blue-50 rounded-lg inline-block">Ref: {selectedProject.projectCode}</p>
                            </div>
                            <button onClick={() => setSelectedProject(null)} className="p-1.5 text-gray-400 hover:text-red-500 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="flex-1 flex flex-col min-h-0 bg-white">
                            <div className="flex-1 overflow-y-auto scrollbar-hide px-[22px] pt-2 pb-2">
                                <div className="grid grid-cols-2 gap-4 mb-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[15px] font-bold text-[#34495E] ml-1">Current Status</label>
                                        <div className="relative">
                                            <select
                                                value={editForm.projectStatus}
                                                onChange={e => setEditForm({ ...editForm, projectStatus: e.target.value })}
                                                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-[14px] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="Planned">Planned</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="On Hold">On Hold</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Delayed">Delayed</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[15px] font-bold text-[#34495E] ml-1">Completion</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={editForm.actualCompletion}
                                                onChange={e => setEditForm({ ...editForm, actualCompletion: e.target.value })}
                                                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-[14px] text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 mb-5">
                                    <label className="text-[15px] font-bold text-[#34495E] ml-1">Risk Level</label>
                                    <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-[14px]">
                                        {['Low', 'Medium', 'High'].map(level => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setEditForm({ ...editForm, riskLevel: level })}
                                                className={`py-2 rounded-[10px] text-[11px] font-bold uppercase tracking-wider transition-all ${editForm.riskLevel === level
                                                    ? 'bg-blue-600 shadow-lg shadow-blue-200 text-white'
                                                    : 'bg-transparent text-gray-400 hover:text-gray-600'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5 mb-5">
                                    <label className="text-[15px] font-bold text-[#34495E] ml-1">Update Notes</label>
                                    <textarea
                                        value={editForm.delayReason}
                                        onChange={e => setEditForm({ ...editForm, delayReason: e.target.value })}
                                        placeholder="Add any internal notes..."
                                        style={{ minHeight: '110px' }}
                                        className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-[14px] text-sm font-medium text-[#1A1A1A] placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="p-[22px] pt-3 bg-white border-t border-gray-50 shrink-0">
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full py-4.5 blue-gradient text-white font-bold rounded-[16px] shadow-lg shadow-blue-200 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {updating ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : <Save className="w-5 h-5" />}
                                    Save Progress
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
