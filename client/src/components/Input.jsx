export const Input = ({ label, error, className = '', icon: Icon, ...props }) => {
    return (
        <div className="w-full space-y-2">
            {label && (
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Icon className="h-5 w-5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                )}
                <input
                    className={`block w-full border border-white/5 rounded-2xl bg-white/[0.02] text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-medium py-3.5 ${Icon ? 'pl-12' : 'pl-5'
                        } ${error ? 'border-red-500/50 ring-red-500/10' : ''} ${className}`}
                    {...props}
                />
            </div>
            {error && <p className="text-[10px] font-bold text-red-400 mt-1.5 ml-1 uppercase tracking-wider">{error}</p>}
        </div>
    );
};
