import { Loader2 } from 'lucide-react';

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    className = '',
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-2xl font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 active:scale-95 tracking-wide uppercase text-[11px]";

    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_10px_20px_-10px_rgba(79,70,229,0.4)] focus:ring-indigo-500",
        secondary: "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5 focus:ring-slate-500",
        outline: "border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 focus:ring-slate-500",
        danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 focus:ring-red-500",
    };

    const sizes = {
        sm: "px-4 py-2 text-[9px]",
        md: "px-6 py-3 text-[10px]",
        lg: "px-8 py-4 text-[12px]",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2.5 animate-spin" />}
            {children}
        </button>
    );
};
