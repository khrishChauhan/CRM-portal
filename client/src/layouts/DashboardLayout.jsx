import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Settings,
    LogOut,
    Menu,
    X,
    UserCircle,
    FolderOpen,
    FileText
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ role }) => {
    const location = useLocation();

    const adminLinks = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Manage Staff', path: '/admin/staff', icon: Users },
        { name: 'Manage Clients', path: '/admin/clients', icon: Briefcase },
        { name: 'Projects', path: '/admin/projects', icon: FolderOpen },
        { name: 'Access Requests', path: '/admin/access-requests', icon: FileText },
        { name: 'Settings', path: '/admin/settings', icon: Settings },
    ];

    const staffLinks = [
        { name: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
        { name: 'My Projects', path: '/staff/projects', icon: FolderOpen },
    ];

    const clientLinks = [
        { name: 'Dashboard', path: '/client/dashboard', icon: LayoutDashboard },
        { name: 'My Projects', path: '/client/projects', icon: FolderOpen },
    ];

    const links = role === 'admin' ? adminLinks : role === 'staff' ? staffLinks : clientLinks;

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white w-64 transition-all duration-300">
            <div className="p-6 text-2xl font-bold bg-slate-800">
                CRM Portal
            </div>
            <nav className="flex-1 mt-6 px-4 space-y-2">
                {links.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${location.pathname === link.path
                            ? 'bg-primary-600'
                            : 'hover:bg-slate-800'
                            }`}
                    >
                        <link.icon className="w-5 h-5" />
                        <span>{link.name}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
};

const Navbar = ({ user, toggleSidebar, logout }) => {
    return (
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
            <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-md hover:bg-slate-100"
            >
                <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:ml-0 text-lg font-semibold text-slate-700 capitalize">
                {user?.role} Portal
            </div>

            <div className="flex items-center space-x-4">
                <div className="hidden sm:flex flex-col text-right">
                    <span className="text-sm font-medium text-slate-900">{user?.name}</span>
                    <span className="text-xs text-slate-500 capitalize">{user?.role}</span>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-red-50 text-red-600 transition-colors"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </header>
    );
};

export const DashboardLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar for desktop */}
            <div className={`hidden lg:block ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden transition-all duration-300`}>
                <Sidebar role={user?.role} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative">
                <Navbar
                    user={user}
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    logout={logout}
                />

                <main className="p-6 md:p-8 bg-slate-50 min-h-[calc(100vh-64px)]">
                    {children}
                </main>
            </div>

            {/* Mobile sidebar overlay (simplified for now) */}
        </div>
    );
};
