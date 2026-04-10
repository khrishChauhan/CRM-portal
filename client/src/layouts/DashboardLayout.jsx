import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    LogOut,
    Menu,
    X,
    FolderOpen,
    FileText,
    Building2,
    MessageSquare,
    ArrowLeft
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ role, user, logout }) => {
    const location = useLocation();

    const adminLinks = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Staff', path: '/admin/staff', icon: Users },
        { name: 'Clients', path: '/admin/clients', icon: Briefcase },
        { name: 'Projects', path: '/admin/projects', icon: FolderOpen },
        { name: 'Queries', path: '/admin/queries', icon: MessageSquare },
        { name: 'Access Requests', path: '/admin/access-requests', icon: FileText },
    ];

    const staffLinks = [
        { name: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
        { name: 'My Projects', path: '/staff/projects', icon: FolderOpen },
        { name: 'Queries', path: '/staff/queries', icon: MessageSquare },
    ];

    const clientLinks = [
        { name: 'Live Projects', path: '/client/dashboard', icon: Briefcase },
        { name: 'Project Gallery', path: '/client/projects', icon: FolderOpen },
    ];

    const links = role === 'admin' ? adminLinks : role === 'staff' ? staffLinks : clientLinks;

    return (
        <div className="flex flex-col h-full bg-white text-[#1A1A1A] w-full max-w-[300px] border-r border-gray-100 shadow-xl font-body">
            {/* TOP SECTION */}
            <div className="p-8 flex items-center space-x-4">
                <div className="w-12 h-12 blue-gradient rounded-[14px] flex items-center justify-center shadow-lg shadow-[#173d9f]/20">
                    <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h2 className="font-display font-bold text-lg leading-tight tracking-tight text-[#173d9f]">KHUSHITECH CRM</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Enterprise Portal v1.1</p>
                </div>
            </div>

            {/* MENU ITEMS */}
            <nav className="flex-1 mt-6 px-4 space-y-2">
                {links.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex items-center justify-between px-5 py-4 rounded-[16px] transition-all duration-300 group ${
                                isActive
                                    ? 'bg-[#173d9f]/5 text-[#173d9f] shadow-sm'
                                    : 'text-gray-500 hover:bg-[#faf8f8] hover:text-[#173d9f]'
                            }`}
                        >
                            <div className="flex items-center space-x-4">
                                <link.icon className={`w-5 h-5 ${isActive ? 'text-[#173d9f]' : 'text-gray-400 group-hover:text-[#173d9f]'}`} />
                                <span className={`font-bold text-sm tracking-wide ${isActive ? 'text-[#173d9f]' : 'text-gray-500 group-hover:text-[#173d9f]'}`}>{link.name}</span>
                            </div>
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#f86a1f] shadow-[0_0_8px_rgba(248,106,31,0.5)]"></div>}
                        </Link>
                    );
                })}
            </nav>

            {/* BOTTOM SECTION - USER CARD */}
            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[20px]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#8192c4] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#1A1A1A] truncate max-w-[120px]">{user?.name || 'Guest User'}</span>
                            <span className="text-[10px] font-bold text-[#8192c4] uppercase tracking-widest">{user?.role?.toUpperCase() || 'PUBLIC'}</span>
                        </div>
                    </div>
                    <button 
                        onClick={logout}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const Navbar = ({ user, toggleSidebar, title, isDashboard, onBack }) => {
    return (
        <header className="sticky top-0 z-[100] w-full bg-[#faf8f8]/80 backdrop-blur-xl py-4 px-6 flex items-center justify-between transition-all duration-300 border-b border-gray-100">
            {isDashboard ? (
                <button
                    onClick={toggleSidebar}
                    className="p-3 rounded-xl bg-white border border-gray-100 text-[#173d9f] hover:text-[#f86a1f] transition-all active:scale-95 shadow-sm"
                    aria-label="Toggle Menu"
                >
                    <Menu className="w-6 h-6 stroke-[2.5]" />
                </button>
            ) : (
                <button
                    onClick={onBack}
                    className="p-3 rounded-xl bg-white border border-gray-100 text-[#173d9f] hover:text-[#f86a1f] transition-all active:scale-95 shadow-sm"
                    aria-label="Go Back"
                >
                    <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
                </button>
            )}

            <div className="flex-1 flex justify-center lg:justify-start lg:ml-6">
                <h1 className="text-lg font-display font-bold text-[#1A1A1A] tracking-tight">
                    {title || 'Overview'}
                </h1>
            </div>

            <div className="flex items-center">
                <div className="w-10 h-10 rounded-full border-2 border-white card-shadow overflow-hidden bg-white flex items-center justify-center shadow-sm">
                   {user?.picture ? (
                       <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                       <div className="w-full h-full blue-gradient flex items-center justify-center text-white text-xs font-bold">
                           {user?.name?.charAt(0) || 'U'}
                       </div>
                   )}
                </div>
            </div>
        </header>
    );
};

import Footer from '../components/Footer';

export const DashboardLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Map path to title
    const titles = {
        '/admin/dashboard': 'Admin Dashboard',
        '/admin/staff': 'Manage Staff',
        '/admin/clients': 'Manage Clients',
        '/admin/projects': 'Manage Projects',
        '/admin/access-requests': 'Access Requests',
        '/admin/queries': 'Query Inbox',
        '/staff/dashboard': 'Staff Dashboard',
        '/staff/projects': 'My Assignments',
        '/staff/queries': 'Query Inbox',
        '/client/dashboard': 'Overview',
        '/client/projects': 'Project Gallery',
    };

    const currentTitle = titles[location.pathname] || 'Dashboard';

    const isDashboard = location.pathname.endsWith('/dashboard');
    const navigate = useNavigate();

    const handleBack = () => {
        const role = user?.role;
        if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'staff') navigate('/staff/dashboard');
        else if (role === 'client') navigate('/client/dashboard');
        else navigate('/'); // Fallback
    };

    // Close sidebar on route change (for mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location]);

    return (
        <div className="flex h-screen bg-[#faf8f8] overflow-hidden font-body selection:bg-[#f86a1f]/20 relative text-[#1A1A1A]">
            
            {/* Sidebar Overlay (Mobile & Desktop) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed inset-y-0 left-0 z-[120] w-[80%] max-w-[300px] transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                ${!isDashboard ? 'hidden' : ''}
            `}>
                <Sidebar role={user?.role} user={user} logout={logout} />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <Navbar
                    user={user}
                    title={currentTitle}
                    isDashboard={isDashboard}
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    onBack={handleBack}
                />

                <main className="flex-1 overflow-y-auto flex flex-col scrollbar-hide">
                    <div className="max-w-7xl mx-auto w-full flex-1 p-4 sm:p-6 md:p-8">
                        {children}
                    </div>
                    <div className="w-full mt-auto">
                        <Footer />
                    </div>
                </main>
            </div>
        </div>
    );
};

