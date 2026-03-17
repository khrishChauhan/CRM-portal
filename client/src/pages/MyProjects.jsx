import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Search, Loader2, FolderOpen, AlertCircle,
    MapPin, Calendar, User, ChevronRight, LayoutGrid, List, MessageSquare, X
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
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    return (
        <div className="fixed inset-0 z-[200] flex justify-center items-start p-4">
            <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-[94%] max-w-[460px] h-auto max-h-[92vh] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col relative z-[210] animate-in slide-in-from-top-4 duration-300 overflow-hidden">
                <div className="flex items-center justify-between p-[22px] pb-3 bg-white shrink-0">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#2C3E50] tracking-tight">{project.projectName}</h2>
                        <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mt-1.5 px-3 py-1 bg-blue-50 rounded-lg inline-block">Ref: {project.projectCode}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-red-500 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide px-[22px] pt-1 pb-8 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        <ModalDetail icon={MapPin} title="Site Address" value={project.siteAddress || 'Not specified'} />
                        <ModalDetail icon={Calendar} title="Project Start" value={new Date(project.startDate).toLocaleDateString('en-GB')} />
                        <ModalDetail icon={FolderOpen} title="Work Category" value={project.projectCategory || 'General Project'} />
                        
                        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-[20px] shadow-sm">
                            <span className="text-[13px] font-bold text-[#7F8C8D] ml-1">Live Status</span>
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest ${PROJECT_STATUS_COLORS[project.projectStatus] || 'bg-gray-100 text-gray-500'}`}>
                                {project.projectStatus}
                            </span>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 p-6 rounded-[24px] border border-blue-100 flex items-center gap-5">
                        <div className="w-12 h-12 rounded-[16px] bg-white border border-blue-50 flex items-center justify-center shadow-sm">
                            <User className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <span className="text-[12px] font-bold text-blue-400 block">Project Manager</span>
                            <span className="text-base font-bold text-[#2C3E50]">{project.assignedManager?.name || 'Unassigned'}</span>
                        </div>
                    </div>
                </div>

                <div className="p-7 bg-white border-t border-gray-50 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-4.5 blue-gradient text-white font-bold rounded-[16px] shadow-lg shadow-blue-200 hover:scale-[1.01] active:scale-95 transition-all"
                    >
                        Close Overview
                    </button>
                </div>
            </div>
        </div>
    );
};

const ModalDetail = ({ icon: Icon, title, value }) => (
    <div className="flex items-center gap-5 py-4 px-4 bg-gray-50 border border-gray-100 rounded-2xl group transition-all">
        <div className="w-11 h-11 rounded-[14px] bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-all duration-300 shadow-sm">
            <Icon className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
            <span className="text-[13px] font-bold text-[#7F8C8D]">{title}</span>
            <span className="font-bold text-[#2C3E50] text-[15px] mt-0.5 tracking-tight">{value}</span>
        </div>
    </div>
);

export default MyProjects;

