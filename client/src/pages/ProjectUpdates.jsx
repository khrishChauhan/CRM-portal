import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft, Send, MapPin, Loader2,
    Clock, X, AlertCircle, CheckCircle, Maximize2, ExternalLink, Camera,
    MessageSquare, CheckCircle2
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
    const [stamping, setStamping] = useState(false);

    const [toast, setToast] = useState(null);
    const [lightbox, setLightbox] = useState(null);

    const canPost = user?.role === 'admin' || user?.role === 'staff';
    const isClient = user?.role === 'client';

    // ── Queries State ──
    const [activeTab, setActiveTab] = useState(isClient ? 'overview' : 'updates'); // 'updates', 'queries', 'overview'
    const [queries, setQueries] = useState([]);
    const [queriesLoading, setQueriesLoading] = useState(false);
    const [newQuery, setNewQuery] = useState({ title: '', message: '' });
    const [submitQueryLoading, setSubmitQueryLoading] = useState(false);
    const [responseMap, setResponseMap] = useState({}); // { queryId: responseText }
    const [submittingResponse, setSubmittingResponse] = useState(null); // queryId

    // ── Fetch updates ──
    const fetchUpdates = useCallback(async () => {
        if (isClient) return; // Don't fetch updates for clients
        try {
            const { data } = await api.get(`/projects/${id}/updates`);
            setUpdates(data.data.updates);
            setProject(data.data.project);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load updates', 'error');
        } finally {
            setLoading(false);
        }
    }, [id, isClient]);

    const fetchProjectDetails = useCallback(async () => {
        try {
            const { data } = await api.get(`/projects/${id}`);
            setProject(data.data);
        } catch (err) {
            console.error('Failed to fetch project details', err);
        } finally {
            if (isClient) setLoading(false);
        }
    }, [id, isClient]);


    const fetchQueries = useCallback(async () => {
        setQueriesLoading(true);
        try {
            const { data } = await api.get(`/projects/${id}/queries`);
            setQueries(data.data);
        } catch (err) {
            console.error('Failed to fetch queries', err);
        } finally {
            setQueriesLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProjectDetails();
        if (!isClient) {
            fetchUpdates();
        }
        if (activeTab === 'queries') {
            fetchQueries();
        }
    }, [fetchUpdates, fetchQueries, fetchProjectDetails, activeTab, isClient]);

    // ── Toast ──
    const showToast = (msg, type = 'success') => {
        setToast({ message: msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Geolocation helper (returns a promise) ──
    const requestGPS = (timeout = 10000) => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                (err) => reject(err),
                { enableHighAccuracy: true, timeout }
            );
        });
    };

    const fetchAddress = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (e) {
            console.error('Failed to fetch address:', e);
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    };

    // ── Manual location capture ──
    const captureLocation = async () => {
        setLocLoading(true);
        try {
            const loc = await requestGPS(10000);
            const address = await fetchAddress(loc.latitude, loc.longitude);
            setLocation({ ...loc, address });
            showToast('Location captured');
        } catch {
            showToast('Could not get location. Please allow location access and try again.', 'error');
        } finally {
            setLocLoading(false);
        }
    };

    // Mobile auto-capture
    useEffect(() => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile && canPost) {
            captureLocation();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canPost]);

    // ── Canvas watermark stamping ──
    const stampImageWithWatermark = (file, address) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(objectUrl);

                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                // Draw the original image
                ctx.drawImage(img, 0, 0);

                // Format timestamp: "14 Mar 2026 13:15"
                const now = new Date();
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const timeStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                // Build watermark lines
                const lines = [];
                if (address) {
                    lines.push({ icon: '📍', text: address });
                }
                lines.push({ icon: '🕒', text: timeStr });

                // Calculate sizing relative to image dimensions
                const fontSize = Math.max(Math.round(img.width * 0.028), 14);
                const padding = Math.max(Math.round(img.width * 0.02), 10);
                const lineHeight = fontSize * 1.7;
                const boxHeight = lines.length * lineHeight + padding * 2;
                const boxY = img.height - boxHeight;

                // Draw semi-transparent dark rectangle at bottom
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(0, boxY, img.width, boxHeight);

                // Draw white watermark text
                ctx.fillStyle = '#FFFFFF';
                ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
                ctx.textBaseline = 'top';
                lines.forEach((line, i) => {
                    ctx.fillText(`${line.icon} ${line.text}`, padding, boxY + padding + i * lineHeight);
                });

                // Convert canvas to JPEG blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Canvas toBlob failed'));
                    },
                    'image/jpeg',
                    0.92
                );
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Failed to load image'));
            };
            img.src = objectUrl;
        });
    };

    // ── Image handling ──
    const handleImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be under 5MB', 'error');
            return;
        }

        setStamping(true);

        // Get GPS coordinates for watermark + auto-capture location
        let currentLoc = location;
        if (!currentLoc) {
            try {
                const loc = await requestGPS(5000);
                const address = await fetchAddress(loc.latitude, loc.longitude);
                currentLoc = { ...loc, address };
                setLocation(currentLoc);
            } catch {
                console.warn('Geolocation unavailable — watermark will include timestamp only');
            }
        }

        // Stamp watermark onto image using Canvas
        try {
            const stampedBlob = await stampImageWithWatermark(file, currentLoc?.address);
            const stampedFile = new File([stampedBlob], file.name, { type: 'image/jpeg' });
            setImageFile(stampedFile);
            setImagePreview(URL.createObjectURL(stampedBlob));
        } catch (err) {
            console.error('Watermark stamping failed, using original file:', err);
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        } finally {
            setStamping(false);
        }
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

        // ── Location is REQUIRED ──
        if (!location) {
            showToast('Please pin your location before posting an update.', 'error');
            return;
        }

        setPosting(true);
        await submitUpdate(location);
    };

    const submitUpdate = async (loc) => {
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

    // ── Project Queries Handlers ──
    const handleQuerySubmit = async (e) => {
        e.preventDefault();
        if (!newQuery.title.trim() || !newQuery.message.trim()) {
            showToast('Title and message are required', 'error');
            return;
        }

        setSubmitQueryLoading(true);
        try {
            await api.post(`/projects/${id}/query`, newQuery);
            showToast('Your query has been sent to the project team.');
            setNewQuery({ title: '', message: '' });
            fetchQueries();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to submit query', 'error');
        } finally {
            setSubmitQueryLoading(false);
        }
    };

    const handleRespond = async (queryId) => {
        const responseText = responseMap[queryId];
        if (!responseText || !responseText.trim()) {
            showToast('Please write a response', 'error');
            return;
        }

        setSubmittingResponse(queryId);
        try {
            await api.post(`/queries/${queryId}/respond`, { response: responseText.trim() });
            showToast('Response sent');
            setResponseMap(prev => ({ ...prev, [queryId]: '' }));
            fetchQueries();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to send response', 'error');
        } finally {
            setSubmittingResponse(null);
        }
    };

    // ── Format time ──
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
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">Loading Project Data...</p>
            </div>
        );
    }

    return (
        <div className="animate-reveal flex flex-col h-[calc(100vh-6rem)]">
            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl glass-dark border border-white/10 text-xs font-bold uppercase tracking-widest animate-in slide-in-from-right-10 duration-500 max-w-[90vw] ${toast.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                    <span className="truncate">{toast.message}</span>
                </div>
            )}

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 mb-4 sm:mb-5 flex-shrink-0">
                <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
                    <button
                        onClick={goBack}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl glass border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500/30 transition-all active:scale-95 flex-shrink-0"
                    >
                        <ArrowLeft className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white tracking-tight text-gradient truncate">
                            {project?.projectName || 'Project'}
                        </h1>
                        <p className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5 italic font-mono truncate">
                            {project?.projectCode} // {updates.length} Updates
                        </p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex glass p-1 rounded-xl sm:rounded-2xl border border-white/5 shadow-2xl w-full sm:w-auto overflow-x-auto scrollbar-none">
                    {!isClient ? (
                        <>
                            <button
                                onClick={() => setActiveTab('updates')}
                                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'updates' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                            >
                                Updates
                            </button>
                            <button
                                onClick={() => setActiveTab('queries')}
                                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'queries' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                            >
                                Queries
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('queries')}
                                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'queries' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                            >
                                Queries
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Feed Content ── */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin mb-3">
                {activeTab === 'overview' ? (
                    /* ── Overview Tab ── */
                    <div className="space-y-4 sm:space-y-6 animate-reveal">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div className="glass p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-white/5 shadow-xl space-y-6">
                                <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] border-l-2 border-indigo-500/50 pl-4">Project Information</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                            <MapPin className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Site Address</p>
                                            <p className="text-white font-medium">{project?.siteAddress || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                            <Clock className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Expected Completion</p>
                                            <p className="text-white font-medium">
                                                {project?.expectedCompletion ? new Date(project.expectedCompletion).toLocaleDateString() : 'TBD'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-white/5 shadow-xl flex flex-col justify-center gap-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] border-l-2 border-indigo-500/50 pl-4">Current Status</h3>
                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest ${
                                        project?.projectStatus === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        project?.projectStatus === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                    }`}>
                                        {project?.projectStatus || 'Planned'}
                                    </span>
                                </div>
                                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-slate-400 text-sm leading-relaxed italic">
                                        {project?.description || 'No project description available.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Project Manager Details */}
                        <div className="glass p-5 sm:p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 group hover:border-indigo-500/20 transition-all">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-display font-bold text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                                {project?.projectManager?.name?.charAt(0)?.toUpperCase() || 'M'}
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic leading-none mb-1.5">Your Project Manager</p>
                                <p className="text-lg sm:text-xl font-display font-bold text-white tracking-tight uppercase group-hover:text-indigo-400 transition-colors">
                                    {project?.projectManager?.name || 'Not Assigned'}
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Responsible for overseeing your project's progress and quality.</p>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'updates' ? (
                    updates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-28 text-slate-600">
                            <div className="w-20 h-20 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-white/10 shadow-inner">
                                <Send className="w-8 h-8 opacity-30" />
                            </div>
                            <h3 className="text-lg font-display font-bold text-white/50 tracking-tight">No Updates Yet</h3>
                            <p className="text-sm mt-2 font-medium">Be the first to post an update for this project.</p>
                        </div>
                    ) : (
                        updates.map((update, idx) => (
                            <div
                                key={update._id}
                                className="glass p-4 sm:p-5 rounded-2xl border border-white/5 shadow-lg group hover:border-indigo-500/20 transition-all duration-500 relative overflow-hidden"
                                style={{ animationDelay: `${idx * 0.04}s` }}
                            >
                                {/* Decorative glow */}
                                <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 blur-[50px] -mr-14 -mt-14 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                <div className="relative z-10">
                                    {/* ── Author row ── */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-display font-bold text-xs flex-shrink-0 group-hover:scale-110 transition-transform">
                                            {update.createdBy?.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-display font-bold text-white text-sm sm:text-base tracking-tight group-hover:text-indigo-400 transition-colors">
                                                    {update.createdBy?.name || 'Unknown'}
                                                </span>
                                                <span className={`inline-flex px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-widest border ${roleBadge(update.role)}`}>
                                                    {update.role}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.12em] mt-0.5 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {formatTime(update.createdAt)}
                                            </p>
                                        </div>

                                        {/* Location badge */}
                                        {update.location?.latitude && update.location?.longitude && (
                                            <a
                                                href={`https://www.google.com/maps?q=${update.location.latitude},${update.location.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-3 py-2 glass-dark border border-white/10 rounded-xl text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex-shrink-0"
                                            >
                                                <MapPin className="w-3 h-3" />
                                                <span className="hidden sm:inline">Location</span>
                                                <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                        )}
                                    </div>

                                    {/* ── Message ── */}
                                    <p className="text-slate-300 text-sm sm:text-[15px] font-medium leading-relaxed whitespace-pre-wrap">
                                        {update.message}
                                    </p>

                                    {/* ── Image ── */}
                                    {update.imageUrl && (
                                        <div className="mt-3 relative group/img cursor-pointer" onClick={() => setLightbox(update)}>
                                            <img
                                                src={update.imageUrl}
                                                alt="Update attachment"
                                                className="w-full max-h-[220px] sm:max-h-[280px] object-cover rounded-xl border border-white/10 shadow-lg group-hover/img:border-indigo-500/30 transition-all"
                                            />
                                            <div className="absolute inset-0 bg-slate-950/0 group-hover/img:bg-slate-950/40 rounded-xl flex items-center justify-center transition-all">
                                                <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    /* ── Queries Tab ── */
                    <div className="space-y-4">
                        {user?.role === 'client' && (
                            <div className="glass-dark border border-white/10 rounded-2xl p-6 shadow-xl mb-6">
                                <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                                    Ask a Query
                                </h3>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Query Title"
                                        value={newQuery.title}
                                        onChange={(e) => setNewQuery({ ...newQuery, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                                    />
                                    <textarea
                                        placeholder="Your Question / Message"
                                        rows={3}
                                        value={newQuery.message}
                                        onChange={(e) => setNewQuery({ ...newQuery, message: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all resize-none font-medium"
                                    />
                                    <button
                                        onClick={handleQuerySubmit}
                                        disabled={submitQueryLoading || !newQuery.title.trim() || !newQuery.message.trim()}
                                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-30 flex items-center justify-center gap-2.5"
                                    >
                                        {submitQueryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Submit Query
                                    </button>
                                </div>
                            </div>
                        )}

                        {queriesLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Loading Queries...</p>
                            </div>
                        ) : queries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                                <MessageSquare className="w-12 h-12 opacity-20 mb-4" />
                                <h3 className="text-lg font-display font-bold text-white/50">No Queries Yet</h3>
                                <p className="text-sm mt-1">Questions related to this project will appear here.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {queries.map((q) => (
                                    <div key={q._id} className={`${isClient ? 'bg-transparent' : 'glass p-5 rounded-2xl border border-white/5 shadow-lg group hover:border-indigo-500/20 transition-all relative overflow-hidden'}`}>
                                        {isClient ? (
                                            /* ── Chat Style for Client ── */
                                            <div className="space-y-4 mb-8">
                                                <div className="flex flex-col items-end">
                                                    <div className="max-w-[85%] bg-indigo-600/20 border border-indigo-500/30 rounded-3xl rounded-tr-none p-5 shadow-lg relative">
                                                        <div className="flex items-center justify-between gap-4 mb-2">
                                                            <h4 className="text-white font-bold text-sm tracking-tight">{q.title}</h4>
                                                            <span className="text-[9px] font-bold text-slate-500">{formatTime(q.createdAt)}</span>
                                                        </div>
                                                        <p className="text-slate-300 text-sm leading-relaxed">{q.message}</p>
                                                        
                                                        {/* Status Indicator */}
                                                        <div className={`absolute -left-2 top-0 px-2 py-1 rounded-lg text-[7px] font-bold uppercase tracking-widest shadow-xl border ${
                                                            q.status === 'open' ? 'bg-amber-500 text-white border-amber-400' : 'bg-emerald-500 text-white border-emerald-400'
                                                        }`}>
                                                            {q.status}
                                                        </div>
                                                    </div>
                                                </div>

                                                {q.response ? (
                                                    <div className="flex flex-col items-start">
                                                        <div className="max-w-[85%] glass-dark border border-white/10 rounded-3xl rounded-tl-none p-5 shadow-xl">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
                                                                    {q.respondedBy?.name?.charAt(0) || 'T'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-emerald-400 text-[10px] font-bold lowercase tracking-widest flex items-center gap-1.5">
                                                                        {q.respondedBy?.name} (Team)
                                                                    </p>
                                                                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{formatTime(q.respondedAt)}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-slate-300 text-[13px] leading-relaxed italic border-l-2 border-emerald-500/30 pl-3">
                                                                "{q.response}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="pl-4">
                                                        <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest animate-pulse flex items-center gap-2">
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            Waiting for team response...
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* ── Card Style for Admin/Staff ── */
                                            <>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                                            {q.clientId?.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-bold text-sm">{q.clientId?.name}</p>
                                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                                                <Clock className="w-3 h-3" />
                                                                {formatTime(q.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest border ${
                                                        q.status === 'open' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                                                        q.status === 'answered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                    }`}>
                                                        {q.status}
                                                    </span>
                                                </div>
                                                <h4 className="text-white font-bold text-base mb-2">{q.title}</h4>
                                                <p className="text-slate-400 text-sm leading-relaxed mb-4">{q.message}</p>

                                                {q.response ? (
                                                    <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5 border-l-2 border-l-emerald-500/50">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Response Sent
                                                            </p>
                                                            <span className="text-[9px] font-bold text-slate-600">{formatTime(q.respondedAt)}</span>
                                                        </div>
                                                        <p className="text-slate-300 text-sm italic">"{q.response}"</p>
                                                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-2">By {q.respondedBy?.name}</p>
                                                    </div>
                                                ) : (
                                                    (user?.role === 'admin' || user?.role === 'staff') && (
                                                        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                                                            <textarea
                                                                placeholder="Write a response..."
                                                                rows={2}
                                                                value={responseMap[q._id] || ''}
                                                                onChange={(e) => setResponseMap({ ...responseMap, [q._id]: e.target.value })}
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                                                            />
                                                            <button
                                                                onClick={() => handleRespond(q._id)}
                                                                disabled={submittingResponse === q._id || !(responseMap[q._id]?.trim())}
                                                                className="w-full h-9 bg-emerald-600 hover:bg-emerald-50 text-emerald-600 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                                                                style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                                                            >
                                                                {submittingResponse === q._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                                                Send Reply
                                                            </button>
                                                        </div>
                                                    )
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Input Panel (Admin/Staff only) ── */}
            {canPost && activeTab === 'updates' && (
                <div className="glass-dark border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden flex-shrink-0">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-500/5 blur-[70px] -ml-20 -mt-20 pointer-events-none"></div>

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="mb-3 relative inline-block">
                            <img src={imagePreview} alt="Preview" className="h-20 sm:h-24 w-auto rounded-xl border border-white/10 shadow-lg" />
                            <button
                                onClick={clearImage}
                                className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-400 transition-colors shadow-lg"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Stamping indicator */}
                    {stamping && (
                        <div className="mb-3 flex items-center gap-2 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Processing image...
                        </div>
                    )}

                    <div className="flex flex-col gap-3 relative z-10">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write a project update..."
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 sm:px-5 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none font-medium"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    handlePost();
                                }
                            }}
                        />

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                            {/* Image upload */}
                            <label className="flex-1 group/upload h-10 sm:h-11 px-3 sm:px-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center sm:justify-start gap-2.5 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 transition-all cursor-pointer active:scale-[0.98]">
                                <Camera className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover/upload:scale-110 transition-transform" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Add Photo</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                            </label>

                            {/* Pin Location */}
                            <button
                                onClick={captureLocation}
                                disabled={locLoading}
                                title="Pin Location"
                                className={`flex-1 h-10 sm:h-11 px-3 sm:px-4 rounded-xl border flex items-center justify-center sm:justify-start gap-2.5 transition-all active:scale-[0.98] ${location ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30'}`}
                            >
                                {locLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                                <span className="text-[9px] font-bold uppercase tracking-widest">
                                    {location ? `Pinned (${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)})` : 'Pin Location'}
                                </span>
                            </button>

                            {/* Post */}
                            <button
                                onClick={handlePost}
                                disabled={posting || !message.trim() || stamping || !location}
                                className="sm:flex-[0.6] h-10 sm:h-11 px-6 sm:px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2.5 active:scale-[0.98]"
                            >
                                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Post
                            </button>
                        </div>

                        {/* Status bar */}
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-slate-700 font-medium">
                                Ctrl + Enter to post
                            </p>
                            {!location && (
                                <p className="text-[10px] text-amber-500/70 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3" />
                                    Location required
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Lightbox Modal ── */}
            {lightbox && (
                <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-3 sm:p-4 pt-10 sm:pt-4">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-500" onClick={() => setLightbox(null)}></div>
                    <div className="relative z-[210] w-full max-w-4xl animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
                        <div className="glass-dark border border-white/10 rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] flex flex-col">
                            {/* Image container with flex-1 and min-h-0 to allow proper scaling */}
                            <div className="flex-1 min-h-0 bg-slate-900 flex items-center justify-center">
                                <img
                                    src={lightbox.imageUrl}
                                    alt="Full size"
                                    className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain"
                                />
                            </div>

                            {/* Info bar */}
                            <div className="shrink-0 p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-white/5 bg-slate-950/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
                                        {lightbox.createdBy?.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white font-bold text-sm truncate">{lightbox.createdBy?.name}</p>
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{formatTime(lightbox.createdAt)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3">
                                    {lightbox.location?.latitude && lightbox.location?.longitude && (
                                        <a
                                            href={`https://www.google.com/maps?q=${lightbox.location.latitude},${lightbox.location.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 glass border border-white/10 rounded-xl text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                                        >
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="truncate">View Location</span>
                                        </a>
                                    )}
                                    <button
                                        onClick={() => setLightbox(null)}
                                        className="w-10 h-10 rounded-xl glass border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all flex-shrink-0"
                                    >
                                        <X className="w-5 h-5" />
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
