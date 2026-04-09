import React from "react";

const PageHeader = ({
    title,
    subtitleStart,
    subtitleEnd,
    leftSlot = null,
    rightSlot = null,
    maxWidthClass = "max-w-[1400px]",
    accentColorClass = "bg-blue-600",
    dotColorClass = "bg-blue-500",
    subtitleEndClass = "text-blue-600",
    stickyClassName = "bg-white dark:bg-background/80 backdrop-blur-md border-b dark:border-border sticky top-0 z-50 py-2 md:h-16",
    subtitleDotClassName = "",
}) => {
    return (
        <div className={stickyClassName}>
            <div className={`${maxWidthClass} mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0`}>
                <div className="flex items-center gap-3 md:gap-4">
                    {leftSlot}
                    <div className={`h-8 w-1 rounded-full shrink-0 ${accentColorClass}`} />
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-sm md:text-lg font-bold text-gray-900 dark:text-foreground tracking-tight uppercase">{title}</h1>
                        {(subtitleStart || subtitleEnd) && (
                            <div className="flex items-center gap-2 min-w-0">
                                {subtitleStart && (
                                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-muted-foreground truncate">
                                        {subtitleStart}
                                    </span>
                                )}
                                {subtitleStart && subtitleEnd && (
                                    <div className={`h-1 w-1 rounded-full ${dotColorClass} ${subtitleDotClassName}`} />
                                )}
                                {subtitleEnd && (
                                    <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${subtitleEndClass}`}>
                                        {subtitleEnd}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {rightSlot}
            </div>
        </div>
    );
};

export default PageHeader;
