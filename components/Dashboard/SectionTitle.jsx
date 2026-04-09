import React from "react";

const SectionTitle = ({
    title,
    rightText = null,
    accentColorClass = "bg-blue-600",
    containerClassName = "flex items-center gap-3 px-1",
    titleClassName = "text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-foreground",
    rightTextClassName = "text-[9px] font-black text-gray-400 dark:text-muted-foreground uppercase tracking-widest ml-auto",
}) => {
    return (
        <div className={containerClassName}>
            <div className={`h-5 w-1 rounded-full ${accentColorClass}`} />
            <h3 className={titleClassName}>{title}</h3>
            {rightText ? <span className={rightTextClassName}>{rightText}</span> : null}
        </div>
    );
};

export default SectionTitle;
