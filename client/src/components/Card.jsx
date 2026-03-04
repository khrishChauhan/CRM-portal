export const Card = ({ children, title, subtitle, className = '', footer }) => {
    return (
        <div className={`glass rounded-[2.5rem] overflow-hidden group hover:border-indigo-500/30 transition-all duration-500 shadow-2xl ${className}`}>
            {(title || subtitle) && (
                <div className="px-8 py-8 border-b border-white/5 bg-white/[0.01]">
                    {title && <h3 className="text-2xl font-display font-bold text-white tracking-tight leading-none">{title}</h3>}
                    {subtitle && <p className="text-[11px] font-bold text-slate-500 mt-2 uppercase tracking-widest leading-none">{subtitle}</p>}
                </div>
            )}
            <div className="p-8">
                {children}
            </div>
            {footer && (
                <div className="px-8 py-5 bg-white/[0.02] border-t border-white/5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    {footer}
                </div>
            )}
        </div>
    );
};
