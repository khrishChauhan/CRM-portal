import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Search, Loader2, FolderOpen, AlertCircle,
    MapPin, Calendar, User, ChevronRight, LayoutGrid, List
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
                // Fetch user data with approved projects populated
                const { data } = await api.get('/auth/me');
                // Alternatively, use a dedicated endpoint if created, 
                // but our 'me' endpoint or a project endpoint works.
                // Since user schema has approvedProjects, let's use a specific projects call
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
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Approved Projects</h1>
                    <p className="text-slate-500 mt-1 font-medium">Access details for projects you have been granted access to</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {error ? (
                <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-center gap-4 text-red-700">
                    <AlertCircle className="w-6 h-6" />
                    <p className="font-bold">{error}</p>
                </div>
            ) : projects.length === 0 ? (
                <div className="bg-white p-20 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                        <FolderOpen className="w-12 h-12 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">No Projects Yet</h3>
                    <p className="text-slate-400 max-w-sm font-medium">You haven't been approved for any projects. Browse available projects in the dashboard to request access.</p>
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
    if (mode === 'list') {
        return (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-primary-200 transition-all cursor-pointer group flex items-center justify-between gap-6" onClick={onSelect}>
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-primary-600 text-xs">
                        {project.projectCode}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{project.projectName}</h3>
                        <div className="flex items-center gap-4 mt-1 text-xs font-semibold text-slate-400">
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {project.siteAddress || 'N/A'}</span>
                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(project.startDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${PROJECT_STATUS_COLORS[project.projectStatus]}`}>
                        {project.projectStatus}
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-400 transform group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        );
    }

    return (
        <div
            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden cursor-pointer"
            onClick={onSelect}
        >
            <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                    <div className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {project.projectCode}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${PROJECT_STATUS_COLORS[project.projectStatus]}`}>
                        {project.projectStatus}
                    </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-4 group-hover:text-primary-600 transition-colors leading-tight">
                    {project.projectName}
                </h3>

                <div className="space-y-4">
                    <DetailRow icon={MapPin} label={project.siteAddress || 'No Address Provided'} />
                    <DetailRow icon={Calendar} label={`Starts: ${new Date(project.startDate).toLocaleDateString()}`} />
                    <DetailRow icon={User} label={`Manager: ${project.assignedManager?.name || 'Unassigned'}`} />
                </div>

                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-300 uppercase tracking-widest">View Details</span>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-primary-600 flex items-center justify-center transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailRow = ({ icon: Icon, label }) => (
    <div className="flex items-center gap-3 text-slate-500">
        <Icon className="w-4 h-4 text-slate-300" />
        <span className="text-sm font-semibold truncate">{label}</span>
    </div>
);

const ProjectDetailsModal = ({ project, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl my-8 animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
                <div className="h-48 bg-slate-900 flex items-end p-10 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl translate-x-1/2 translate-y-1/2"></div>
                    </div>
                    <div className="relative z-10 w-full flex justify-between items-end">
                        <div>
                            <p className="text-primary-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Project Overview</p>
                            <h2 className="text-3xl font-black text-white leading-tight">{project.projectName}</h2>
                        </div>
                        <div className="text-right">
                            <span className="text-slate-500 text-xs font-bold block mb-1 uppercase tracking-widest">Project Code</span>
                            <span className="text-white font-black text-lg">#{project.projectCode}</span>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">General Information</h4>
                            <div className="space-y-4">
                                <ModalDetail icon={MapPin} title="Site Location" value={project.siteAddress || 'Not Provided'} />
                                <ModalDetail icon={Calendar} title="Timeline" value={`${new Date(project.startDate).toLocaleDateString()} - ${project.expectedCompletion ? new Date(project.expectedCompletion).toLocaleDateString() : 'TBD'}`} />
                                <ModalDetail icon={FolderOpen} title="Category" value={project.projectCategory || 'General'} />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Progress Details</h4>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-600">Current Status</span>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${PROJECT_STATUS_COLORS[project.projectStatus]}`}>
                                        {project.projectStatus}
                                    </span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase block mb-2 tracking-widest">Project Health</span>
                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${project.projectStatus === 'Completed' ? 'w-full bg-emerald-500' :
                                                project.projectStatus === 'Delayed' ? 'w-1/3 bg-red-500' : 'w-2/3 bg-primary-500'
                                            }`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200">
                                <User className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Project Manager</span>
                                <span className="text-sm font-bold text-slate-900">{project.assignedManager?.name || 'Pending Assignment'}</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 italic mt-2 ml-14">Need to discuss something? Your manager is available through the official portal channels.</p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl transition hover:bg-slate-800 shadow-xl shadow-slate-200"
                        >
                            Close View
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ModalDetail = ({ icon: Icon, title, value }) => (
    <div className="flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex-shrink-0 flex items-center justify-center border border-slate-100">
            <Icon className="w-5 h-5 text-slate-300" />
        </div>
        <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">{title}</span>
            <span className="text-sm font-bold text-slate-900">{value}</span>
        </div>
    </div>
);

export default MyProjects;
