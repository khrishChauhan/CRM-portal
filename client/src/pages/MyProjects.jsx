import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Search, Loader2, FolderOpen, AlertCircle,
    MapPin, Calendar, User, ChevronRight, LayoutGrid, List, MessageSquare
} from 'lucide-react';

const PROJECT_STATUS_COLORS = {
    Planned: 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-emerald-100 text-emerald-700',
    'On Hold': 'bg-amber-100 text-amber-700',
    Completed: 'bg-green-100 text-green-700',
    Delayed: 'bg-red-100 text-red-700',
    Cancelled: 'bg-slate-100 text-slate-500',
};

const MyProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [selectedProject, setSelectedProject] = useState(null);

    useEffect(() => {
        const fetchMyProjects = async () => {
            try {
                const res = await api.get('/projects/my-approved');
                setProjects(res.data.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch your projects');
            } finally {
                setLoading(false);
            }
        };
        fetchMyProjects();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px]">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-6" />
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] font-mono">Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-reveal pb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-display font-bold text-white tracking-tight leading-none uppercase text-gradient">My Projects</h1>
                    <p className="text-slate-500 mt-4 font-medium text-lg italic tracking-tight">Your approved projects and their current status.</p>
                </div>
                <div className="flex glass p-1.5 rounded-2xl border border-white/5 shadow-2xl">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-3 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-3 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {error ? (
                <div className="glass-dark p-8 rounded-[2rem] border border-red-500/20 flex items-center gap-6 text-red-400">
                    <AlertCircle className="w-8 h-8 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold uppercase tracking-widest text-[11px] mb-1">Something went wrong</h3>
                        <p className="text-sm font-medium opacity-80">{error}</p>
                    </div>
                </div>
            ) : projects.length === 0 ? (
                <div className="glass p-40 rounded-[4rem] border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center justify-center mb-10 ring-1 ring-white/10 shadow-inner">
                        <FolderOpen className="w-12 h-12 text-slate-800" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-white tracking-tight uppercase">No Projects Yet</h3>
                    <p className="text-slate-500 max-w-sm font-medium mt-4 text-lg italic leading-relaxed">You don't have access to any projects yet. Request access from the dashboard.</p>
                </div>
            ) : (
                <div className={viewMode === 'grid'
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    : "space-y-4"
                }>
                    {projects.map(project => (
                        <ProjectItem
                            key={project._id}
                            project={project}
                            mode={viewMode}
                            onSelect={() => setSelectedProject(project)}
                        />
                    ))}
                </div>
            )}

            {/* Project Details Modal */}
            {selectedProject && (
                <ProjectDetailsModal
                    project={selectedProject}
                    onClose={() => setSelectedProject(null)}
                />
            )}
        </div>
    );
};

