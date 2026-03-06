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
        { name: 'Staff', path: '/admin/staff', icon: Users },
        { name: 'Clients', path: '/admin/clients', icon: Briefcase },
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
        <div className="flex flex-col h-full bg-slate-950 border-r border-white/5 text-white w-64 transition-all duration-500 relative overflow-hidden">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 noise-bg opacity-[0.02] pointer-events-none"></div>

            <div className="p-8 flex items-center space-x-3 group cursor-pointer relative z-10">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)] group-hover:scale-125 transition-transform duration-300"></div>
                <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-indigo-400 transition-colors">CRM Portal</span>
            </div>

            <nav className="flex-1 mt-8 px-4 space-y-1.5 relative z-10">
                <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Menu</p>
                {links.map((link, idx) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 group animate-reveal ${location.pathname === link.path
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                            }`}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                        <link.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${location.pathname === link.path ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                        <span className="font-medium text-[13px] tracking-wide">{link.name}</span>
                        {location.pathname === link.path && (
                            <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                        )}
                    </Link>
                ))}
            </nav>

            <div className="p-6 relative z-10">
                <div className="p-4 rounded-2xl glass border border-white/5 group hover:border-indigo-500/30 transition-colors duration-500">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <p className="text-[11px] text-slate-300 font-medium">All systems running</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Navbar = ({ user, toggleSidebar, logout }) => {
    return (
        <header className="mx-6 mt-6 md:mx-12 md:mt-10 glass border border-white/10 h-20 md:h-24 flex items-center justify-between px-8 md:px-16 sticky top-6 md:top-10 z-40 rounded-2xl md:rounded-3xl shadow-2xl backdrop-blur-3xl transition-all duration-500">
            <div className="flex items-center gap-6">
                <button
                    onClick={toggleSidebar}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 transition-all active:scale-95"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="hidden md:flex flex-col p-5">
                    <h1 className="text-lg font-display font-bold text-white tracking-tight capitalize">
                        {user?.role} Dashboard
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-10">
                <div className="flex items-center gap-6 pl-10 border-l border-white/10">
                    <div className="flex flex-col text-right">
                        <span className="text-sm font-bold text-white tracking-tight">{user?.name}</span>
                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest leading-none mt-1">{user?.role}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-display font-bold text-xs ring-4 ring-indigo-500/5">
                        {user?.name?.charAt(0)}
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="flex items-center space-x-3 px-6 py-4 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] transition-all  active:scale-95 shadow-lg shadow-red-500/5"
                    title="Logout"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Log out</span>
                </button>
            </div>
        </header>
    );
};

export const DashboardLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden font-body selection:bg-indigo-500/30">
            <div className="absolute inset-0 noise-bg opacity-[0.02] pointer-events-none z-50"></div>

            {/* Sidebar for desktop */}
            <div className={`hidden lg:block ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden transition-all duration-500 ease-in-out`}>
                <Sidebar role={user?.role} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative">
                <Navbar
                    user={user}
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    logout={logout}
                />

                <main className="p-8 md:p-12 relative z-10 animate-reveal">
                    {children}
                </main>

                {/* Decorative Bottom Glow */}
                <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -mr-32 -mb-32"></div>
            </div>
        </div>
    );
};
