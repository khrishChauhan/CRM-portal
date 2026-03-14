import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    LogOut,
    Menu,
    X,
    FolderOpen,
    FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ role }) => {
    const location = useLocation();

    const adminLinks = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Staff', path: '/admin/staff', icon: Users },
        { name: 'Clients', path: '/admin/clients', icon: Briefcase },
        { name: 'Projects', path: '/admin/projects', icon: FolderOpen },
        { name: 'Access Requests', path: '/admin/access-requests', icon: FileText },

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
        <header className="sticky top-0 z-[100] w-full bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 py-3 sm:py-4 px-4 sm:px-8 md:px-12 flex items-center justify-between transition-all duration-500">
            <div className="flex items-center gap-3 sm:gap-6">
                <button
                    onClick={toggleSidebar}
                    className="p-3 sm:p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 transition-all active:scale-95 group focus:ring-2 focus:ring-indigo-500/40 outline-none"
                    aria-label="Toggle Menu"
                >
                    <Menu className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />
                </button>

                <div className="flex flex-col">
                    <h1 className="text-base sm:text-lg font-display font-bold text-white tracking-tight capitalize truncate max-w-[140px] sm:max-w-none">
                        {user?.role} Dashboard
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6 lg:gap-10">
                <div className="flex items-center gap-3 sm:gap-6 pl-3 sm:pl-10 border-l border-white/10">
                    <div className="hidden sm:flex flex-col text-right">
                        <span className="text-xs sm:text-sm font-bold text-white tracking-tight">{user?.name}</span>
                        <span className="text-[9px] sm:text-[10px] text-indigo-400 font-bold uppercase tracking-widest leading-none mt-1">{user?.role}</span>
                    </div>
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-display font-bold text-xs shadow-lg shadow-indigo-500/5 group-hover:scale-105 transition-transform">
                        {user?.name?.charAt(0)}
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="flex items-center justify-center p-3 sm:px-6 sm:py-4 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-red-500/5 focus:ring-2 focus:ring-red-500/40 outline-none"
                    title="Logout"
                >
                    <LogOut className="w-4 h-4 sm:mr-3" />
                    <span className="hidden sm:inline">Log out</span>
                </button>
            </div>
        </header>
    );
};

export const DashboardLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Close sidebar on route change (for mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location]);

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden font-body selection:bg-indigo-500/30 relative">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 noise-bg opacity-[0.02] pointer-events-none z-[60]"></div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] lg:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed inset-y-0 left-0 z-[80] w-64 transform transition-transform duration-500 ease-in-out lg:translate-x-0 lg:static lg:inset-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <Sidebar role={user?.role} />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <Navbar
                    user={user}
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    logout={logout}
                />

                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-12 relative z-10 scrollbar-hide">
                    <div className="max-w-[1600px] mx-auto animate-reveal">
                        {children}
                    </div>

                    {/* Decorative Bottom Glow */}
                    <div className="fixed bottom-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-500/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none -mr-32 -mb-32"></div>
                </main>
            </div>
        </div>
    );
};
