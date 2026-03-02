export const Input = ({ label, error, className = '', icon: Icon, ...props }) => {
    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label className="block text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon className="h-5 w-5 text-slate-400" />
                    </div>
                )}
                <input
                    className={`block w-full border border-slate-300 rounded-lg bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all sm:text-sm ${Icon ? 'pl-10' : 'pl-3'
                        } ${error ? 'border-red-500 ring-red-500' : ''} ${className}`}
                    {...props}
                />
            </div>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );
};
