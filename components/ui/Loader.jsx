import React from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';

const Loader = ({
    label = "Synchronizing Data",
    subLabel = "Accessing secure registry node...",
    fullScreen = true,
    icon: Icon = ClipboardList
}) => {
    const containerClasses = fullScreen
        ? "fixed inset-0 z-[9999] flex items-center justify-center bg-white font-sans"
        : "flex h-full min-h-[400px] items-center justify-center bg-transparent font-sans";

    return (
        <div className={containerClasses}>
            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    {/* Outer glow/ring */}
                    <div className="absolute inset-0 rounded-full bg-black/5 blur-xl scale-150 animate-pulse" />

                    {/* Spinner Ring */}
                    <div className="h-20 w-20 md:h-24 md:w-24 border-[3px] border-gray-100 border-t-black rounded-full animate-spin transition-all duration-1000" />

                    {/* Central Icon */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Icon className="h-8 w-8 md:h-10 md:w-10 text-black animate-pulse" />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 text-center px-6">
                    <p className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.4em] text-gray-900 drop-shadow-sm">
                        {label}
                    </p>
                    <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400 italic opacity-80">
                        {subLabel}
                    </p>
                </div>

                {/* Progress-like dots */}
                <div className="flex gap-1.5 mt-2">
                    <div className="h-1 w-1 rounded-full bg-black/20 animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-1 w-1 rounded-full bg-black/40 animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-1 w-1 rounded-full bg-black/20 animate-bounce" />
                </div>
            </div>
        </div>
    );
};

export default Loader;
