import {
    Users,
    UserPlus,
    ArrowUpRight,
    TrendingUp,
    Activity,
    UserCheck,
    ClipboardList
} from 'lucide-react';

const AdminDashboard = () => {
    const stats = [
        { name: 'Total Users', value: '1,234', change: '+12%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: 'Active Staff', value: '45', change: '+2.5%', icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
        { name: 'New Clients', value: '128', change: '+18%', icon: UserPlus, color: 'text-purple-600', bg: 'bg-purple-50' },
        { name: 'Conversion Rate', value: '3.2%', change: '+0.4%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="text-slate-500 mt-1">Manage system overview and configuration</p>
                </div>
                <div className="flex space-x-3">
                    <button className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium">Download Report</button>
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">Add New User</button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                                <span>{stat.change}</span>
                                <ArrowUpRight className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-slate-500 text-sm font-medium">{stat.name}</h3>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[400px] flex flex-col items-center justify-center">
                    <Activity className="w-12 h-12 text-slate-200 mb-4" />
                    <p className="text-slate-400">Activity chart preview (Requires Chart Library)</p>
                </div>

                {/* Task List Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[400px] flex flex-col items-center justify-center">
                    <ClipboardList className="w-12 h-12 text-slate-200 mb-4" />
                    <p className="text-slate-400 text-center">System logs and alerts will appear here</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
