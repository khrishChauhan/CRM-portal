import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Search, Loader2, FolderOpen, AlertCircle,
    MapPin, Calendar, CheckCircle, ChevronRight,
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
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-reveal pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-display font-bold text-white tracking-tight leading-none text-gradient">My Projects</h1>
                    <p className="text-slate-500 mt-3 font-medium text-lg italic">View and update your assigned projects.</p>
                </div>
            </div>

            {error && (
                <div className="glass-dark p-8 rounded-[2rem] border border-red-500/20 flex items-center gap-6 text-red-400">
                    <AlertCircle className="w-8 h-8 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold uppercase tracking-widest text-[11px] mb-1">Something went wrong</h3>
                        <p className="text-sm font-medium opacity-80">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {projects.map(project => (
                    <div key={project._id} className="glass p-10 rounded-[3rem] border border-white/5 shadow-2xl hover:border-indigo-500/30 transition-all duration-500 flex flex-col justify-between group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] -mr-24 -mt-24 group-hover:bg-indigo-500/10 transition-colors"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div className="px-4 py-1.5 glass-dark border border-white/10 text-indigo-400 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] font-mono">
                                    ID // {project.projectCode}
                                </div>
                                <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest ${PROJECT_STATUS_COLORS[project.projectStatus]?.replace('bg-', 'bg-transparent border border-').replace('text-', 'text-') || 'border-slate-500/20 text-slate-400'}`}>
                                    {project.projectStatus}
                                </span>
                            </div>

                            <h3 className="text-3xl font-display font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                                {project.projectName}
                            </h3>
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.25em] mb-10 italic">{project.projectCategory || 'General'}</p>

                            <div className="space-y-6">
                                <DetailItem icon={MapPin} value={project.siteAddress || 'No location set'} />
                                <DetailItem icon={Calendar} value={`Due: ${project.expectedCompletion ? new Date(project.expectedCompletion).toLocaleDateString() : 'TBD'}`} />
                            </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-white/5 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-bold text-indigo-400 shadow-inner group-hover:scale-110 transition-transform">
                                    {project.projectStatus[0]}
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Current Status</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate(`/staff/projects/${project._id}/updates`)}
                                    className="group/btn flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-xl"
                                >
                                    <MessageSquare className="w-4 h-4 text-emerald-400 group-hover/btn:scale-110 transition-transform" />
                                    Updates
                                </button>
                                <button
                                    onClick={() => handleEdit(project)}
                                    className="group/btn flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-xl"
                                >
                                    <Edit3 className="w-4 h-4 text-indigo-400 group-hover/btn:rotate-12 transition-transform" />
                                    Update Status
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {projects.length === 0 && (
                    <div className="xl:col-span-2 glass p-40 rounded-[4rem] border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center justify-center mb-10 ring-1 ring-white/10">
                            <FolderOpen className="w-12 h-12 text-slate-800" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-white tracking-tight">No projects yet</h3>
                        <p className="text-slate-500 font-medium mt-4 text-lg italic">You don't have any assigned projects at the moment.</p>
                    </div>
                )}
            </div>

            {/* Update Modal */}
            {selectedProject && (
                <div className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center p-4 pt-10 sm:pt-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-500" onClick={() => setSelectedProject(null)}></div>
                    <div className="glass-dark border border-white/10 rounded-3xl md:rounded-[3.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] w-full max-w-xl relative z-[120] animate-in zoom-in-95 duration-700 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-6 md:px-12 md:py-10 border-b border-white/5 shrink-0">
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">Update Project</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2 italic font-mono truncate max-w-[200px] sm:max-w-none">Updating: {selectedProject.projectName.toUpperCase()}</p>
                            </div>
                            <button type="button" onClick={() => setSelectedProject(null)} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-all duration-300">
                                <X className="w-4 h-4 md:w-6 md:h-6 mx-auto" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="flex flex-col overflow-hidden min-h-0">
                            <div className="px-6 py-6 md:px-12 md:py-10 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 sm:mb-4">Status</label>
                                        <select
                                            value={editForm.projectStatus}
                                            onChange={e => setEditForm({ ...editForm, projectStatus: e.target.value })}
                                            className="w-full px-5 sm:px-6 py-4 sm:py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all cursor-pointer"
                                        >
                                            <option value="Planned" className="bg-slate-900">PLANNED</option>
                                            <option value="In Progress" className="bg-slate-900">IN PROGRESS</option>
                                            <option value="On Hold" className="bg-slate-900">ON HOLD</option>
                                            <option value="Completed" className="bg-slate-900">COMPLETED</option>
                                            <option value="Delayed" className="bg-slate-900">DELAYED</option>
                                            <option value="Cancelled" className="bg-slate-900">CANCELLED</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 sm:mb-4">Completion Date</label>
                                        <input
                                            type="date"
                                            value={editForm.actualCompletion}
                                            onChange={e => setEditForm({ ...editForm, actualCompletion: e.target.value })}
                                            className="w-full px-5 sm:px-6 py-4 sm:py-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 sm:mb-4">Risk Level</label>
                                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                                        {['Low', 'Medium', 'High'].map(level => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setEditForm({ ...editForm, riskLevel: level })}
                                                className={`py-3 sm:py-4 rounded-2xl text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] border transition-all ${editForm.riskLevel === level
                                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_30px_rgba(79,70,229,0.3)]'
                                                    : 'bg-white/5 border-white/5 text-slate-600 hover:border-white/20'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 sm:mb-4">Notes / Delay Reason</label>
                                    <textarea
                                        value={editForm.delayReason}
                                        onChange={e => setEditForm({ ...editForm, delayReason: e.target.value })}
                                        placeholder="Add any notes or explain delays..."
                                        className="w-full px-6 sm:px-8 py-5 sm:py-6 bg-white/5 border border-white/10 rounded-3xl text-sm text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all h-28 sm:h-32 resize-none placeholder:text-slate-800 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="shrink-0 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4 p-4 md:p-8 border-t border-white/5 bg-slate-900/50">
                                <button type="button" onClick={() => setSelectedProject(null)} className="w-full sm:w-auto px-10 py-4 sm:py-5 bg-white/5 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-2xl hover:bg-white/10 hover:text-white transition-all">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full sm:w-auto px-12 py-4 sm:py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] uppercase tracking-[0.3em] rounded-2xl transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)] flex items-center justify-center gap-3 disabled:opacity-30"
                                >
                                    {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Save Changes
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
    <div className="flex items-center gap-4 text-slate-500 group/item">
        <Icon className="w-5 h-5 text-indigo-500/30 group-hover/item:text-indigo-400 transition-colors" />
        <span className="text-[13px] font-medium tracking-tight group-hover/item:text-slate-300 transition-colors">{value}</span>
    </div>
);

export default ManageStaffProjects;
