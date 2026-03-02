import { Users, CheckCircle, Clock, Plus } from 'lucide-react';

const StaffDashboard = () => {
    const tasks = [
        { title: 'Follow up with Client X', status: 'Pending', priority: 'High', date: 'Mar 15' },
        { title: 'Update CRM records', status: 'In Progress', priority: 'Medium', date: 'Mar 14' },
        { title: 'Send invoice #1234', status: 'Completed', priority: 'Low', date: 'Mar 12' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Staff Dashboard</h1>
                <p className="text-slate-500 mt-1">Manage your clients and tasks efficiently</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm col-span-2">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary-500" />
                        Latest Task Updates
                    </h2>
                    <div className="space-y-4">
                        {tasks.map((task) => (
                            <div key={task.title} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                                        <Clock className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{task.title}</h3>
                                        <p className="text-sm text-slate-500">Due {task.date}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${task.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                    }`}>{task.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-bold mb-2">My Clients</h2>
                        <p className="text-slate-500 text-sm mb-6">You are currently managing 12 clients</p>
                        <div className="flex -space-x-3 mb-6 overflow-hidden">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                    C{i}
                                </div>
                            ))}
                            <div className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
                                +8
                            </div>
                        </div>
                    </div>
                    <button className="w-full flex items-center justify-center space-x-2 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                        <Plus className="w-5 h-5" />
                        <span>Add Client</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