const ProjectItem = ({ project, mode, onSelect }) => {
    const navigate = useNavigate();
    if (mode === 'list') {
        return (
            <div className="glass p-8 rounded-3xl border border-white/5 shadow-xl hover:border-indigo-500/30 transition-all duration-500 cursor-pointer group flex items-center justify-between gap-8" onClick={onSelect}>
                <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-indigo-400 text-xs shadow-inner group-hover:scale-110 transition-transform">
                        {project.projectCode}
                    </div>
                    <div>
                        <h3 className="text-xl font-display font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{project.projectName}</h3>
                        <div className="flex items-center gap-6 mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
                            <span className="flex items-center gap-2 text-slate-600"><MapPin className="w-3.5 h-3.5 text-indigo-500/30" /> {project.siteAddress || 'N/A'}</span>
                            <span className="flex items-center gap-2 text-slate-600"><Calendar className="w-3.5 h-3.5 text-indigo-500/30" /> {new Date(project.startDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-10">
                    <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest ${PROJECT_STATUS_COLORS[project.projectStatus]?.replace('bg-', 'bg-transparent border border-').replace('text-', 'text-') || 'border-slate-500/20 text-slate-400'}`}>
                        {project.projectStatus}
                    </span>
                    <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:bg-white/5 transition-all duration-500">
                        <ChevronRight className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="glass rounded-[3rem] border border-white/5 shadow-2xl hover:shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] hover:border-indigo-500/30 hover:-translate-y-2 transition-all duration-500 group overflow-hidden cursor-pointer relative"
            onClick={onSelect}
        >
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] -mr-24 -mt-24 group-hover:bg-indigo-500/10 transition-colors"></div>

            <div className="p-10 relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div className="px-4 py-1.5 glass-dark border border-white/10 text-indigo-400 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] font-mono">
                        ID // {project.projectCode}
                    </div>
                    <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest ${PROJECT_STATUS_COLORS[project.projectStatus]?.replace('bg-', 'bg-transparent border border-').replace('text-', 'text-') || 'border-slate-500/20 text-slate-400'}`}>
                        {project.projectStatus}
                    </span>
                </div>

                <h3 className="text-2xl font-display font-bold text-white mb-6 group-hover:text-indigo-400 transition-colors leading-tight uppercase tracking-tight">
                    {project.projectName}
                </h3>

                <div className="space-y-5">
                    <DetailRow icon={MapPin} label={project.siteAddress || 'No location'} />
                    <DetailRow icon={Calendar} label={`Started: ${new Date(project.startDate).toLocaleDateString()}`} />
                    <DetailRow icon={User} label={`Manager: ${project.assignedManager?.name || 'Not assigned'}`} />
                </div>

                <div className="mt-10 pt-10 border-t border-white/5 flex items-center justify-between">
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/client/projects/${project._id}/updates`); }}
                        className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] hover:text-emerald-400 transition-colors"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Queries
                    </button>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-indigo-600 group-hover:border-indigo-500 flex items-center justify-center transition-all duration-500 shadow-inner group-hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                        <ChevronRight className="w-5 h-5 text-indigo-500 group-hover:text-white transition-colors" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailRow = ({ icon: Icon, label }) => (
    <div className="flex items-center gap-4 text-slate-500 group/item">
        <Icon className="w-4.5 h-4.5 text-indigo-500/30 group-hover/item:text-indigo-400 transition-colors" />
        <span className="text-sm font-medium tracking-tight group-hover/item:text-slate-300 transition-colors leading-none truncate">{label}</span>
    </div>
);

const ProjectDetailsModal = ({ project, onClose }) => {
    return (
        <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-4 pt-10 sm:pt-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-700" onClick={onClose}></div>
            <div className="glass-dark border border-white/10 rounded-3xl md:rounded-[4rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] w-full max-w-3xl relative z-[130] animate-in zoom-in-95 duration-700 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]">
                <div className="shrink-0 h-auto sm:h-64 bg-slate-900 flex items-end p-6 sm:p-14 relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity">
                        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full mix-blend-multiply filter blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
                        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full mix-blend-multiply filter blur-[120px] translate-x-1/2 translate-y-1/2"></div>
                    </div>
                    <div className="relative z-10 w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-10">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="text-indigo-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.4em] mb-2 sm:mb-4 font-mono shadow-sm">Project Details</p>
                            <h2 className="text-2xl sm:text-5xl font-display font-bold text-white leading-tight sm:leading-none uppercase tracking-tighter break-words">{project.projectName}</h2>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0 w-full sm:w-auto flex justify-between sm:block items-center">
                            <span className="text-slate-500 text-[9px] font-bold block sm:mb-2 uppercase tracking-[0.3em] italic">Code</span>
                            <span className="text-white font-mono font-black text-lg sm:text-2xl tracking-tighter bg-white/5 border border-white/10 px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl shadow-inner">#{project.projectCode}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-14 space-y-8 sm:space-y-14 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16">
                        <div className="space-y-6 sm:space-y-8">
                            <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] border-l-2 border-indigo-500/50 pl-4">Project Info</h4>
                            <div className="space-y-4 sm:space-y-6">
                                <ModalDetail icon={MapPin} title="Location" value={project.siteAddress || 'Not specified'} />
                                <ModalDetail icon={Calendar} title="Timeline" value={`${new Date(project.startDate).toLocaleDateString()} - ${project.expectedCompletion ? new Date(project.expectedCompletion).toLocaleDateString() : 'TBD'}`} />
                                <ModalDetail icon={FolderOpen} title="Category" value={project.projectCategory?.toUpperCase() || 'General'} />
                            </div>
                        </div>
                        <div className="space-y-6 sm:space-y-8">
                            <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] border-l-2 border-indigo-500/50 pl-4">Progress</h4>
                            <div className="p-6 sm:p-8 glass bg-white/5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 flex flex-row items-center justify-between gap-4 group/status">
                                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest group-hover/status:text-indigo-400 transition-colors">Current Status</span>
                                <span className={`inline-flex px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[8px] sm:text-[10px] font-bold uppercase tracking-widest ${PROJECT_STATUS_COLORS[project.projectStatus]?.replace('bg-', 'bg-transparent border border-').replace('text-', 'text-') || 'border-slate-500/20 text-slate-400'}`}>
                                    {project.projectStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-10 glass-dark rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row md:items-center gap-6 sm:gap-8 group/manager relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] -mr-16 -mt-16 group-hover/manager:bg-indigo-400/10 transition-colors"></div>
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] sm:rounded-[1.5rem] bg-indigo-600/10 flex-shrink-0 flex items-center justify-center border border-indigo-500/20 shadow-xl group-hover/manager:scale-110 transition-transform">
                            <User className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
                        </div>
                        <div className="flex-1 relative z-10">
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em] block mb-1.5 sm:mb-2 italic">Project Manager</span>
                            <span className="text-lg sm:text-xl font-display font-bold text-white uppercase tracking-tight group-hover/manager:text-indigo-400 transition-colors">{project.assignedManager?.name || 'Not assigned'}</span>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1.5 sm:mt-2 leading-relaxed italic opacity-70">Contact your project manager for any questions or queries.</p>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 p-6 md:p-10 border-t border-white/5 bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="w-full py-5 sm:py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-[0.4em] rounded-2xl sm:rounded-3xl transition-all shadow-[0_20px_60px_-16px_rgba(79,70,229,0.4)] hover:shadow-[0_20px_80px_-16px_rgba(79,70,229,0.6)]"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const ModalDetail = ({ icon: Icon, title, value }) => (
    <div className="flex gap-6 group/detail">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/5 shadow-inner group-hover/detail:border-indigo-500/30 transition-colors">
            <Icon className="w-6 h-6 text-indigo-500/30 group-hover/detail:text-indigo-400 transition-colors" />
        </div>
        <div>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em] block mb-1.5 italic transition-colors leading-none">{title}</span>
            <span className="text-lg font-display font-bold text-white uppercase tracking-tight group-hover/detail:text-indigo-300 transition-colors">{value}</span>
        </div>
    </div>
);

export default MyProjects;
