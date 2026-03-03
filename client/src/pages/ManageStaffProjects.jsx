import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Search, Loader2, FolderOpen, AlertCircle,
    MapPin, Calendar, CheckCircle, ChevronRight,
    Edit3, X, Save
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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Assigned Projects</h1>
                <p className="text-slate-500 mt-1 font-medium">View details and update progress for your assigned projects</p>
            </div>

            {error && (
                <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-center gap-4 text-red-700">
                    <AlertCircle className="w-6 h-6" />
                    <p className="font-bold">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {projects.map(project => (
                    <div key={project._id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all p-8 flex flex-col justify-between group">
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100">
                                    #{project.projectCode}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${PROJECT_STATUS_COLORS[project.projectStatus]}`}>
                                    {project.projectStatus}
                                </span>
                            </div>

                            <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-primary-600 transition-colors">
                                {project.projectName}
                            </h3>
                            <p className="text-sm font-medium text-slate-400 mb-6">{project.projectCategory}</p>

                            <div className="space-y-4">
                                <DetailItem icon={MapPin} value={project.siteAddress || 'No Address'} />
                                <DetailItem icon={Calendar} value={`Due: ${project.expectedCompletion ? new Date(project.expectedCompletion).toLocaleDateString() : 'TBD'}`} />
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                    {project.projectStatus[0]}
                                </div>
                                <span className="text-xs font-bold text-slate-400">Status active</span>
                            </div>
                            <button
                                onClick={() => handleEdit(project)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition"
                            >
                                <Edit3 className="w-4 h-4" />
                                Update Status
                            </button>
                        </div>
                    </div>
                ))}

                {projects.length === 0 && (
                    <div className="xl:col-span-2 bg-white p-20 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <FolderOpen className="w-16 h-16 text-slate-100 mb-4" />
                        <h3 className="text-xl font-black text-slate-900">No Assignments</h3>
                        <p className="text-slate-400 font-medium">You don't have any projects assigned to you yet.</p>
                    </div>
                )}
            </div>

            {/* Update Modal */}
            {selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                        <form onSubmit={handleUpdate} className="p-10">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Update Progress</h3>
                                <button type="button" onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Project Status</label>
                                    <select
                                        value={editForm.projectStatus}
                                        onChange={e => setEditForm({ ...editForm, projectStatus: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary-100 transition-all cursor-pointer"
                                    >
                                        <option value="Planned">Planned</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Delayed">Delayed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Actual Completion Date</label>
                                    <input
                                        type="date"
                                        value={editForm.actualCompletion}
                                        onChange={e => setEditForm({ ...editForm, actualCompletion: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary-100 transition-all font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Risk Level</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Low', 'Medium', 'High'].map(level => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setEditForm({ ...editForm, riskLevel: level })}
                                                className={`py-3 rounded-2xl text-xs font-black border transition-all ${editForm.riskLevel === level
                                                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Delay Reason / Progress Notes</label>
                                    <textarea
                                        value={editForm.delayReason}
                                        onChange={e => setEditForm({ ...editForm, delayReason: e.target.value })}
                                        placeholder="Explain any delays or key updates..."
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary-100 transition-all h-28 resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl transition shadow-xl shadow-primary-100 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 font-black" />}
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
    <div className="flex items-center gap-3 text-slate-500">
        <Icon className="w-4 h-4 text-slate-300" />
        <span className="text-sm font-semibold">{value}</span>
    </div>
);

export default ManageStaffProjects;
