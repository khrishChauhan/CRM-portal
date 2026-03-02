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
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-300",
        outline: "border border-slate-200 text-slate-700 hover:bg-slate-50 focus:ring-slate-300",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2.5 text-sm",
        lg: "px-6 py-3.5 text-base",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {children}
        </button>
    );
};
