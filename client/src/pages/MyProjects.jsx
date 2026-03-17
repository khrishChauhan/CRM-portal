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
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Projects...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-reveal pb-20 font-body">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div>
                    <h1 className="text-3xl font-display font-bold text-[#1A1A1A]">Project Gallery</h1>
                    <p className="text-gray-500 mt-2 font-medium">Your approved projects and progress tracking.</p>
                </div>
                <div className="flex bg-gray-200 p-1 rounded-xl">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {error ? (
                <div className="bg-red-50 p-6 rounded-[20px] border border-red-100 flex items-center gap-4 text-red-600">
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    <p className="font-semibold text-sm">{error}</p>
                </div>
            ) : projects.length === 0 ? (
                <div className="bg-white p-20 rounded-[32px] card-shadow flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-[24px] flex items-center justify-center mb-6">
                        <FolderOpen className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-[#1A1A1A]">No Projects Yet</h3>
                    <p className="text-gray-500 max-w-sm mt-2">You don't have access to any projects. Request access from the dashboard.</p>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
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
            <div className="bg-white p-6 rounded-[20px] card-shadow border border-transparent hover:border-blue-500/20 transition-all cursor-pointer flex items-center justify-between gap-4" onClick={onSelect}>
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-[14px] bg-gray-50 flex items-center justify-center font-bold text-blue-600 text-xs shadow-inner">
                        {project.projectCode.slice(-3)}
                    </div>
                    <div>
                        <h3 className="text-base font-display font-bold text-[#1A1A1A] group-hover:text-blue-600 transition-colors uppercase tracking-tight">{project.projectName}</h3>
                        <div className="flex items-center gap-4 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-500" /> {project.siteAddress || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${PROJECT_STATUS_COLORS[project.projectStatus] || 'bg-gray-100 text-gray-500'}`}>
                        {project.projectStatus}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[24px] card-shadow border border-transparent hover:border-blue-500/20 hover:-translate-y-1 transition-all duration-300 group overflow-hidden cursor-pointer flex flex-col h-full" onClick={onSelect}>
            <div className="p-8 flex-1">
                <div className="flex justify-between items-start mb-6">
                    <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[9px] font-bold uppercase tracking-widest">
                        #{project.projectCode}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${PROJECT_STATUS_COLORS[project.projectStatus] || 'bg-gray-100 text-gray-500'}`}>
                        {project.projectStatus}
                    </span>
                </div>

                <h3 className="text-xl font-display font-bold text-[#1A1A1A] mb-4 group-hover:text-blue-600 transition-colors leading-tight">
                    {project.projectName}
                </h3>

                <div className="space-y-4">
                    <DetailRow icon={MapPin} label={project.siteAddress || 'No location'} />
                    <DetailRow icon={Calendar} label={`Started: ${new Date(project.startDate).toLocaleDateString('en-GB')}`} />
                </div>
            </div>

            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/client/projects/${project._id}/updates`); }}
                    className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                >
                    <MessageSquare className="w-4 h-4" />
                    View Updates
                </button>
                <div className="w-10 h-10 rounded-xl bg-white card-shadow flex items-center justify-center transition-all group-hover:blue-gradient group-hover:text-white">
                    <ChevronRight className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
};

const DetailRow = ({ icon: Icon, label }) => (
    <div className="flex items-center gap-3 text-gray-500">
        <Icon className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium tracking-tight truncate">{label}</span>
    </div>
);

const ProjectDetailsModal = ({ project, onClose }) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-[32px] card-shadow w-full max-w-2xl relative z-[210] animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="shrink-0 h-48 blue-gradient flex items-end p-10 relative">
                    <div className="relative z-10 w-full flex justify-between items-end">
                        <div className="text-white">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2 opacity-80">Project Overview</p>
                            <h2 className="text-3xl font-display font-bold leading-tight">{project.projectName}</h2>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20">
                            <span className="text-white font-bold text-lg font-mono">#{project.projectCode}</span>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-10 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-l-4 border-blue-500 pl-3">General Information</h4>
                            <div className="space-y-4">
                                <ModalDetail icon={MapPin} title="Location" value={project.siteAddress || 'Not specified'} />
                                <ModalDetail icon={Calendar} title="Start Date" value={new Date(project.startDate).toLocaleDateString('en-GB')} />
                                <ModalDetail icon={FolderOpen} title="Category" value={project.projectCategory || 'General'} />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-l-4 border-blue-500 pl-3">Status & Progress</h4>
                            <div className="bg-gray-50 p-6 rounded-[20px] border border-gray-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase">Current Status</span>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${PROJECT_STATUS_COLORS[project.projectStatus] || 'bg-gray-100 text-gray-500'}`}>
                                    {project.projectStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-8 rounded-[24px] border border-blue-100 flex items-center gap-6">
                        <div className="w-14 h-14 rounded-[18px] bg-white flex items-center justify-center shadow-sm">
                            <User className="w-7 h-7 text-blue-500" />
                        </div>
                        <div>
                            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Project Manager</span>
                            <span className="text-lg font-bold text-[#1A1A1A]">{project.assignedManager?.name || 'Not assigned'}</span>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 p-8 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full py-5 blue-gradient text-white font-bold text-sm uppercase tracking-widest rounded-[18px] btn-shadow"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

const ModalDetail = ({ icon: Icon, title, value }) => (
    <div className="flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex-shrink-0 flex items-center justify-center border border-gray-100">
            <Icon className="w-5 h-5 text-blue-500" />
        </div>
        <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{title}</span>
            <span className="text-sm font-bold text-[#1A1A1A]">{value}</span>
        </div>
    </div>
);

export default MyProjects;

