import React from 'react';
import { ClipboardList } from 'lucide-react';

const Loader = ({
    label = "Loading...",
    subLabel = "Please wait a moment",
    fullScreen = true,
    icon: Icon = ClipboardList,
    color = "indigo-600"
}) => {
    const containerClasses = fullScreen
        ? "fixed inset-0 z-[9999] flex items-center justify-center bg-white font-sans"
        : "flex flex-1 min-h-[60vh] items-center justify-center bg-transparent font-sans";

    const colorClass = `text-${color}`;
    const borderClass = `border-t-${color}`;

    return (
        <div className={containerClasses}>
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    {/* Outer ring */}
                    <div className="h-14 w-14 border-[2px] border-gray-100 rounded-full" />

                    {/* Spinner Ring */}
                    <div className={`absolute inset-0 h-14 w-14 border-[2px] border-transparent ${borderClass} rounded-full animate-spin`} />

                    {/* Central Icon */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Icon className={`h-5 w-5 ${colorClass} animate-pulse`} />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1.5 text-center px-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-800">
                        {label}
                    </p>
                    <div className="h-[1px] w-8 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        {subLabel}
                    </p>
                </div>

                {/* Progress dots */}
                <div className="flex gap-1 mt-1">
                    <div className={`h-1 w-1 rounded-full ${colorClass} opacity-20 animate-bounce [animation-delay:-0.3s]`} />
                    <div className={`h-1 w-1 rounded-full ${colorClass} opacity-40 animate-bounce [animation-delay:-0.15s]`} />
                    <div className={`h-1 w-1 rounded-full ${colorClass} opacity-20 animate-bounce`} />
                </div>
            </div>
        </div>
    );
};

export default Loader;
