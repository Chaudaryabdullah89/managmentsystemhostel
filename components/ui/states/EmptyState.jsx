import React from "react";

const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionSlot = null,
    iconWrapperClassName = "bg-gray-50 dark:bg-muted/10 border-gray-100 dark:border-border",
    iconClassName = "text-gray-400 dark:text-muted-foreground",
    containerClassName = "bg-white dark:bg-card border border-gray-100 dark:border-border rounded-3xl p-24 text-center border-dashed shadow-sm",
}) => {
    return (
        <div className={containerClassName}>
            {Icon && (
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border ${iconWrapperClassName}`}>
                    <Icon className={`h-8 w-8 ${iconClassName}`} />
                </div>
            )}
            <h3 className="text-lg font-bold text-gray-900 dark:text-foreground uppercase tracking-tight">
                {title}
            </h3>
            <p className="text-gray-400 dark:text-muted-foreground font-bold text-[10px] uppercase tracking-widest mt-1 max-w-[320px] mx-auto leading-relaxed">
                {description}
            </p>
            {actionSlot ? <div className="mt-8">{actionSlot}</div> : null}
        </div>
    );
};

export default EmptyState;
