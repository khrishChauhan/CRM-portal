import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft, Send, MapPin, Loader2,
    Clock, X, AlertCircle, CheckCircle, Maximize2, ExternalLink, Camera,
    MessageSquare, CheckCircle2, Image as ImageIcon
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

    useEffect(() => {
        if (lightbox) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [lightbox]);

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

        // Photo is now MANDATORY for queries
        if (!imageFile) {
            showToast('A live photo is mandatory to submit a query.', 'error');
            return;
        }

        // Location is REQUIRED if image is attached
        if (imageFile && !location) {
            showToast('Location is required for the query photo.', 'error');
            return;
        }

        setSubmitQueryLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', newQuery.title.trim());
            formData.append('message', newQuery.message.trim());
            if (imageFile) formData.append('image', imageFile);
            if (location) {
                formData.append('latitude', location.latitude);
                formData.append('longitude', location.longitude);
            }

            await api.post(`/projects/${id}/query`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            showToast('Your query has been sent to the project team.');
            setNewQuery({ title: '', message: '' });
            clearImage();
            setLocation(null);
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
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-body">Syncing Project Data...</p>
            </div>
        );
    }

    return (
        <div className="animate-reveal flex flex-col h-[calc(100vh-6rem)] overflow-x-hidden">
            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[200] flex items-center gap-4 px-6 py-4 rounded-2xl bg-white border border-gray-100 shadow-2xl text-[10px] font-bold uppercase tracking-[0.15em] animate-in slide-in-from-right-10 duration-500 max-w-[90vw] ${toast.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                    <span className="truncate">{toast.message}</span>
                </div>
            )}

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 mb-4 sm:mb-5 flex-shrink-0">
                <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
                    <button
                        onClick={goBack}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white card-shadow border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all active:scale-95 flex-shrink-0"
                    >
                        <ArrowLeft className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-[#1A1A1A] tracking-tight truncate">
                            {project?.projectName || 'Project'}
                        </h1>
                        <p className="text-gray-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-1 truncate">
                            ID: {project?.projectCode} • {updates.length} Updates
                        </p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-gray-200 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto scrollbar-none">
                    {!isClient ? (
                        <>
                            <button
                                onClick={() => setActiveTab('updates')}
                                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'updates' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Updates
                            </button>
                            <button
                                onClick={() => setActiveTab('queries')}
                                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'queries' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Queries
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
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
            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 pr-1 scrollbar-thin mb-3">
                {activeTab === 'overview' ? (
                    /* ── Overview Tab ── */
                    <div className="space-y-4 sm:space-y-6 animate-reveal">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div className="bg-white p-6 sm:p-10 rounded-[28px] card-shadow border border-gray-50 space-y-8">
                                <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] border-l-2 border-indigo-500/50 pl-4">Project Information</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-11 h-11 rounded-[14px] bg-gray-50 flex items-center justify-center border border-gray-100">
                                            <MapPin className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Site Address</p>
                                            <p className="text-[#1A1A1A] font-bold">{project?.siteAddress || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-11 h-11 rounded-[14px] bg-gray-50 flex items-center justify-center border border-gray-100">
                                            <Clock className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Expected Completion</p>
                                            <p className="text-[#1A1A1A] font-bold">
                                                {project?.expectedCompletion ? new Date(project.expectedCompletion).toLocaleDateString() : 'TBD'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 sm:p-10 rounded-[28px] card-shadow border border-gray-50 flex flex-col justify-center gap-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] border-l-2 border-indigo-500/50 pl-4">Current Status</h3>
                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest ${
                                        project?.projectStatus === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        project?.projectStatus === 'In Progress' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                        'bg-gray-100 text-gray-500 border border-gray-200'
                                    }`}>
                                        {project?.projectStatus || 'Planned'}
                                    </span>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-gray-500 text-sm leading-relaxed italic font-medium">
                                        {project?.description || 'No project description available.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Project Manager Details */}
                        <div className="bg-blue-50/50 p-6 sm:p-8 rounded-[28px] border border-blue-100 card-shadow flex flex-col sm:flex-row sm:items-center gap-6 group hover:-translate-y-1 transition-all duration-300">
                            <div className="w-16 h-16 rounded-[20px] blue-gradient flex items-center justify-center text-white font-display font-bold text-2xl flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                                {project?.projectManager?.name?.charAt(0) || 'M'}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-none mb-1">Project Manager</p>
                                <p className="text-xl font-display font-bold text-[#1A1A1A] tracking-tight transition-colors">
                                    {project?.projectManager?.name || 'Not Assigned'}
                                </p>
                                <p className="text-sm text-gray-500 font-medium mt-1 opacity-80">Overseeing progress and ensuring quality standards.</p>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'updates' ? (
                    updates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="w-20 h-20 bg-gray-50 rounded-[24px] flex items-center justify-center mb-6">
                                <Send className="w-10 h-10 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-[#1A1A1A]">No Updates Yet</h3>
                            <p className="text-gray-400 font-medium mt-1">Be the first to post an update for this project.</p>
                        </div>
                    ) : (
                        updates.map((update, idx) => (
                            <div
                                key={update._id}
                                className="bg-white p-6 rounded-[24px] card-shadow border border-gray-50 group hover:border-blue-500/10 transition-all duration-300 relative overflow-hidden"
                                style={{ animationDelay: `${idx * 0.04}s` }}
                            >
                                {/* Decorative glow */}
                                <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 blur-[50px] -mr-14 -mt-14 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                <div className="relative z-10">
                                    {/* ── Author row ── */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full blue-gradient flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0 btn-shadow transition-transform group-hover:scale-105">
                                            {update.createdBy?.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-display font-bold text-[#1A1A1A] text-sm sm:text-base tracking-tight group-hover:text-blue-600 transition-colors">
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
                                                className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-blue-600 hover:border-blue-500/20 hover:bg-white transition-all flex-shrink-0 shadow-sm"
                                            >
                                                <MapPin className="w-3 h-3" />
                                                <span className="hidden sm:inline">Location</span>
                                                <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                        )}
                                    </div>

                                    {/* ── Message ── */}
                                    <p className="text-[#333333] text-sm sm:text-[15px] font-medium leading-relaxed whitespace-pre-wrap">
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
                            <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-xl mb-6">
                                <h3 className="text-lg font-display font-bold text-[#1A1A1A] mb-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-blue-600" />
                                    </div>
                                    Ask a Query
                                </h3>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="What's on your mind?"
                                        value={newQuery.title}
                                        onChange={(e) => setNewQuery({ ...newQuery, title: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                                    />
                                    <textarea
                                        placeholder="Describe your query in detail..."
                                        rows={3}
                                        value={newQuery.message}
                                        onChange={(e) => setNewQuery({ ...newQuery, message: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:border-blue-500/50 transition-all resize-none font-medium"
                                    />

                                    {/* Image Upload for Query */}
                                    <div className="flex flex-col gap-3">
                                        {imagePreview && (
                                            <div className="relative inline-block mt-1">
                                                <img src={imagePreview} alt="Query Preview" className="h-40 w-full object-cover rounded-2xl border-2 border-white shadow-md" />
                                                <button
                                                    onClick={clearImage}
                                                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg border-2 border-white"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <label className="flex-1">
                                                <div className="flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed transition-all cursor-pointer border-gray-200 hover:border-blue-500/30 hover:bg-gray-50/50">
                                                    <Camera className="w-5 h-5 text-blue-600" />
                                                    <span className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">
                                                        {imagePreview ? 'Change Photo' : 'Add Photo (Required)'}
                                                    </span>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    className="hidden"
                                                    onChange={handleImageSelect}
                                                />
                                            </label>

                                            {imagePreview && (
                                                <div className={`p-3.5 rounded-xl border flex items-center justify-center transition-all ${location ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600 animate-pulse'}`}>
                                                    {locLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                                                </div>
                                            )}
                                        </div>

                                        {imagePreview && !location && !locLoading && (
                                            <button 
                                                onClick={captureLocation}
                                                className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2 px-1"
                                            >
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                Location required with image — Tap to capture
                                            </button>
                                        )}
                                        
                                        {stamping && (
                                            <div className="flex items-center gap-2.5 text-blue-600 text-[10px] font-bold uppercase tracking-widest px-1">
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                Digitally stamping query photo...
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleQuerySubmit}
                                        disabled={submitQueryLoading || stamping || !newQuery.title.trim() || !newQuery.message.trim() || !imageFile}
                                        className="w-full h-12 blue-gradient text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all btn-shadow disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                    >
                                        {submitQueryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4.5 h-4.5" />}
                                        Submit Query
                                    </button>
                                </div>
                            </div>
                        )}

                        {queriesLoading ? (
                            <div className="flex flex-col items-center justify-center py-24">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading Queries...</p>
                            </div>
                        ) : queries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                                <MessageSquare className="w-12 h-12 opacity-20 mb-4" />
                                <h3 className="text-lg font-display font-bold text-white/50">No Queries Yet</h3>
                                <p className="text-sm mt-1">Questions related to this project will appear here.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {queries.map((q) => (
                                    <div key={q._id} className={`${isClient ? 'bg-transparent' : 'bg-white p-6 rounded-[24px] border border-gray-50 shadow-lg group hover:border-blue-500/10 transition-all relative overflow-hidden'}`}>
                                        {isClient ? (
                                            /* ── Chat Style for Client ── */
                                            <div className="space-y-4 mb-10">
                                                <div className="flex flex-col items-end">
                                                    <div className="max-w-[100%] sm:max-w-[85%] bg-blue-600 text-white rounded-[24px] rounded-tr-none px-6 py-4 shadow-xl relative">
                                                        <div className="flex items-center justify-between gap-6 mb-1.5">
                                                            <h4 className="font-bold text-sm tracking-tight">{q.title}</h4>
                                                            <span className="text-[8px] font-bold opacity-70">{formatTime(q.createdAt)}</span>
                                                        </div>
                                                        <p className="text-sm leading-relaxed opacity-90">{q.message}</p>
                                                        
                                                        {q.imageUrl && (
                                                            <div className="mt-3 relative group/qimg cursor-pointer max-w-sm" onClick={() => setLightbox({ ...q, imageUrl: q.imageUrl })}>
                                                                <img
                                                                    src={q.imageUrl}
                                                                    alt="Query attachment"
                                                                    className="w-full h-auto max-h-[220px] object-cover rounded-xl border border-white/20 shadow-md transition-all group-hover/qimg:brightness-90"
                                                                />
                                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/qimg:opacity-100 transition-opacity">
                                                                    <Maximize2 className="w-5 h-5 text-white" />
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Status Indicator */}
                                                        <div className={`absolute -left-2 -top-2 px-2.5 py-1 rounded-lg text-[7px] font-bold uppercase tracking-widest shadow-lg border ${
                                                            q.status === 'open' ? 'bg-amber-400 text-white border-amber-300' : 'bg-emerald-500 text-white border-emerald-400'
                                                        }`}>
                                                            {q.status}
                                                        </div>
                                                    </div>
                                                </div>

                                                {q.response ? (
                                                    <div className="flex flex-col items-start translate-x-0">
                                                        <div className="max-w-[100%] sm:max-w-[85%] bg-white border border-gray-100 rounded-[24px] rounded-tl-none px-6 py-4 shadow-xl">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="w-7 h-7 rounded-full blue-gradient flex items-center justify-center text-white text-[10px] font-bold">
                                                                    {q.respondedBy?.name?.charAt(0) || 'T'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-blue-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                                        {q.respondedBy?.name} (Team)
                                                                    </p>
                                                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{formatTime(q.respondedAt)}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-[#333333] text-sm leading-relaxed italic font-medium pr-2">
                                                                "{q.response}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="pl-6">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse flex items-center gap-2.5">
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            Waiting for team response...
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* ── Card Style for Admin/Staff ── */
                                            <>
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full blue-gradient flex items-center justify-center text-white font-bold text-xs shadow-md">
                                                            {q.clientId?.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-[#1A1A1A] font-bold text-sm">{q.clientId?.name}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                                                <Clock className="w-3 h-3" />
                                                                {formatTime(q.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest border ${
                                                        q.status === 'open' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                                        q.status === 'answered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                        'bg-gray-50 text-gray-400 border-gray-100'
                                                    }`}>
                                                        {q.status}
                                                    </span>
                                                </div>
                                                <h4 className="text-[#1A1A1A] font-bold text-base mb-2">{q.title}</h4>
                                                <p className="text-gray-600 text-sm leading-relaxed mb-4">{q.message}</p>

                                                {q.imageUrl && (
                                                    <div className="mb-6 space-y-3">
                                                        <div className="relative group/qimg cursor-pointer max-w-md" onClick={() => setLightbox({ ...q, imageUrl: q.imageUrl })}>
                                                            <img
                                                                src={q.imageUrl}
                                                                alt="Query attachment"
                                                                className="w-full h-auto max-h-[260px] object-cover rounded-2xl border border-gray-100 shadow-sm transition-all group-hover/qimg:brightness-95"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/qimg:opacity-100 transition-opacity">
                                                                <Maximize2 className="w-6 h-6 text-white" />
                                                            </div>
                                                        </div>

                                                        {q.latitude && q.longitude && (
                                                            <a
                                                                href={`https://www.google.com/maps?q=${q.latitude},${q.longitude}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                            >
                                                                <MapPin className="w-3.5 h-3.5" />
                                                                View Captured Location
                                                                <ExternalLink className="w-3 h-3 ml-1" />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                {q.response ? (
                                                    <div className="mt-4 p-5 rounded-2xl bg-gray-50 border border-gray-100 border-l-4 border-l-emerald-500">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                                Response Sent
                                                            </p>
                                                            <span className="text-[8px] font-bold text-gray-400">{formatTime(q.respondedAt)}</span>
                                                        </div>
                                                        <p className="text-[#333333] text-sm italic font-medium">"{q.response}"</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-3">By {q.respondedBy?.name}</p>
                                                    </div>
                                                ) : (
                                                    (user?.role === 'admin' || user?.role === 'staff') && (
                                                        <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                                                            <textarea
                                                                placeholder="Write a response..."
                                                                rows={2}
                                                                value={responseMap[q._id] || ''}
                                                                onChange={(e) => setResponseMap({ ...responseMap, [q._id]: e.target.value })}
                                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                                                            />
                                                            <button
                                                                onClick={() => handleRespond(q._id)}
                                                                disabled={submittingResponse === q._id || !(responseMap[q._id]?.trim())}
                                                                className="w-full h-11 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border border-emerald-100 hover:bg-emerald-100 disabled:opacity-30 flex items-center justify-center gap-3"
                                                            >
                                                                {submittingResponse === q._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4.5 h-4.5" />}
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
                <div className="bg-white border border-gray-100 rounded-[28px] p-5 sm:p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] relative overflow-hidden flex-shrink-0">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-blue-500/5 blur-[70px] -ml-20 -mt-20 pointer-events-none"></div>

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="mb-4 relative inline-block">
                            <img src={imagePreview} alt="Preview" className="h-24 sm:h-28 w-auto rounded-2xl border-2 border-white shadow-xl" />
                            <button
                                onClick={clearImage}
                                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg border-2 border-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Stamping indicator */}
                    {stamping && (
                        <div className="mb-4 flex items-center gap-3 text-blue-600 text-[10px] font-bold uppercase tracking-widest font-body">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Digitally stamping image...
                        </div>
                    )}

                    <div className="flex flex-col gap-4 relative z-10">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Share progress with the client..."
                            rows={2}
                            className="w-full bg-gray-50 border border-gray-100 rounded-[20px] px-5 py-4 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:border-blue-500/30 focus:bg-white transition-all resize-none font-medium"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    handlePost();
                                }
                            }}
                        />

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {/* Image upload */}
                            <label className="flex-1 group/upload h-12 px-5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center sm:justify-start gap-3 text-gray-400 hover:text-blue-600 hover:border-blue-500/20 hover:bg-blue-50 transition-all cursor-pointer active:scale-95">
                                <Camera className="w-5 h-5 group-hover/upload:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Capture Photo</span>
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
                                className={`flex-1 h-12 px-5 rounded-2xl border flex items-center justify-center sm:justify-start gap-3 transition-all active:scale-95 ${location ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-500/20 hover:bg-blue-50'}`}
                            >
                                {locLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                                    {location ? `Located` : 'Pin Location'}
                                </span>
                            </button>

                            {/* Post */}
                            <button
                                onClick={handlePost}
                                disabled={posting || !message.trim() || stamping || !location}
                                className="sm:flex-[0.6] h-12 px-8 blue-gradient text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all btn-shadow disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-3 active:scale-95"
                            >
                                {posting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                Post
                            </button>
                        </div>

                        {/* Status bar */}
                        <div className="flex items-center justify-between px-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">
                                Press Ctrl + Enter to quickly post
                            </p>
                            {!location && (
                                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-2 animate-pulse">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Location needed
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Lightbox Modal ── */}
            {lightbox && (
                <div className="fixed inset-0 z-[200] flex md:items-center md:justify-center">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-500" onClick={() => setLightbox(null)}></div>
                    <div className="bg-white w-full h-full md:h-auto md:w-full md:max-w-4xl md:rounded-[32px] overflow-hidden shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] flex flex-col relative z-[210] animate-in slide-in-from-bottom md:zoom-in-95 duration-300 md:duration-500">
                        {/* Image container */}
                        <div className="flex-1 min-h-0 bg-gray-50 flex items-center justify-center relative">
                            <img
                                src={lightbox.imageUrl}
                                alt="Full size"
                                className="max-w-full max-h-[65vh] object-contain"
                            />
                            <button
                                onClick={() => setLightbox(null)}
                                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md border border-gray-100 flex items-center justify-center text-gray-800 hover:text-red-500 transition-all shadow-lg active:scale-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Info bar */}
                        <div className="shrink-0 p-6 sm:p-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 border-t border-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full blue-gradient flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                    {lightbox.createdBy?.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[#1A1A1A] font-bold text-base leading-none mb-1.5">{lightbox.createdBy?.name}</p>
                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatTime(lightbox.createdAt)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {lightbox.location?.latitude && lightbox.location?.longitude && (
                                    <a
                                        href={`https://www.google.com/maps?q=${lightbox.location.latitude},${lightbox.location.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 sm:flex-initial flex items-center justify-center gap-3 px-6 h-12 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"
                                    >
                                        <MapPin className="w-4 h-4" />
                                        <span>View Location</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectUpdates;
