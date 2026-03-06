import { Component } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('🚨 ErrorBoundary caught:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                    {/* Background Texture & Glow */}
                    <div className="absolute inset-0 noise-bg opacity-[0.03] pointer-events-none z-50"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                    <div className="relative z-10 text-center animate-reveal">
                        <div className="glass-dark p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative max-w-lg w-full">
                            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                                <AlertCircle className="w-10 h-10 text-red-400" />
                            </div>

                            <h1 className="text-3xl font-display font-bold text-white tracking-tight uppercase mb-4 text-gradient">Something Went Wrong</h1>
                            <p className="text-slate-500 font-medium text-lg italic mb-10 leading-relaxed">
                                An unexpected error occurred. Please try reloading the page.
                            </p>

                            {this.state.error && (
                                <div className="text-left bg-slate-950/50 border border-white/5 p-6 rounded-2xl mb-10 overflow-hidden group">
                                    <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-3">Error Details</p>
                                    <pre className="text-[11px] font-mono text-indigo-400/70 overflow-x-auto max-h-32 scrollbar-thin">
                                        {this.state.error.toString()}
                                    </pre>
                                </div>
                            )}

                            <button
                                onClick={this.handleReset}
                                className="w-full inline-flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-[0.3em] py-5 px-10 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 group hover:-translate-y-1 active:scale-95"
                            >
                                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                                Reload App
                            </button>
                        </div>
                    </div>

                    {/* Cinematic details */}
                    <div className="absolute bottom-12 text-[10px] font-bold text-slate-700 uppercase tracking-[0.4em] animate-pulse">
                        Something went wrong // Please reload
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
