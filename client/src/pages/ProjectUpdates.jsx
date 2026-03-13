import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft, Send, Image as ImageIcon, MapPin, Loader2,
    Clock, X, AlertCircle, CheckCircle, Maximize2, ExternalLink, Camera
} from 'lucide-react';

const ProjectUpdates = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const feedRef = useRef(null);

    const [updates, setUpdates] = useState([]);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);

    const [message, setMessage] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [location, setLocation] = useState(null);
    const [locLoading, setLocLoading] = useState(false);

    const [toast, setToast] = useState(null);
    const [lightbox, setLightbox] = useState(null);

    const canPost = user?.role === 'admin' || user?.role === 'staff';

    // ── Fetch updates ──
    const fetchUpdates = useCallback(async () => {
        try {
            const { data } = await api.get(`/projects/${id}/updates`);
            setUpdates(data.data.updates);
            setProject(data.data.project);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load updates', 'error');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchUpdates();
    }, [fetchUpdates]);

    // ── Geolocation ──
    const captureLocation = () => {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by your browser', 'error');
            return;
        }
        setLocLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                setLocLoading(false);
                showToast('Location captured');
            },
            (err) => {
                console.warn('Geolocation error:', err.message);
                setLocLoading(false);
                showToast('Location unavailable — update will be posted without it', 'error');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // ── Image handling ──
    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be under 5MB', 'error');
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    // ── Post update ──
    const handlePost = async () => {
        if (!message.trim()) {
            showToast('Please write a message', 'error');
            return;
        }

        setPosting(true);

        // Capture location automatically before posting
        const postUpdate = async (loc) => {
            try {
                const formData = new FormData();
                formData.append('message', message.trim());
                if (imageFile) formData.append('image', imageFile);
                if (loc) {
                    formData.append('latitude', loc.latitude);
                    formData.append('longitude', loc.longitude);
                }

                await api.post(`/projects/${id}/updates`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                showToast('Update posted successfully');
                setMessage('');
                clearImage();
                setLocation(null);
                fetchUpdates();
            } catch (err) {
                showToast(err.response?.data?.message || 'Failed to post update', 'error');
            } finally {
                setPosting(false);
            }
        };

        // Try to get location, post regardless
        if (navigator.geolocation && !location) {
            navigator.geolocation.getCurrentPosition(
                (pos) => postUpdate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                () => postUpdate(null),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        } else {
            postUpdate(location);
        }
    };

    const showToast = (msg, type = 'success') => {
        setToast({ message: msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const formatTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHr = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHr < 24) return `${diffHr}h ago`;
        if (diffDay < 7) return `${diffDay}d ago`;
        return d.toLocaleDateString();
    };

    const goBack = () => {
        if (user?.role === 'admin') navigate('/admin/projects');
        else if (user?.role === 'staff') navigate('/staff/projects');
        else navigate('/client/projects');
    };

    // ── Role badge colors ──
    const roleBadge = (role) => {
        const map = {
            admin: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
            staff: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            client: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
        };
        return map[role] || 'bg-white/10 text-slate-400 border-white/10';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px]">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-6" />
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">Loading Update Feed...</p>
            </div>
        );
    }

    return (
        <div className="animate-reveal pb-8 flex flex-col h-[calc(100vh-8rem)]">
            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed top-8 right-8 z-[100] flex items-center gap-4 px-6 py-4 rounded-3xl shadow-2xl glass-dark border border-white/10 text-sm font-bold uppercase tracking-widest animate-in slide-in-from-right-10 duration-500 ${toast.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    {toast.message}
                </div>
            )}

            {/* ── Header ── */}
            <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                <button
                    onClick={goBack}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl glass border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500/30 transition-all active:scale-95 flex-shrink-0"
                >
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white tracking-tight text-gradient truncate">
                        {project?.projectName || 'Project'}
                    </h1>
                    <p className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] mt-1 italic font-mono truncate">
                        {project?.projectCode} // {updates.length} Updates
                    </p>
                </div>
            </div>

            {/* ── Feed ── */}
            <div ref={feedRef} className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin mb-6">
                {updates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 text-slate-600">
                        <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 ring-1 ring-white/10 shadow-inner">
                            <Send className="w-10 h-10 opacity-30" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-white/50 tracking-tight">No Updates Yet</h3>
                        <p className="text-sm mt-3 font-medium">Be the first to post an update for this project.</p>
                    </div>
                ) : (
                    updates.map((update, idx) => (
                        <div
                            key={update._id}
                            className="glass p-8 rounded-[2.5rem] border border-white/5 shadow-xl group hover:border-indigo-500/20 transition-all duration-500 relative overflow-hidden"
                            style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                            {/* Decorative glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            <div className="relative z-10">
                                {/* ── Author row ── */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-display font-bold text-xs sm:text-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                                            {update.createdBy?.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="sm:hidden">
                                            <span className="font-display font-bold text-white text-base tracking-tight group-hover:text-indigo-400 transition-colors block">
                                                {update.createdBy?.name || 'Unknown'}
                                            </span>
                                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-widest border mt-1 ${roleBadge(update.role)}`}>
                                                {update.role}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="hidden sm:flex items-center gap-3 flex-wrap">
                                            <span className="font-display font-bold text-white text-lg tracking-tight group-hover:text-indigo-400 transition-colors">
                                                {update.createdBy?.name || 'Unknown'}
                                            </span>
                                            <span className={`inline-flex px-3 py-1 rounded-xl text-[9px] font-bold uppercase tracking-widest border ${roleBadge(update.role)}`}>
                                                {update.role}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.15em] mt-1 flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatTime(update.createdAt)}
                                        </p>
                                    </div>

                                    {/* Location badge */}
                                    {update.location?.latitude && update.location?.longitude && (
                                        <a
                                            href={`https://www.google.com/maps?q=${update.location.latitude},${update.location.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2.5 glass-dark border border-white/10 rounded-2xl text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex-shrink-0"
                                        >
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">View Location</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>

                                {/* ── Message ── */}
                                <p className="text-slate-300 text-[15px] font-medium leading-relaxed whitespace-pre-wrap mb-2">
                                    {update.message}
                                </p>

                                {/* ── Image ── */}
                                {update.imageUrl && (
                                    <div className="mt-6 relative group/img cursor-pointer" onClick={() => setLightbox(update)}>
                                        <img
                                            src={update.imageUrl}
                                            alt="Update attachment"
                                            className="w-full max-h-80 object-cover rounded-2xl border border-white/10 shadow-lg group-hover/img:border-indigo-500/30 transition-all"
                                        />
                                        <div className="absolute inset-0 bg-slate-950/0 group-hover/img:bg-slate-950/40 rounded-2xl flex items-center justify-center transition-all">
                                            <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── Input Panel (Admin/Staff only) ── */}
            {canPost && (
                <div className="glass-dark border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-48 h-48 bg-indigo-500/5 blur-[80px] -ml-24 -mt-24 pointer-events-none"></div>

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="mb-6 relative inline-block">
                            <img src={imagePreview} alt="Preview" className="h-24 w-auto rounded-2xl border border-white/10 shadow-lg" />
                            <button
                                onClick={clearImage}
                                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-400 transition-colors shadow-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Location indicator */}
                    {location && (
                        <div className="mb-4 flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                            <MapPin className="w-3.5 h-3.5" />
                            Location captured ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
                        </div>
                    )}

                    <div className="flex flex-col gap-4 relative z-10">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write a project update..."
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none font-medium"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    handlePost();
                                }
                            }}
                        />

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {/* Image upload */}
                            <label className="flex-1 group/upload h-12 px-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center sm:justify-start gap-3 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 transition-all cursor-pointer active:scale-[0.98]">
                                <Camera className="w-5 h-5 group-hover/upload:scale-110 transition-transform" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Attach Image</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                            </label>

                            {/* Location */}
                            <button
                                onClick={captureLocation}
                                disabled={locLoading}
                                title="Pin Location"
                                className={`flex-1 h-12 px-4 rounded-2xl border flex items-center justify-center sm:justify-start gap-3 transition-all active:scale-[0.98] ${location ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30'}`}
                            >
                                {locLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                                <span className="text-[9px] font-bold uppercase tracking-widest">{location ? 'Pinned' : 'Pin Location'}</span>
                            </button>

                            {/* Post */}
                            <button
                                onClick={handlePost}
                                disabled={posting || !message.trim()}
                                className="sm:flex-[0.5] h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Post
                            </button>
                        </div>
                    </div>

                    <p className="text-[10px] text-slate-700 mt-4 font-medium text-center">
                        Ctrl + Enter to post · Location auto-captured on send
                    </p>
                </div>
            )}

            {/* ── Lightbox Modal ── */}
            {lightbox && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-500" onClick={() => setLightbox(null)}></div>
                    <div className="relative z-[210] w-full max-w-4xl animate-in zoom-in-95 duration-500">
                        <div className="glass-dark border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)]">
                            {/* Image */}
                            <img
                                src={lightbox.imageUrl}
                                alt="Full size"
                                className="w-full max-h-[70vh] object-contain bg-slate-900"
                            />

                            {/* Info bar */}
                            <div className="p-8 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                        {lightbox.createdBy?.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">{lightbox.createdBy?.name}</p>
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{formatTime(lightbox.createdAt)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {lightbox.location?.latitude && lightbox.location?.longitude && (
                                        <a
                                            href={`https://www.google.com/maps?q=${lightbox.location.latitude},${lightbox.location.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-6 py-3 glass border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                                        >
                                            <MapPin className="w-4 h-4" />
                                            View Location
                                        </a>
                                    )}
                                    <button
                                        onClick={() => setLightbox(null)}
                                        className="w-12 h-12 rounded-2xl glass border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectUpdates;
