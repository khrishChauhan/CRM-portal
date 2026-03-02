export const Card = ({ children, title, subtitle, className = '', footer }) => {
    return (
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
            {(title || subtitle) && (
                <div className="px-6 py-5 border-b border-slate-100">
                    {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
                    {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
            {footer && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-sm">
                    {footer}
                </div>
            )}
        </div>
    );
};
