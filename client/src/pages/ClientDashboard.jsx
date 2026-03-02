import { Briefcase, CreditCard, MessageSquare, Clock } from 'lucide-react';

const ClientDashboard = () => {
    const accountInfo = [
        { name: 'Last Payment', value: '$450.00', date: 'Mar 1, 2026', icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
        { name: 'Open Support Tickets', value: '2', date: 'New updates', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: 'Project Status', value: '75%', date: 'Ahead of schedule', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Welcome back!</h1>
                <p className="text-slate-500 mt-1">Here's your project and account overview</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {accountInfo.map((info) => (
                    <div key={info.name} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-slate-500 text-sm font-medium">{info.name}</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{info.value}</p>
                            <div className="flex items-center space-x-1 mt-2 text-slate-400 text-xs">
                                <Clock className="w-3 h-3" />
                                <span>{info.date}</span>
                            </div>
                        </div>
                        <div className={`${info.bg} ${info.color} p-4 rounded-xl`}>
                            <info.icon className="w-6 h-6" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold mb-6">Recent Deliverables</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl group transition hover:border-primary-200">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white rounded-lg border border-slate-200 group-hover:border-primary-400">
                                <Briefcase className="w-6 h-6 text-slate-400 group-hover:text-primary-500" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Project Analysis Report.pdf</h4>
                                <p className="text-sm text-slate-500">Shared by Admin on Mar 2, 2026</p>
                            </div>
                        </div>
                        <button className="text-primary-600 font-medium hover:underline">Download</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
